"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Card, PrimaryBtn, GhostBtn } from "@/components/ui";
import { apiGet, apiUpdate } from "@/lib/apiClient";
import { fmtDate, todayStr } from "@/lib/constants";
import { useSession } from "@/components/SessionContext";
import { useToast } from "@/components/Toast";

const COLS = [
  { key: "Menunggu", label: "Menunggu" },
  { key: "Diperiksa", label: "Sedang Diperiksa" },
  { key: "Selesai", label: "Selesai" },
];
const VALID_STATUS = COLS.map((c) => c.key);

export default function PapanKerjaPage() {
  const session = useSession();
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const today = todayStr();

  async function load() {
    try {
      const [a, p] = await Promise.all([apiGet("appointments"), apiGet("patients")]);
      setAppointments(a);
      setPatients(p);
    } catch (e) {
      toast.error(e.message || "Gagal memuat antrian papan kerja.");
    } finally {
      // Selalu di-set true walau gagal, supaya halaman tidak nyangkut di
      // "Memuat data..." selamanya dan pesan error di atas tetap terlihat.
      setLoaded(true);
    }
  }
  useEffect(() => { load(); }, []);

  async function move(id, status) {
    try {
      await apiUpdate("appointments", id, { status });
      load();
    } catch (e) {
      toast.error(e.message || "Gagal mengubah status antrian.");
    }
  }

  if (!loaded) return <div className="empty-state">Memuat data...</div>;
  if (!session) return <div className="empty-state">Memuat data...</div>;

  const role = session.role;
  const isAdmin = role === "Admin";
  const isDokter = role === "Dokter";

  // Antrian tanpa dokter penanggung jawab dianggap "belum ditugaskan" —
  // ini yang tetap muncul di semua role & semua dokter.
  const isUnassigned = (a) => !a.doctor || !String(a.doctor).trim();

  // 1) Antrian hari ini, tidak termasuk yang dibatalkan.
  const todays = appointments.filter((a) => a.date === today && a.status !== "Dibatalkan");

  // 2) Terapkan cakupan sesuai role:
  //    - Admin: semua antrian, boleh ubah status.
  //    - Dokter: hanya antrian miliknya + yang belum ditugaskan, boleh ubah status.
  //    - Role lain: semua antrian, hanya boleh lihat (tidak boleh ubah status).
  let visible;
  let canEdit;
  if (isAdmin) {
    visible = todays;
    canEdit = true;
  } else if (isDokter) {
    visible = todays.filter((a) => isUnassigned(a) || a.doctor === session.name);
    canEdit = true;
  } else {
    visible = todays;
    canEdit = false;
  }

  // Data lama/tidak lengkap yang status-nya kosong atau tidak baku tetap
  // ditampilkan (masuk ke kolom "Menunggu") alih-alih hilang begitu saja.
  const effectiveStatus = (a) => (VALID_STATUS.includes(a.status) ? a.status : "Menunggu");

  return (
    <div>
      <div style={{ fontSize: 12.5, color: "#9ca3af", marginBottom: 4 }}>
        Antrian pasien hari ini ({fmtDate(today)})
      </div>
      {isDokter && (
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
          Menampilkan antrian Anda dan antrian yang belum ditugaskan ke dokter manapun.
        </div>
      )}
      {!isAdmin && !isDokter && (
        <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10, display: "flex", alignItems: "center", gap: 5 }}>
          <Lock size={12} /> Anda hanya bisa melihat antrian, tidak bisa mengubah statusnya.
        </div>
      )}
      <div className="kanban-grid">
        {COLS.map((col) => {
          const items = visible.filter((a) => effectiveStatus(a) === col.key);
          return (
            <Card key={col.key} className="kanban-col">
              <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 12, color: "#374151" }}>
                {col.label} <span style={{ color: "#9ca3af", fontWeight: 500 }}>({items.length})</span>
              </div>
              {items.length === 0 && <div style={{ color: "#d1d5db", fontSize: 12.5, textAlign: "center", padding: "20px 0" }}>Kosong</div>}
              {items.map((a) => {
                const p = patients.find((x) => x.id === a.patientId);
                const status = effectiveStatus(a);
                return (
                  <div key={a.id} className="kanban-card">
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{p ? p.name : "-"}</div>
                    <div style={{ fontSize: 11.5, color: "#6b7280", marginBottom: 4 }}>{a.time} · {a.reason}</div>
                    <div style={{ fontSize: 11, color: isUnassigned(a) ? "#f59e0b" : "#9ca3af", marginBottom: 8 }}>
                      {isUnassigned(a) ? "Belum ada dokter penanggung jawab" : a.doctor}
                    </div>
                    {canEdit ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        {col.key !== "Menunggu" && (
                          <GhostBtn style={{ padding: "4px 8px", fontSize: 11.5 }} onClick={() => move(a.id, status === "Diperiksa" ? "Menunggu" : "Diperiksa")}>
                            <ChevronLeft size={12} />
                          </GhostBtn>
                        )}
                        {col.key !== "Selesai" && (
                          <PrimaryBtn style={{ padding: "4px 8px", fontSize: 11.5 }} onClick={() => move(a.id, status === "Menunggu" ? "Diperiksa" : "Selesai")}>
                            <ChevronRight size={12} />
                          </PrimaryBtn>
                        )}
                      </div>
                    ) : null}
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
