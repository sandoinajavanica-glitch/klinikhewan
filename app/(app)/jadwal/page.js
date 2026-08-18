"use client";

import { useEffect, useState } from "react";
import { X, Filter } from "lucide-react";
import ResourceCrud from "@/components/ResourceCrud";
import { Badge, Select, TextInput, GhostBtn } from "@/components/ui";
import { APPT_STATUS, STATUS_COLOR, fmtDate, todayStr } from "@/lib/constants";
import { apiGet } from "@/lib/apiClient";

const UNASSIGNED = "__unassigned__";

export default function JadwalPage() {
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Filter papan: tanggal & dokter penanggung jawab.
  const [filterDate, setFilterDate] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");

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
    { key: "doctor", label: "Dokter", render: (r) => r.doctor || <span style={{ color: "#f59e0b" }}>Belum ditentukan</span> },
    { key: "reason", label: "Keperluan" },
    { key: "status", label: "Status", render: (r) => <Badge color={STATUS_COLOR[r.status] || "#6b7280"}>{r.status}</Badge> },
  ];

  const hasFilter = !!filterDate || !!filterDoctor;

  function filterFn(item) {
    if (filterDate && item.date !== filterDate) return false;
    if (filterDoctor === UNASSIGNED) {
      if (item.doctor) return false;
    } else if (filterDoctor && item.doctor !== filterDoctor) return false;
    return true;
  }

  const extraTop = (
    <div className="filter-group">
      <span className="filter-group-label"><Filter size={13} /> Filter</span>
      <TextInput
        type="date"
        className="filter-group-date"
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
        title="Filter berdasarkan tanggal"
      />
      <Select
        className="filter-group-select"
        value={filterDoctor}
        onChange={(e) => setFilterDoctor(e.target.value)}
        title="Filter berdasarkan dokter penanggung jawab"
      >
        <option value="">Semua Dokter</option>
        {doctorOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        <option value={UNASSIGNED}>Belum ditentukan</option>
      </Select>
      {hasFilter && (
        <GhostBtn onClick={() => { setFilterDate(""); setFilterDoctor(""); }} title="Bersihkan filter">
          <X size={14} /> Bersihkan
        </GhostBtn>
      )}
    </div>
  );

  return (
    <ResourceCrud
      resource="appointments"
      title="Jadwal"
      fields={fields}
      columns={columns}
      filterFn={hasFilter ? filterFn : null}
      extraTop={extraTop}
      emptyText={
        patients.length === 0
          ? "Tambahkan data pasien terlebih dahulu."
          : hasFilter
          ? "Tidak ada jadwal yang cocok dengan filter."
          : "Belum ada jadwal reservasi."
      }
    />
  );
}
