"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";
import { apiGet } from "@/lib/apiClient";
import { fmtRp } from "@/lib/constants";

export default function LaporanPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([
      apiGet("patients"), apiGet("owners"), apiGet("appointments"),
      apiGet("medicalNotes"), apiGet("vaccinations"), apiGet("procedures"), apiGet("labResults"),
      apiGet("finance"),
    ]).then(([patients, owners, appointments, medicalNotes, vaccinations, procedures, labResults, finance]) =>
      setData({ patients, owners, appointments, medicalNotes, vaccinations, procedures, labResults, finance })
    );
  }, []);

  if (!data) return <div className="empty-state">Memuat laporan...</div>;
  const { patients, owners, appointments, medicalNotes, vaccinations, procedures, labResults, finance } = data;
  const totalRekamMedis = medicalNotes.length + vaccinations.length + procedures.length + labResults.length;

  const speciesCount = {};
  patients.forEach((p) => { speciesCount[p.species] = (speciesCount[p.species] || 0) + 1; });

  const byDoctor = {};
  appointments.forEach((a) => { if (a.doctor) byDoctor[a.doctor] = (byDoctor[a.doctor] || 0) + 1; });

  const byDay = {};
  appointments.forEach((a) => { if (a.date) byDay[a.date] = (byDay[a.date] || 0) + 1; });
  const recentDays = Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);

  const revenueByMonth = {};
  const expenseByMonth = {};
  finance.forEach((f) => {
    const m = (f.date || "").slice(0, 7);
    if (!m) return;
    if (f.type === "Masuk") revenueByMonth[m] = (revenueByMonth[m] || 0) + Number(f.amount || 0);
    if (f.type === "Keluar") expenseByMonth[m] = (expenseByMonth[m] || 0) + Number(f.amount || 0);
  });
  const allMonths = Array.from(new Set([...Object.keys(revenueByMonth), ...Object.keys(expenseByMonth)])).sort();

  const diagnosisFreq = {};
  medicalNotes.forEach((r) => { if (r.diagnosis) diagnosisFreq[r.diagnosis] = (diagnosisFreq[r.diagnosis] || 0) + 1; });
  const topDiagnosis = Object.entries(diagnosisFreq).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="grid grid-2col">
      <Card style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 12 }}>Ringkasan Umum</div>
        <div style={{ fontSize: 13.5, lineHeight: 2 }}>
          <div>Total Pasien Terdaftar: <strong>{patients.length}</strong></div>
          <div>Total Pemilik Terdaftar: <strong>{owners.length}</strong></div>
          <div>Total Reservasi: <strong>{appointments.length}</strong></div>
          <div>Total Rekam Medis: <strong>{totalRekamMedis}</strong></div>
        </div>
      </Card>

      <Card style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 12 }}>Pasien per Jenis</div>
        {Object.keys(speciesCount).length === 0 ? <div className="empty-state">Belum ada data.</div> : Object.entries(speciesCount).map(([k, v]) => (
          <Row key={k} label={k} value={v} />
        ))}
      </Card>

      <Card style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 12 }}>Kunjungan per Dokter (Performa)</div>
        {Object.keys(byDoctor).length === 0 ? <div className="empty-state">Belum ada data.</div> : Object.entries(byDoctor).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
          <Row key={k} label={k} value={`${v} kunjungan`} />
        ))}
      </Card>

      <Card style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 12 }}>Kunjungan per Hari (7 hari terakhir tercatat)</div>
        {recentDays.length === 0 ? <div className="empty-state">Belum ada data.</div> : recentDays.map(([k, v]) => (
          <Row key={k} label={k} value={`${v} kunjungan`} />
        ))}
      </Card>

      <Card style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 12 }}>Keuangan per Bulan</div>
        {allMonths.length === 0 ? <div className="empty-state">Belum ada data.</div> : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th>Masuk</th>
                  <th>Keluar</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {allMonths.map((m) => {
                  const masuk = revenueByMonth[m] || 0;
                  const keluar = expenseByMonth[m] || 0;
                  const saldo = masuk - keluar;
                  return (
                    <tr key={m}>
                      <td>{m}</td>
                      <td style={{ color: "#059669" }}>{fmtRp(masuk)}</td>
                      <td style={{ color: "#ef4444" }}>{fmtRp(keluar)}</td>
                      <td style={{ color: saldo >= 0 ? "#059669" : "#ef4444", fontWeight: 600 }}>{fmtRp(saldo)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card style={{ padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 12 }}>Diagnosis / Kasus Tersering</div>
        {topDiagnosis.length === 0 ? <div className="empty-state">Belum ada data.</div> : topDiagnosis.map(([k, v]) => (
          <Row key={k} label={k} value={`${v}x`} />
        ))}
      </Card>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
      <span>{label}</span><strong>{value}</strong>
    </div>
  );
}