"use client";

import ResourceCrud from "@/components/ResourceCrud";
import { Badge } from "@/components/ui";
import { INVENTORY_CATEGORIES, fmtDate } from "@/lib/constants";

export default function InventarisPage() {
  const fields = [
    { name: "name", label: "Nama Item", required: true },
    { name: "category", label: "Kategori", type: "select", options: INVENTORY_CATEGORIES.map((c) => ({ value: c, label: c })), default: INVENTORY_CATEGORIES[0] },
    { name: "stock", label: "Stok", type: "number", default: 0, required: true },
    { name: "unit", label: "Satuan", placeholder: "mis. pcs, strip, vial", default: "pcs" },
    { name: "minStock", label: "Stok Minimum (batas notifikasi)", type: "number", default: 5 },
    { name: "expiry", label: "Tanggal Kadaluarsa (opsional)", type: "date" },
  ];

  const columns = [
    { key: "name", label: "Nama Item" },
    { key: "category", label: "Kategori" },
    { key: "stock", label: "Stok", render: (r) => `${r.stock} ${r.unit || ""}` },
    {
      key: "status", label: "Status", render: (r) => {
        const low = Number(r.stock) <= Number(r.minStock || 0);
        const expiringSoon = r.expiry && (new Date(r.expiry) - new Date()) / (1000 * 3600 * 24) <= 30;
        if (low) return <Badge color="#ef4444">Stok Menipis</Badge>;
        if (expiringSoon) return <Badge color="#f59e0b">Mendekati Kadaluarsa</Badge>;
        return <Badge color="#10b981">Aman</Badge>;
      },
    },
    { key: "expiry", label: "Kadaluarsa", render: (r) => (r.expiry ? fmtDate(r.expiry) : "-") },
  ];

  return (
    <ResourceCrud
      resource="inventory"
      title="Item"
      fields={fields}
      columns={columns}
      emptyText="Belum ada item inventaris."
      onBeforeSave={(f) => ({ ...f, stock: Number(f.stock) || 0, minStock: Number(f.minStock) || 0 })}
    />
  );
}
