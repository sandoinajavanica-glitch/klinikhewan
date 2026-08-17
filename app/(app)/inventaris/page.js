"use client";

import { useState } from "react";
import { PackageMinus, AlertTriangle } from "lucide-react";
import ResourceCrud from "@/components/ResourceCrud";
import { Badge, Modal, Field, TextInput, GhostBtn, PrimaryBtn, IconBtn } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { apiUseInventoryStock } from "@/lib/apiClient";
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
      extraRowActions={(item, reload) => <UseStockButton item={item} onDone={reload} />}
    />
  );
}

// Tombol cepat "Pakai Stok": buka modal kecil untuk mengurangi jumlah stok
// item langsung, tanpa perlu masuk mode edit penuh.
function UseStockButton({ item, onDone }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function openModal() {
    setQty("");
    setError("");
    setOpen(true);
  }

  async function submit() {
    const n = Number(qty);
    if (!qty || isNaN(n) || n <= 0) {
      setError("Masukkan jumlah pemakaian yang valid (lebih dari 0).");
      return;
    }
    if (n > Number(item.stock || 0)) {
      setError(`Jumlah melebihi stok tersedia (sisa ${item.stock} ${item.unit || ""}).`);
      return;
    }
    setError("");
    setSaving(true);
    try {
      await apiUseInventoryStock(item.id, n);
      toast.success(`Stok "${item.name}" berkurang ${n} ${item.unit || ""}.`);
      setOpen(false);
      onDone?.();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <IconBtn title="Pakai Stok" onClick={openModal}><PackageMinus size={15} /></IconBtn>
      {open && (
        <Modal title={`Pakai Stok — ${item.name}`} onClose={() => setOpen(false)}>
          <div style={{ fontSize: 12.5, color: "#6b7280", marginBottom: 10 }}>
            Stok saat ini: <strong>{item.stock} {item.unit || ""}</strong>
          </div>
          <Field label={`Jumlah dipakai (${item.unit || "unit"})`}>
            <TextInput
              type="number"
              min="0"
              step="any"
              autoFocus
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="mis. 2"
            />
          </Field>
          {error && <div className="alert-error"><AlertTriangle size={14} /> {error}</div>}
          <div className="modal-actions">
            <GhostBtn onClick={() => setOpen(false)}>Batal</GhostBtn>
            <PrimaryBtn onClick={submit} disabled={saving}>{saving ? "Menyimpan..." : "Kurangi Stok"}</PrimaryBtn>
          </div>
        </Modal>
      )}
    </>
  );
}
