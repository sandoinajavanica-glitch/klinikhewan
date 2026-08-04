"use client";

import { useEffect, useState } from "react";
import ResourceCrud from "@/components/ResourceCrud";
import { Card, Badge } from "@/components/ui";
import { apiGet } from "@/lib/apiClient";
import { fmtRp, fmtDate, todayStr } from "@/lib/constants";

const TYPE_COLOR = { Masuk: "#10b981", Keluar: "#ef4444", Piutang: "#f59e0b" };

export default function KeuanganPage() {
  const [patients, setPatients] = useState([]);
  const [finance, setFinance] = useState([]);
  const [loaded, setLoaded] = useState(false);

  async function loadSummary() {
    const [p, f] = await Promise.all([apiGet("patients"), apiGet("finance")]);
    setPatients(p); setFinance(f); setLoaded(true);
  }
  useEffect(() => { loadSummary(); }, []);

  if (!loaded) return <div className="empty-state">Memuat data...</div>;

  const today = todayStr();
  const monthPrefix = today.slice(0, 7);
  const sumBy = (type, pred) => finance.filter((f) => f.type === type && pred(f)).reduce((s, f) => s + Number(f.amount || 0), 0);

  const masukHarian = sumBy("Masuk", (f) => f.date === today);
  const keluarHarian = sumBy("Keluar", (f) => f.date === today);
  const masukBulanan = sumBy("Masuk", (f) => (f.date || "").slice(0, 7) === monthPrefix);
  const keluarBulanan = sumBy("Keluar", (f) => (f.date || "").slice(0, 7) === monthPrefix);
  const totalPiutang = sumBy("Piutang", () => true);
  const saldoBulanan = masukBulanan - keluarBulanan;

  const patientOptions = [{ value: "", label: "- Umum (tanpa pasien) -" }, ...patients.map((p) => ({ value: p.id, label: p.name }))];

  const fields = [
    { name: "date", label: "Tanggal", type: "date", default: today, required: true },
    { name: "patientId", label: "Pasien", type: "select", options: patientOptions },
    { name: "description", label: "Deskripsi", placeholder: "mis. Jasa dokter, obat, tindakan, atau belanja stok", required: true },
    { name: "amount", label: "Jumlah (Rp)", type: "number", required: true },
    {
      name: "type", label: "Tipe", type: "select", default: "Masuk",
      options: [
        { value: "Masuk", label: "Masuk (pemasukan)" },
        { value: "Keluar", label: "Keluar (pengeluaran / belanja)" },
        { value: "Piutang", label: "Piutang" },
      ],
    },
  ];

  const columns = [
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date) },
    { key: "patient", label: "Pasien", render: (r) => patients.find((p) => p.id === r.patientId)?.name || "Umum" },
    { key: "description", label: "Deskripsi" },
    { key: "type", label: "Tipe", render: (r) => <Badge color={TYPE_COLOR[r.type] || "#6b7280"}>{r.type}</Badge> },
    { key: "amount", label: "Jumlah", render: (r) => fmtRp(r.amount) },
  ];

  return (
    <div>
      <div className="grid stat-grid" style={{ marginBottom: 16 }}>
        <Card className="stat-card">
          <div className="stat-label">Pemasukan Hari Ini</div>
          <div className="stat-value" style={{ color: "#059669" }}>{fmtRp(masukHarian)}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Pengeluaran Hari Ini</div>
          <div className="stat-value" style={{ color: "#ef4444" }}>{fmtRp(keluarHarian)}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Pemasukan Bulan Ini</div>
          <div className="stat-value" style={{ color: "#059669" }}>{fmtRp(masukBulanan)}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Pengeluaran Bulan Ini</div>
          <div className="stat-value" style={{ color: "#ef4444" }}>{fmtRp(keluarBulanan)}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Saldo Bersih Bulan Ini</div>
          <div className="stat-value" style={{ color: saldoBulanan >= 0 ? "#059669" : "#ef4444" }}>{fmtRp(saldoBulanan)}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Total Piutang</div>
          <div className="stat-value" style={{ color: "#f59e0b" }}>{fmtRp(totalPiutang)}</div>
        </Card>
      </div>
      <ResourceCrud
        resource="finance"
        title="Transaksi"
        fields={fields}
        columns={columns}
        emptyText="Belum ada transaksi."
        onBeforeSave={(f) => ({ ...f, amount: Number(f.amount) || 0 })}
      />
    </div>
  );
}