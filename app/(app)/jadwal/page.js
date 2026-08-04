"use client";

import { useEffect, useState } from "react";
import ResourceCrud from "@/components/ResourceCrud";
import { Badge } from "@/components/ui";
import { APPT_STATUS, STATUS_COLOR, fmtDate, todayStr } from "@/lib/constants";
import { apiGet } from "@/lib/apiClient";

export default function JadwalPage() {
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([apiGet("patients"), apiGet("staff")]).then(([p, s]) => {
      setPatients(p); setStaff(s); setLoaded(true);
    });
  }, []);

  if (!loaded) return <div className="empty-state">Memuat data...</div>;

  const doctors = staff.filter((s) => s.role === "Dokter");
  const patientOptions = patients.map((p) => ({ value: p.id, label: p.name }));
  const doctorOptions = doctors.map((d) => ({ value: d.name, label: d.name }));

  const fields = [
    { name: "patientId", label: "Pasien", type: "select", options: patientOptions, placeholder: "- Pilih pasien -", required: true },
    { name: "date", label: "Tanggal", type: "date", required: true, default: todayStr() },
    { name: "time", label: "Jam", placeholder: "mis. 09:00", required: true },
    { name: "doctor", label: "Dokter Praktik", type: "select", options: doctorOptions, placeholder: "- Pilih dokter -" },
    { name: "reason", label: "Keperluan", placeholder: "mis. Vaksinasi rutin" },
    { name: "status", label: "Status Kunjungan", type: "select", options: APPT_STATUS.map((s) => ({ value: s, label: s })), default: "Menunggu" },
  ];

  const columns = [
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date) },
    { key: "time", label: "Jam" },
    { key: "patient", label: "Pasien", render: (r) => patients.find((p) => p.id === r.patientId)?.name || "-" },
    { key: "doctor", label: "Dokter" },
    { key: "reason", label: "Keperluan" },
    { key: "status", label: "Status", render: (r) => <Badge color={STATUS_COLOR[r.status] || "#6b7280"}>{r.status}</Badge> },
  ];

  return (
    <ResourceCrud
      resource="appointments"
      title="Jadwal"
      fields={fields}
      columns={columns}
      emptyText={patients.length === 0 ? "Tambahkan data pasien terlebih dahulu." : "Belum ada jadwal reservasi."}
    />
  );
}
