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

export const SPECIES = ["Anjing", "Kucing", "Kelinci", "Burung", "Lainnya"];
export const SPECIES_COLOR = {
  Anjing: "#3b82f6",
  Kucing: "#f59e0b",
  Kelinci: "#8b5cf6",
  Burung: "#ef4444",
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
export const STAFF_ROLES = ["Admin", "Dokter", "Resepsionis", "Paramedis", "Groomer"];

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
