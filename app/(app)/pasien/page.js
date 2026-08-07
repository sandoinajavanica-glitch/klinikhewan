"use client";

import { useEffect, useState } from "react";
import ResourceCrud from "@/components/ResourceCrud";
import { SPECIES, dobToAgeLabel, fmtDate } from "@/lib/constants";
import { apiGet } from "@/lib/apiClient";

export default function PasienPage() {
  const [owners, setOwners] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiGet("owners").then((d) => { setOwners(d); setLoaded(true); });
  }, []);

  if (!loaded) return <div className="empty-state">Memuat data pemilik...</div>;

  const ownerOptions = owners.map((o) => ({ value: o.id, label: o.name + (o.phone ? ` (${o.phone})` : "") }));

  const fields = [
    { name: "name", label: "Nama Hewan", required: true, placeholder: "mis. Milo" },
    { name: "species", label: "Jenis", type: "select", options: SPECIES.map((s) => ({ value: s, label: s })), required: true, default: SPECIES[0] },
    { name: "breed", label: "Ras", placeholder: "mis. Golden Retriever" },
    { name: "age", dobName: "birthDate", type: "age-dob", label: "Umur (tahun)", dobLabel: "Tanggal Lahir", placeholder: "mis. 2" },
    { name: "ownerId", label: "Pemilik & Kontak", type: "search-select", options: ownerOptions, placeholder: "Cari nama pemilik...", required: true },
  ];

  const columns = [
    { key: "name", label: "Nama" },
    { key: "species", label: "Jenis" },
    { key: "breed", label: "Ras" },
    { key: "age", label: "Umur", render: (r) => dobToAgeLabel(r.birthDate) || (r.age ? `${r.age} thn` : "-") },
    { key: "birthDate", label: "Tanggal Lahir", render: (r) => fmtDate(r.birthDate) },
    { key: "owner", label: "Pemilik", render: (r) => owners.find((o) => o.id === r.ownerId)?.name || "-" },
    { key: "contact", label: "Kontak", render: (r) => owners.find((o) => o.id === r.ownerId)?.phone || "-" },
  ];

  return (
    <ResourceCrud
      resource="patients"
      title="Pasien"
      fields={fields}
      columns={columns}
      sortBy="name"
      deleteConfirmMessage="Menghapus pasien ini akan MENGHAPUS SEMUA data terkaitnya secara permanen: jadwal, catatan medis, rawat inap, riwayat vaksin, tindakan, hasil lab, dan transaksi keuangan. Tindakan ini tidak bisa dibatalkan. Lanjutkan?"
      emptyText={owners.length === 0 ? "Tambahkan data pemilik terlebih dahulu di menu Pemilik." : "Belum ada pasien terdaftar."}
    />
  );
}
