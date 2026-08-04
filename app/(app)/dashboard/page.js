"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { Calendar, PawPrint, DollarSign, FileText } from "lucide-react";
import { Card } from "@/components/ui";
import { apiGet } from "@/lib/apiClient";
import { SPECIES_COLOR, STATUS_COLOR, fmtRp, todayStr } from "@/lib/constants";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    Promise.all([apiGet("appointments"), apiGet("patients"), apiGet("finance")]).then(([appointments, patients, finance]) => {
      setData({ appointments, patients, finance });
    });
  }, []);

  if (!data) return <div className="empty-state">Memuat dasbor...</div>;
  const { appointments, patients, finance } = data;

  const today = todayStr();
  const apptsToday = appointments.filter((a) => a.date === today);
  const doneToday = apptsToday.filter((a) => a.status === "Selesai").length;
  const monthPrefix = today.slice(0, 7);
  const revenueMTD = finance.filter((f) => f.type === "Masuk" && (f.date || "").slice(0, 7) === monthPrefix).reduce((s, f) => s + Number(f.amount || 0), 0);
  const pendingBills = finance.filter((f) => f.type === "Piutang").length;
  const upcoming = apptsToday.filter((a) => a.status === "Menunggu").sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  const now = new Date();
  const dayIdx = (now.getDay() + 6) % 7;
  const monday = new Date(now); monday.setDate(now.getDate() - dayIdx);
  const weekData = DAYS.map((d, i) => {
    const dt = new Date(monday); dt.setDate(monday.getDate() + i);
    const ds = dt.toISOString().slice(0, 10);
    const dayAppts = appointments.filter((a) => a.date === ds);
    return {
      day: d,
      Selesai: dayAppts.filter((a) => a.status === "Selesai").length,
      Menunggu: dayAppts.filter((a) => a.status === "Menunggu").length,
      Dibatalkan: dayAppts.filter((a) => a.status === "Dibatalkan").length,
    };
  });

  const speciesCount = {};
  patients.forEach((p) => { speciesCount[p.species] = (speciesCount[p.species] || 0) + 1; });
  const total = patients.length || 1;
  const pieData = Object.entries(speciesCount).map(([name, count]) => ({ name, value: Math.round((count / total) * 100) }));

  const stats = [
    { label: "Reservasi Hari Ini", sub: "Jadwal hari ini", value: apptsToday.length, icon: Calendar },
    { label: "Pasien Selesai Hari Ini", sub: "Sudah ditangani", value: doneToday, icon: PawPrint },
    { label: "Pendapatan (Bulan Ini)", sub: "Pembayaran masuk bulan ini", value: fmtRp(revenueMTD), icon: DollarSign },
    { label: "Tagihan Tertunda", sub: "Piutang belum dibayar", value: pendingBills, icon: FileText },
  ];

  return (
    <div>
      <div className="grid stat-grid" style={{ marginBottom: 20 }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="stat-card">
              <div className="stat-head">
                <div className="stat-icon"><Icon size={15} color="#059669" /></div>
                <span className="stat-label">{s.label}</span>
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-sub">{s.sub}</div>
            </Card>
          );
        })}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #e5e7eb", fontWeight: 700, fontSize: 14.5 }}>Reservasi Mendatang</div>
        {upcoming.length === 0 ? (
          <div className="empty-state">Tidak ada reservasi menunggu hari ini.</div>
        ) : (
          upcoming.map((a) => {
            const p = patients.find((x) => x.id === a.patientId);
            return (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 18px", borderBottom: "1px solid #f3f4f6", fontSize: 13.5 }}>
                <span><strong>{a.time}</strong> — {p ? p.name : "-"} ({a.reason})</span>
                <span style={{ color: "#6b7280" }}>{a.doctor}</span>
              </div>
            );
          })
        )}
      </Card>

      <div className="grid dashboard-charts-grid">
        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 12 }}>Reservasi Minggu Ini</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Selesai" fill={STATUS_COLOR.Selesai} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Menunggu" fill={STATUS_COLOR.Menunggu} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Dibatalkan" fill={STATUS_COLOR.Dibatalkan} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 12 }}>Persentase Pasien</div>
          {patients.length === 0 ? (
            <div className="empty-state">Belum ada data pasien.</div>
          ) : (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name} (${value}%)`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={SPECIES_COLOR[entry.name] || "#94a3b8"} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
