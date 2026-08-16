export const NAV = [
  { href: "/dashboard", label: "Dasbor", key: "dashboard" },
  { href: "/pasien", label: "Pasien", key: "pasien" },
  { href: "/pemilik", label: "Pemilik", key: "pemilik" },
  { href: "/jadwal", label: "Jadwal", key: "jadwal" },
  { href: "/rekam-medis", label: "Rekam Medis", key: "rekam-medis" },
  { href: "/keuangan", label: "Keuangan", key: "keuangan" },
  { href: "/inventaris", label: "Inventaris", key: "inventaris" },
  { href: "/papan-kerja", label: "Papan Kerja", key: "papan-kerja" },
  { href: "/laporan", label: "Laporan", key: "laporan" },
  { href: "/pengaturan", label: "Pengaturan", key: "pengaturan", roles: ["Admin"] },
];

export const SPECIES = ["Anjing", "Kucing", "Kelinci", "Burung", "Reptil", "Lainnya"];
export const SPECIES_COLOR = {
  Anjing: "#3b82f6",
  Kucing: "#f59e0b",
  Kelinci: "#8b5cf6",
  Burung: "#ef4444",
  Reptil: "#0ea5e9",
  Lainnya: "#10b981",
};

export const APPT_STATUS = ["Menunggu", "Diperiksa", "Selesai", "Dibatalkan"];
export const STATUS_COLOR = {
  Menunggu: "#3b82f6",
  Diperiksa: "#f59e0b",
  Selesai: "#10b981",
  Dibatalkan: "#ef4444",
};

export const INVENTORY_CATEGORIES = ["Obat", "Vaksin", "Alat Medis", "Lainnya"];
export const STAFF_ROLES = ["Admin", "Dokter", "Resepsionis", "Paramedis"];

export function fmtRp(n) {
  return "Rp " + (Number(n) || 0).toLocaleString("id-ID");
}

export function fmtDate(d) {
  if (!d) return "-";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// --- Invoice / Nota multi-item & pengiriman (WA / Email) ---

// Token acak untuk akses publik nota (dipakai di link WhatsApp) tanpa perlu login.
export function genShareToken() {
  return (
    Math.random().toString(36).slice(2, 10) +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 6)
  );
}

// Ubah nomor telepon Indonesia (mis. "0812-3456-7890") menjadi format
// internasional tanpa simbol yang dipakai wa.me (mis. "6281234567890").
export function toWaNumber(phone) {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) digits = "62" + digits.slice(1);
  else if (!digits.startsWith("62")) digits = "62" + digits;
  return digits;
}

// Satu baris rincian item finance/invoice: { id, patientId, description, qty, price }
export function itemSubtotal(item) {
  return (Number(item?.qty) || 0) * (Number(item?.price) || 0);
}

// Ambil daftar rincian item dari transaksi, dengan fallback ke data lama
// (transaksi sebelum fitur rincian item ditambahkan hanya punya
// description + amount tunggal).
export function normalizeFinanceItems(tx) {
  if (Array.isArray(tx?.items) && tx.items.length) return tx.items;
  return [
    {
      id: "legacy",
      patientId: tx?.patientId || "",
      description: tx?.description || "-",
      qty: 1,
      price: Number(tx?.amount) || 0,
    },
  ];
}

// Ambil daftar patientId unik yang terkait transaksi (mendukung data lama
// `patientId` tunggal maupun data baru `patientIds` / rincian item).
export function financePatientIds(tx) {
  if (Array.isArray(tx?.patientIds) && tx.patientIds.length) return tx.patientIds;
  const fromItems = Array.isArray(tx?.items) ? tx.items.map((i) => i.patientId).filter(Boolean) : [];
  if (fromItems.length) return [...new Set(fromItems)];
  return tx?.patientId ? [tx.patientId] : [];
}

// --- Umur <-> Tanggal Lahir (saling terkoneksi, selalu mengikuti tanggal saat ini) ---

// Hitung perkiraan tanggal lahir dari umur (dalam tahun, boleh desimal, mis. 0.5 = 6 bulan)
export function ageYearsToDOB(ageYears, from = new Date()) {
  if (ageYears === "" || ageYears === null || ageYears === undefined || isNaN(Number(ageYears))) return "";
  const totalMonths = Math.round(Number(ageYears) * 12);
  const d = new Date(from);
  d.setDate(1); // hindari overflow tanggal saat mundur bulan
  d.setMonth(d.getMonth() - totalMonths);
  d.setDate(Math.min(from.getDate(), new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d.toISOString().slice(0, 10);
}

// Hitung umur (dalam tahun, 1 desimal) dari tanggal lahir, relatif terhadap tanggal saat ini
export function dobToAgeYears(dobStr, from = new Date()) {
  if (!dobStr) return "";
  const dob = new Date(dobStr + "T00:00:00");
  if (isNaN(dob.getTime())) return "";
  let months = (from.getFullYear() - dob.getFullYear()) * 12 + (from.getMonth() - dob.getMonth());
  if (from.getDate() < dob.getDate()) months -= 1;
  if (months < 0) months = 0;
  return Math.round((months / 12) * 10) / 10;
}

// Label umur yang mudah dibaca (mis. "2 tahun 3 bulan"), relatif terhadap tanggal saat ini
export function dobToAgeLabel(dobStr, from = new Date()) {
  if (!dobStr) return "";
  const dob = new Date(dobStr + "T00:00:00");
  if (isNaN(dob.getTime())) return "";
  let months = (from.getFullYear() - dob.getFullYear()) * 12 + (from.getMonth() - dob.getMonth());
  if (from.getDate() < dob.getDate()) months -= 1;
  if (months < 0) months = 0;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0 && remMonths === 0) return "Baru lahir";
  if (years === 0) return `${remMonths} bulan`;
  if (remMonths === 0) return `${years} tahun`;
  return `${years} tahun ${remMonths} bulan`;
}
