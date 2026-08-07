"use client";

import { useCallback, useEffect, useState } from "react";
import FinanceManager from "@/components/FinanceManager";
import { Card } from "@/components/ui";
import { apiGet } from "@/lib/apiClient";
import { fmtRp, todayStr } from "@/lib/constants";

export default function KeuanganPage() {
  const [patients, setPatients] = useState([]);
  const [owners, setOwners] = useState([]);
  const [staff, setStaff] = useState([]);
  const [finance, setFinance] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const loadSummary = useCallback(async () => {
    const [p, o, s, f] = await Promise.all([apiGet("patients"), apiGet("owners"), apiGet("staff"), apiGet("finance")]);
    setPatients(p); setOwners(o); setStaff(s); setFinance(f); setLoaded(true);
  }, []);

  useEffect(() => { loadSummary(); }, [loadSummary]);

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
      <FinanceManager patients={patients} owners={owners} staff={staff} onChanged={loadSummary} />
    </div>
  );
}
