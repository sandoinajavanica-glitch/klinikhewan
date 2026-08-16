"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, MessageCircle } from "lucide-react";
import ResourceCrud from "@/components/ResourceCrud";
import { IconBtn } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { SPECIES, dobToAgeLabel, toWaNumber } from "@/lib/constants";
import { apiGet } from "@/lib/apiClient";

export default function PasienPage() {
  const router = useRouter();
  const toast = useToast();
  const [owners, setOwners] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiGet("owners").then((d) => { setOwners(d); setLoaded(true); });
  }, []);

  if (!loaded) return <div className="empty-state">Memuat data pemilik...</div>;

  const ownerOptions = owners.map((o) => ({ value: o.id, label: o.name + (o.phone ? ` (${o.phone})` : "") }));
  const ownerOf = (r) => owners.find((o) => o.id === r.ownerId);

  function chatWa(r) {
    const owner = ownerOf(r);
    const waNumber = toWaNumber(owner?.phone);
    if (!owner) { toast.error("Pasien ini tidak punya pemilik terkait."); return; }
    if (!waNumber) { toast.error(`Pemilik "${owner.name}" belum punya nomor telepon.`); return; }
    const text = `Halo ${owner.name}, kami dari klinik ingin menginformasikan terkait pasien ${r.name}.`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
  }

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
    { key: "owner", label: "Pemilik", render: (r) => ownerOf(r)?.name || "-" },
    { key: "contact", label: "Kontak", render: (r) => ownerOf(r)?.phone || "-" },
    {
      key: "quickActions", label: "", render: (r) => (
        <div style={{ display: "flex", gap: 2 }}>
          <IconBtn title="Buka Rekam Medis" onClick={() => router.push(`/rekam-medis?patientId=${r.id}`)}>
            <FileText size={15} />
          </IconBtn>
          <IconBtn title="Chat WhatsApp ke Pemilik" onClick={() => chatWa(r)}>
            <MessageCircle size={15} />
          </IconBtn>
        </div>
      ),
    },
  ];

  return (
    <ResourceCrud
      resource="patients"
      title="Pasien"
      fields={fields}
      columns={columns}
      sortBy="name"
      searchText={(r) => ownerOf(r)?.name || ""}
      deleteConfirmMessage="Menghapus pasien ini akan MENGHAPUS SEMUA data terkaitnya secara permanen: jadwal, catatan medis, rawat inap, riwayat vaksin, tindakan, hasil lab, dan transaksi keuangan. Tindakan ini tidak bisa dibatalkan. Lanjutkan?"
      emptyText={owners.length === 0 ? "Tambahkan data pemilik terlebih dahulu di menu Pemilik." : "Belum ada pasien terdaftar."}
    />
  );
}
