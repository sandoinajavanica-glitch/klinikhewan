"use client";

import ResourceCrud from "@/components/ResourceCrud";

export default function PemilikPage() {
  const fields = [
    { name: "name", label: "Nama", required: true },
    { name: "phone", label: "Telepon / Kontak", required: true, placeholder: "mis. 0812-3456-7890" },
    { name: "address", label: "Alamat", type: "textarea" },
  ];

  const columns = [
    { key: "name", label: "Nama" },
    { key: "phone", label: "Telepon" },
    { key: "address", label: "Alamat" },
  ];

  return (
    <ResourceCrud
      resource="owners"
      title="Pemilik"
      fields={fields}
      columns={columns}
      sortBy="name"
      emptyText="Belum ada pemilik terdaftar."
    />
  );
}
