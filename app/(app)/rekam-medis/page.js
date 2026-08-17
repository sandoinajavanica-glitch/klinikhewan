"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, FileText, Syringe, FlaskConical, Scissors, Download, BedDouble, ClipboardList } from "lucide-react";
import { Card } from "@/components/ui";
import { useToast } from "@/components/Toast";
import MedicalRecordSection from "@/components/MedicalRecordSection";
import { apiGet } from "@/lib/apiClient";
import { fmtDate } from "@/lib/constants";
import { useSession } from "@/components/SessionContext";

const TABS = [
  { key: "medicalNotes", label: "Catatan Medis", icon: FileText },
  { key: "careLog", label: "Log Perawatan", icon: ClipboardList },
  { key: "inpatientCare", label: "Rawat Inap", icon: BedDouble },
  { key: "vaccinations", label: "Riwayat Vaksin", icon: Syringe },
  { key: "procedures", label: "Tindakan", icon: Scissors },
  { key: "labResults", label: "Hasil Lab", icon: FlaskConical },
];

export default function RekamMedisPage() {
  return (
    <Suspense fallback={<div className="empty-state">Memuat data...</div>}>
      <RekamMedisContent />
    </Suspense>
  );
}

function RekamMedisContent() {
  const session = useSession();
  const searchParams = useSearchParams();
  const toast = useToast();
  const canWrite = session && ["Admin", "Dokter"].includes(session.role);
  const canWriteLab = session && ["Admin", "Dokter", "Paramedis"].includes(session.role);
  const canWriteCareLog = session && ["Admin", "Dokter"].includes(session.role);

  const [patients, setPatients] = useState([]);
  const [owners, setOwners] = useState([]);
  const [staff, setStaff] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("medicalNotes");
  const [pdfLoading, setPdfLoading] = useState(false);

  async function handleDownloadPdf(patient) {
    setPdfLoading(true);
    try {
      const res = await fetch(`/api/patients/${patient.id}/medical-record-pdf`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Gagal membuat PDF");
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match ? match[1] : `rekam-medis-${patient.name}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("PDF rekam medis berhasil diunduh.");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPdfLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([apiGet("patients"), apiGet("owners"), apiGet("staff"), apiGet("inventory")]).then(([p, o, s, inv]) => {
      setPatients(p); setOwners(o); setStaff(s); setInventory(inv); setLoaded(true);
      const paramId = searchParams.get("patientId");
      if (paramId && p.some((patient) => patient.id === paramId)) {
        setSelectedId(paramId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded) return <div className="empty-state">Memuat data...</div>;

  const doctors = staff.filter((s) => s.role === "Dokter");
  const doctorOptions = doctors.map((d) => ({ value: d.name, label: d.name }));

  const selectedPatient = patients.find((p) => p.id === selectedId);

  const filteredPatients = patients
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "id", { sensitivity: "base" }));

  if (!selectedPatient) {
    return (
      <div>
        <div style={{ position: "relative", marginBottom: 14, maxWidth: 340 }}>
          <Search size={14} color="#9ca3af" style={{ position: "absolute", left: 10, top: 10 }} />
          <input
            className="input"
            style={{ paddingLeft: 30 }}
            placeholder="Cari nama pasien..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Card>
          {filteredPatients.length === 0 ? (
            <div className="empty-state">
              {patients.length === 0 ? "Belum ada pasien terdaftar. Tambahkan pasien terlebih dahulu di menu Pasien." : "Pasien tidak ditemukan."}
            </div>
          ) : (
            filteredPatients.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: "1px solid #f3f4f6", cursor: "pointer" }}
              >
                <div style={{ fontSize: 13.5 }}>
                  <strong>{p.name}</strong>
                  <span style={{ color: "#6b7280" }}> · {p.species}{p.breed ? " - " + p.breed : ""} · Pemilik: {owners.find((o) => o.id === p.ownerId)?.name || "-"}</span>
                </div>
                <span style={{ fontSize: 12.5, color: "#059669", fontWeight: 600 }}>Pilih →</span>
              </div>
            ))
          )}
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Card style={{ padding: "14px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 13.5 }}>
          <strong>{selectedPatient.name}</strong>
          <span style={{ color: "#6b7280" }}> {selectedPatient.species}{selectedPatient.breed ? " - " + selectedPatient.breed : ""} · Pemilik: {owners.find((o) => o.id === selectedPatient.ownerId)?.name || "-"}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => handleDownloadPdf(selectedPatient)} disabled={pdfLoading}>
            <Download size={15} /> {pdfLoading ? "Membuat PDF..." : "Download PDF"}
          </button>
          <button className="btn btn-ghost" onClick={() => { setSelectedId(null); setSearch(""); }}>Ganti Pasien</button>
        </div>
      </Card>

      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e7eb", marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <div
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", cursor: "pointer",
                fontSize: 13.5, fontWeight: active ? 600 : 500, color: active ? "#059669" : "#6b7280",
                borderBottom: active ? "2px solid #059669" : "2px solid transparent", marginBottom: -1,
              }}
            >
              <Icon size={15} /> {t.label}
            </div>
          );
        })}
      </div>

      {tab === "medicalNotes" && (
        <MedicalRecordSection
          resource="medicalNotes"
          patientId={selectedPatient.id}
          canWrite={canWrite}
          addLabel="Catatan Medis Baru"
          emptyText="Belum ada catatan medis."
          fields={[
            { name: "date", label: "Tanggal Pemeriksaan", type: "date", required: true },
            { name: "anamnesis", label: "Anamnesa", type: "textarea" },
            { name: "weight", label: "Berat Badan (kg)", type: "number", placeholder: "mis. 5.4" },
            { name: "temperature", label: "Suhu (°C)", type: "number", placeholder: "mis. 38.5" },
            { name: "examination", label: "Hasil Pemeriksaan", type: "textarea" },
            { name: "diagnosis", label: "Diagnosa", type: "textarea" },
            { name: "therapy", label: "Terapi", type: "textarea" },
          ]}
          columns={[
            { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date) },
            { key: "anamnesis", label: "Anamnesa" },
            { key: "weight", label: "Berat Badan", render: (r) => (r.weight ? `${r.weight} kg` : "-") },
            { key: "temperature", label: "Suhu", render: (r) => (r.temperature ? `${r.temperature} °C` : "-") },
            { key: "examination", label: "Hasil Pemeriksaan" },
            { key: "diagnosis", label: "Diagnosa" },
            { key: "therapy", label: "Terapi" },
          ]}
        />
      )}

      {tab === "careLog" && (
        <MedicalRecordSection
          resource="careLog"
          patientId={selectedPatient.id}
          canWrite={canWriteCareLog}
          addLabel="Log Perawatan Baru"
          emptyText="Belum ada log perawatan."
          fields={[
            { name: "date", label: "Tanggal", type: "date", required: true },
            { name: "time", label: "Waktu", type: "time", required: true },
            { name: "condition", label: "Kondisi Fisik", type: "textarea" },
            { name: "actionLog", label: "Log Tindakan", type: "textarea" },
          ]}
          columns={[
            { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date) },
            { key: "time", label: "Waktu" },
            { key: "condition", label: "Kondisi Fisik" },
            { key: "actionLog", label: "Log Tindakan" },
          ]}
        />
      )}

      {tab === "inpatientCare" && (
        <MedicalRecordSection
          resource="inpatientCare"
          patientId={selectedPatient.id}
          canWrite={canWrite}
          addLabel="Catatan Rawat Inap Baru"
          emptyText="Belum ada catatan rawat inap."
          fields={[
            { name: "date", label: "Tanggal", type: "date", required: true },
            { name: "period", label: "Waktu", type: "select", required: true, options: [{ value: "Pagi", label: "Pagi" }, { value: "Siang", label: "Siang" }, { value: "Sore", label: "Sore" }, { value: "Malam", label: "Malam" }], placeholder: "- Pilih waktu -" },
            { name: "description", label: "Deskripsi", type: "textarea" },
            { name: "treatment", label: "Tindakan Pengobatan", type: "textarea" },
          ]}
          columns={[
            { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date) },
            { key: "period", label: "Waktu" },
            { key: "description", label: "Deskripsi" },
            { key: "treatment", label: "Tindakan Pengobatan" },
          ]}
        />
      )}

      {tab === "vaccinations" && (
        <MedicalRecordSection
          resource="vaccinations"
          patientId={selectedPatient.id}
          canWrite={canWrite}
          addLabel="Vaksinasi Baru"
          emptyText="Belum ada riwayat vaksinasi."
          fields={[
            { name: "date", label: "Tanggal Pemberian", type: "date", required: true },
            { name: "vaccineType", label: "Jenis Vaksin", required: true },
            { name: "vaccineNumber", label: "Nomor Vaksin" },
            { name: "doctor", label: "Dokter", type: "select", options: doctorOptions, placeholder: "- Pilih dokter -" },
          ]}
          columns={[
            { key: "date", label: "Tanggal Pemberian", render: (r) => fmtDate(r.date) },
            { key: "vaccineType", label: "Jenis Vaksin" },
            { key: "vaccineNumber", label: "Nomor Vaksin" },
            { key: "doctor", label: "Dokter" },
          ]}
        />
      )}

      {tab === "procedures" && (
        <MedicalRecordSection
          resource="procedures"
          patientId={selectedPatient.id}
          canWrite={canWrite}
          addLabel="Tindakan Baru"
          emptyText="Belum ada catatan tindakan."
          inventory={inventory}
          fields={[
            { name: "date", label: "Tanggal Pelaksanaan", type: "date", required: true },
            { name: "procedureName", label: "Nama Tindakan", required: true },
            { name: "description", label: "Deskripsi", type: "textarea" },
            { name: "medication", label: "Obat / Anastesi (catatan bebas)" },
            { name: "medicationItems", label: "Obat / Anastesi dari Inventaris (stok otomatis berkurang)", type: "inventory-items" },
            { name: "notes", label: "Catatan Tambahan", type: "textarea" },
          ]}
          columns={[
            { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date) },
            { key: "procedureName", label: "Nama Tindakan" },
            { key: "description", label: "Deskripsi" },
            { key: "medication", label: "Obat / Anastesi" },
            {
              key: "medicationItems", label: "Item Inventaris Dipakai", render: (r) => (
                Array.isArray(r.medicationItems) && r.medicationItems.length
                  ? r.medicationItems.map((m) => `${m.name || "-"} (${m.qty} ${m.unit || ""})`).join(", ")
                  : "-"
              ),
            },
            { key: "notes", label: "Catatan Tambahan" },
          ]}
        />
      )}

      {tab === "labResults" && (
        <MedicalRecordSection
          resource="labResults"
          patientId={selectedPatient.id}
          canWrite={canWriteLab}
          addLabel="Hasil Lab Baru"
          emptyText="Belum ada hasil lab."
          fields={[
            { name: "date", label: "Tanggal Pelaksanaan", type: "date", required: true },
            { name: "testName", label: "Nama Tes / Jenis Uji", required: true },
            { name: "value", label: "Nilai" },
            { name: "unit", label: "Satuan" },
          ]}
          columns={[
            { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date) },
            { key: "testName", label: "Nama Tes / Jenis Uji" },
            { key: "value", label: "Nilai" },
            { key: "unit", label: "Satuan" },
          ]}
        />
      )}
    </div>
  );
}
