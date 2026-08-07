"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Card, PrimaryBtn } from "./ui";
import { useToast } from "./Toast";

export default function BackupManager({ isDemo = false }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch("/api/backup/export");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Gagal membuat backup");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : `draftklinik-backup-${new Date().toISOString().slice(0, 10)}.sql`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Backup berhasil diunduh.");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setExporting(false);
    }
  }

  function handleFileChange(e) {
    setSelectedFile(e.target.files?.[0] || null);
  }

  async function handleImport() {
    if (!selectedFile || isDemo) return;
    const confirmed = window.confirm(
      "PERINGATAN: Ini akan MENGHAPUS SEMUA data klinik saat ini (pasien, pemilik, rekam medis, keuangan, dll) dan menggantikannya dengan isi file backup ini. Tindakan ini tidak bisa dibatalkan.\n\nLanjutkan?"
    );
    if (!confirmed) return;

    setImporting(true);
    try {
      const form = new FormData();
      form.append("file", selectedFile);
      const res = await fetch("/api/backup/import", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Gagal memulihkan backup");
      toast.success("Data berhasil dipulihkan dari backup. Muat ulang halaman untuk melihat data terbaru.", { duration: 8000 });
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 620 }}>
      <Card style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>Ekspor Backup</div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 14 }}>
          Mengunduh seluruh data klinik (pemilik, pasien, jadwal, rekam medis,
          keuangan, inventaris, staf) dalam satu file <code>.sql</code> yang
          bisa dipakai untuk memulihkan data kapan saja. Nama file otomatis
          memuat tanggal backup dibuat.
        </div>
        <PrimaryBtn onClick={handleExport} disabled={exporting}>
          <Download size={15} /> {exporting ? "Membuat backup..." : "Unduh Backup (.sql)"}
        </PrimaryBtn>
      </Card>

      <Card style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 6 }}>Impor / Pulihkan Backup</div>
        <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 14 }}>
          Pilih file <code>.sql</code> hasil ekspor sebelumnya untuk memulihkan
          data. <strong>Semua data yang ada saat ini akan dihapus dan
          digantikan</strong> dengan isi file ini — pastikan file yang dipilih
          benar sebelum melanjutkan.
        </div>
        {isDemo ? (
          <div style={{ fontSize: 12.5, color: "#b91c1c" }}>Akun demo tidak dapat mengimpor/memulihkan backup.</div>
        ) : (
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input ref={fileRef} type="file" accept=".sql" onChange={handleFileChange} />
            <PrimaryBtn onClick={handleImport} disabled={!selectedFile || importing} style={{ background: "#b91c1c" }}>
              <Upload size={15} /> {importing ? "Memulihkan..." : "Import & Timpa Data"}
            </PrimaryBtn>
          </div>
        )}
      </Card>
    </div>
  );
}
