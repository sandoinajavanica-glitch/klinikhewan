import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { getOne, getAll } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { fmtDate } from "@/lib/constants";

function section(doc, title, entries, fieldDefs) {
  doc.moveDown(1.2);
  doc.fontSize(13).font("Helvetica-Bold").fillColor("#059669").text(title);
  doc.moveDown(0.3);
  doc.fillColor("#000000");

  if (!entries.length) {
    doc.fontSize(10).font("Helvetica-Oblique").fillColor("#9ca3af").text("Tidak ada data.");
    doc.fillColor("#000000");
    return;
  }

  entries.forEach((e) => {
    doc.fontSize(10.5).font("Helvetica-Bold").fillColor("#111827").text(fmtDate(e.date));
    fieldDefs.forEach((fd) => {
      const val = e[fd.key];
      if (val) {
        doc.fontSize(10).font("Helvetica").fillColor("#374151").text(`${fd.label}: ${val}`, { indent: 10 });
      }
    });
    doc.moveDown(0.6);
  });
}

export async function GET(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const { id } = params;

  try {
    const patient = await getOne("patients", id);
    if (!patient) return NextResponse.json({ error: "Pasien tidak ditemukan" }, { status: 404 });

    const owner = patient.ownerId ? await getOne("owners", patient.ownerId) : null;

    const [medicalNotes, careLog, inpatientCare, vaccinations, procedures, labResults] = await Promise.all([
      getAll("medicalNotes"),
      getAll("careLog"),
      getAll("inpatientCare"),
      getAll("vaccinations"),
      getAll("procedures"),
      getAll("labResults"),
    ]);

    const byDateDesc = (a, b) => (b.date || "").localeCompare(a.date || "");
    const notesForPatient = medicalNotes.filter((r) => r.patientId === id).sort(byDateDesc);
    const careLogForPatient = careLog.filter((r) => r.patientId === id).sort(byDateDesc);
    const inpatientForPatient = inpatientCare.filter((r) => r.patientId === id).sort(byDateDesc);
    const vaccinesForPatient = vaccinations.filter((r) => r.patientId === id).sort(byDateDesc);
    const proceduresForPatient = procedures.filter((r) => r.patientId === id).sort(byDateDesc);
    const labForPatient = labResults.filter((r) => r.patientId === id).sort(byDateDesc);

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    const endPromise = new Promise((resolve) => doc.on("end", resolve));

    // Header
    doc.fontSize(18).font("Helvetica-Bold").fillColor("#059669").text("Garnet Vet Clinic", { continued: false });
    doc.fontSize(13).font("Helvetica-Bold").fillColor("#111827").text("Rekam Medis Pasien");
    doc.fontSize(9).font("Helvetica").fillColor("#9ca3af").text(`Dicetak: ${new Date().toLocaleString("id-ID")}`);
    doc.moveDown(1);
    doc.strokeColor("#e5e7eb").moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.8);

    // Info pasien
    doc.fontSize(12).font("Helvetica-Bold").fillColor("#111827").text(patient.name || "-");
    doc.fontSize(10).font("Helvetica").fillColor("#374151");
    doc.text(`Jenis: ${patient.species || "-"}   Ras: ${patient.breed || "-"}`);
    doc.text(`Umur: ${patient.age || "-"}   Berat: ${patient.weight || "-"}`);
    doc.text(`Pemilik: ${owner ? owner.name : "-"}   Telepon: ${owner ? owner.phone || "-" : "-"}`);
    if (owner && owner.address) doc.text(`Alamat: ${owner.address}`);

    section(doc, "Catatan Medis", notesForPatient, [
      { key: "anamnesis", label: "Anamnesa" },
      { key: "examination", label: "Hasil Pemeriksaan" },
      { key: "diagnosis", label: "Diagnosa" },
      { key: "therapy", label: "Terapi" },
    ]);

    section(doc, "Log Perawatan", careLogForPatient, [
      { key: "time", label: "Waktu" },
      { key: "condition", label: "Kondisi Fisik" },
      { key: "actionLog", label: "Log Tindakan" },
    ]);

    section(doc, "Rawat Inap", inpatientForPatient, [
      { key: "period", label: "Waktu" },
      { key: "description", label: "Deskripsi" },
      { key: "treatment", label: "Tindakan Pengobatan" },
    ]);

    section(doc, "Riwayat Vaksin", vaccinesForPatient, [
      { key: "vaccineType", label: "Jenis Vaksin" },
      { key: "vaccineNumber", label: "Nomor Vaksin" },
      { key: "doctor", label: "Dokter" },
    ]);

    section(doc, "Tindakan", proceduresForPatient, [
      { key: "procedureName", label: "Nama Tindakan" },
      { key: "description", label: "Deskripsi" },
      { key: "medication", label: "Obat / Anastesi" },
      { key: "notes", label: "Catatan Tambahan" },
    ]);

    section(doc, "Hasil Lab", labForPatient, [
      { key: "testName", label: "Nama Tes / Jenis Uji" },
      { key: "value", label: "Nilai" },
      { key: "unit", label: "Satuan" },
    ]);

    doc.end();
    await endPromise;
    const buffer = Buffer.concat(chunks);

    const safeName = (patient.name || "pasien").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const dateStr = new Date().toISOString().slice(0, 10);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="rekam-medis-${safeName}-${dateStr}.pdf"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal membuat PDF rekam medis" }, { status: 500 });
  }
}
