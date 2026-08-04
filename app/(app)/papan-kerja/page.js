"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, PrimaryBtn, GhostBtn } from "@/components/ui";
import { apiGet, apiUpdate } from "@/lib/apiClient";
import { fmtDate, todayStr } from "@/lib/constants";

const COLS = [
  { key: "Menunggu", label: "Menunggu" },
  { key: "Diperiksa", label: "Sedang Diperiksa" },
  { key: "Selesai", label: "Selesai" },
];

export default function PapanKerjaPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const today = todayStr();

  async function load() {
    const [a, p] = await Promise.all([apiGet("appointments"), apiGet("patients")]);
    setAppointments(a); setPatients(p); setLoaded(true);
  }
  useEffect(() => { load(); }, []);

  async function move(id, status) {
    await apiUpdate("appointments", id, { status });
    load();
  }

  if (!loaded) return <div className="empty-state">Memuat data...</div>;

  const todays = appointments.filter((a) => a.date === today && a.status !== "Dibatalkan");

  return (
    <div>
      <div style={{ fontSize: 12.5, color: "#9ca3af", marginBottom: 14 }}>Antrian pasien hari ini ({fmtDate(today)})</div>
      <div className="kanban-grid">
        {COLS.map((col) => {
          const items = todays.filter((a) => a.status === col.key);
          return (
            <Card key={col.key} className="kanban-col">
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 12, color: "#374151" }}>
                {col.label} <span style={{ color: "#9ca3af", fontWeight: 500 }}>({items.length})</span>
              </div>
              {items.length === 0 && <div style={{ color: "#d1d5db", fontSize: 12.5, textAlign: "center", padding: "20px 0" }}>Kosong</div>}
              {items.map((a) => {
                const p = patients.find((x) => x.id === a.patientId);
                return (
                  <div key={a.id} className="kanban-card">
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p ? p.name : "-"}</div>
                    <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 8 }}>{a.time} · {a.reason}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {col.key !== "Menunggu" && (
                        <GhostBtn style={{ padding: "4px 8px", fontSize: 11.5 }} onClick={() => move(a.id, col.key === "Diperiksa" ? "Menunggu" : "Diperiksa")}>
                          <ChevronLeft size={12} />
                        </GhostBtn>
                      )}
                      {col.key !== "Selesai" && (
                        <PrimaryBtn style={{ padding: "4px 8px", fontSize: 11.5 }} onClick={() => move(a.id, col.key === "Menunggu" ? "Diperiksa" : "Selesai")}>
                          <ChevronRight size={12} />
                        </PrimaryBtn>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
