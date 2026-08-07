import PDFDocument from "pdfkit";
import { fmtRp, fmtDate, normalizeFinanceItems } from "@/lib/constants";
import { CLINIC_LOGO_BASE64 } from "@/lib/logoBase64";

export const CLINIC_NAME = "Lareangon";
export const CLINIC_ADDRESS = "Jalan Jendral Sudirman Nomor 65, Gang Buntu Nomor 34, Kabupaten Kota";

const TYPE_INFO = {
  Masuk: { docTitle: "NOTA PEMBAYARAN", statusLabel: "LUNAS", color: "#059669" },
  Piutang: { docTitle: "NOTA PIUTANG", statusLabel: "BELUM LUNAS", color: "#f59e0b" },
  Keluar: { docTitle: "NOTA PENGELUARAN", statusLabel: "PENGELUARAN", color: "#ef4444" },
};

const PAGE_BOTTOM = 740;

/**
 * Bangun PDF nota/invoice dari satu transaksi finance.
 * transaction: record dari resource "finance" (bisa punya `items[]` rincian,
 *   atau format lama patientId+description+amount tunggal).
 * patients: semua pasien terkait transaksi ini (array, bisa lebih dari satu
 *   jika satu invoice mencakup beberapa pasien dari pemilik yang sama).
 * owner: data pemilik (boleh null untuk transaksi umum/tanpa pasien).
 * Mengembalikan Buffer PDF.
 */
export async function buildInvoicePdf({ transaction, patients = [], owner = null }) {
  const info = TYPE_INFO[transaction.type] || TYPE_INFO.Masuk;
  const invoiceNo = `INV-${String(transaction.id).toUpperCase()}`;
  const items = normalizeFinanceItems(transaction);
  const patientById = new Map(patients.map((p) => [p.id, p]));

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const endPromise = new Promise((resolve) => doc.on("end", resolve));

  // --- Header: logo + nama klinik, judul dokumen di kanan ---
  let logoDrawn = false;
  try {
    const logoBuffer = Buffer.from(CLINIC_LOGO_BASE64, "base64");
    doc.image(logoBuffer, 50, 45, { width: 46 });
    logoDrawn = true;
  } catch (e) {
    // Kalau logo gagal dimuat, lanjutkan tanpa logo.
  }

  const textX = logoDrawn ? 106 : 50;
  const leftWidth = 300 - textX - 10;
  doc.fontSize(16).font("Helvetica-Bold").fillColor("#111827").text(CLINIC_NAME, textX, 50);
  doc.fontSize(8.5).font("Helvetica").fillColor("#6b7280").text("Klinik Hewan", textX, 70);
  doc.fontSize(7.5).font("Helvetica").fillColor("#9ca3af").text(CLINIC_ADDRESS, textX, 81, { width: leftWidth });
  const leftBottom = doc.y;

  doc.fontSize(18).font("Helvetica-Bold").fillColor(info.color).text(info.docTitle, 300, 48, { width: 245, align: "right" });
  doc.fontSize(9.5).font("Helvetica").fillColor("#374151").text(`No: ${invoiceNo}`, 300, 72, { width: 245, align: "right" });
  doc.text(`Tanggal: ${fmtDate(transaction.date)}`, 300, 86, { width: 245, align: "right" });
  let rightBottom = 97;
  if (transaction.doctor) {
    doc.text(`Dokter: ${transaction.doctor}`, 300, 100, { width: 245, align: "right" });
    rightBottom = 111;
  }

  doc.y = Math.max(leftBottom, rightBottom) + 10;
  doc.strokeColor("#e5e7eb").moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);

  // --- Kepada / Bill To (mendukung beberapa pasien dari pemilik yang sama) ---
  doc.fontSize(9).font("Helvetica-Bold").fillColor("#6b7280").text("KEPADA", 50, doc.y);
  doc.moveDown(0.3);
  if (owner) {
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#111827").text(owner.name);
    doc.fontSize(9.5).font("Helvetica").fillColor("#374151");
    if (patients.length) {
      const patientLine = patients
        .map((p) => `${p.name}${p.species ? ` (${p.species}${p.breed ? " - " + p.breed : ""})` : ""}`)
        .join(", ");
      doc.text(`Pasien: ${patientLine}`, { width: 495 });
    }
    if (owner.phone) doc.text(`Telepon: ${owner.phone}`);
    if (owner.address) doc.text(`Alamat: ${owner.address}`);
  } else if (patients.length) {
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#111827").text(patients.map((p) => p.name).join(", "));
  } else {
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#111827").text("Umum (tanpa pasien)");
  }

  doc.moveDown(1.5);

  // --- Tabel rincian item ---
  const showPatientCol = patients.length > 1;
  const col = showPatientCol
    ? { no: 50, patient: 78, desc: 165, qty: 380, price: 415, amount: 480 }
    : { no: 50, desc: 85, qty: 355, price: 400, amount: 470 };

  function drawTableHeader(y) {
    doc.rect(50, y, 495, 22).fill("#f3f4f6");
    doc.fillColor("#374151").fontSize(9).font("Helvetica-Bold");
    doc.text("No", col.no + 5, y + 6);
    if (showPatientCol) doc.text("Pasien", col.patient, y + 6, { width: 82 });
    doc.text("Deskripsi", col.desc, y + 6, { width: col.qty - col.desc - 8 });
    doc.text("Qty", col.qty, y + 6, { width: 30, align: "right" });
    doc.text("Harga", col.price, y + 6, { width: 60, align: "right" });
    doc.text("Subtotal", col.amount, y + 6, { width: 65, align: "right" });
    return y + 22;
  }

  let y = drawTableHeader(doc.y);
  let total = 0;

  items.forEach((item, idx) => {
    const qty = Number(item.qty) || 1;
    const price = Number(item.price) || 0;
    const subtotal = qty * price;
    total += subtotal;

    const descWidth = col.qty - col.desc - 8;
    const rowHeight = Math.max(24, doc.heightOfString(item.description || "-", { width: descWidth }) + 12);

    if (y + rowHeight > PAGE_BOTTOM) {
      doc.addPage();
      y = drawTableHeader(70);
    }

    doc.fontSize(9.5).font("Helvetica").fillColor("#111827");
    doc.text(String(idx + 1), col.no + 5, y + 7);
    if (showPatientCol) {
      const pName = patientById.get(item.patientId)?.name || "Umum";
      doc.text(pName, col.patient, y + 7, { width: 82 });
    }
    doc.text(item.description || "-", col.desc, y + 7, { width: descWidth });
    doc.text(String(qty), col.qty, y + 7, { width: 30, align: "right" });
    doc.text(fmtRp(price), col.price, y + 7, { width: 60, align: "right" });
    doc.text(fmtRp(subtotal), col.amount, y + 7, { width: 65, align: "right" });

    doc.strokeColor("#e5e7eb").moveTo(50, y + rowHeight).lineTo(545, y + rowHeight).stroke();
    y += rowHeight;
  });

  if (y + 90 > PAGE_BOTTOM) {
    doc.addPage();
    y = 70;
  }

  const totalY = y + 12;
  doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#111827").text("TOTAL", col.desc, totalY);
  doc.fontSize(12).font("Helvetica-Bold").fillColor(info.color).text(fmtRp(total), col.amount - 10, totalY - 1, { width: 75, align: "right" });

  // --- Status badge ---
  const badgeY = totalY + 34;
  doc.roundedRect(50, badgeY, 120, 24, 4).fillColor(info.color + "22").fill();
  doc.fontSize(10).font("Helvetica-Bold").fillColor(info.color).text(info.statusLabel, 50, badgeY + 7, { width: 120, align: "center" });

  // --- Tanda tangan ---
  const signY = badgeY + 70;
  doc.fontSize(9.5).font("Helvetica").fillColor("#374151").text("Hormat kami,", 380, signY, { width: 165, align: "center" });
  doc.fontSize(9.5).font("Helvetica-Bold").fillColor("#111827").text(CLINIC_NAME, 380, signY + 60, { width: 165, align: "center" });

  // --- Footer ---
  doc.fontSize(8).font("Helvetica").fillColor("#9ca3af").text(
    `Terima kasih atas kepercayaan Anda. Dicetak: ${new Date().toLocaleString("id-ID")}`,
    50, PAGE_BOTTOM + 20, { width: 495, align: "center" }
  );

  doc.end();
  await endPromise;
  return { buffer: Buffer.concat(chunks), invoiceNo, total };
}
