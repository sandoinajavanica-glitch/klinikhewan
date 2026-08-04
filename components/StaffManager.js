"use client";

import ResourceCrud from "./ResourceCrud";
import { STAFF_ROLES } from "@/lib/constants";

export default function StaffManager() {
  const fields = [
    { name: "name", label: "Nama", required: true },
    { name: "role", label: "Peran", type: "select", options: STAFF_ROLES.map((r) => ({ value: r, label: r })), default: STAFF_ROLES[2] },
    { name: "email", label: "Email Login", type: "email", required: true, placeholder: "nama@draftklinik.local" },
    { name: "password", label: "Password (kosongkan jika tidak ingin mengubah saat edit; wajib diisi untuk staf baru)", type: "password", placeholder: "Password" },
  ];

  const columns = [
    { key: "name", label: "Nama" },
    { key: "role", label: "Peran" },
    { key: "email", label: "Email" },
  ];

  return (
    <ResourceCrud
      resource="staff"
      title="Staf"
      fields={fields}
      columns={columns}
      emptyText="Belum ada staf terdaftar."
    />
  );
}
