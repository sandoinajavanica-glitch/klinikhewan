"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Modal, Field, TextInput, Select, SearchSelect, PrimaryBtn, GhostBtn, IconBtn } from "./ui";
import { fmtRp, todayStr, itemSubtotal, normalizeFinanceItems, financePatientIds, genShareToken } from "@/lib/constants";

let rowSeq = 0;
function newRow(patientId = "") {
  rowSeq += 1;
  return { id: `row-${Date.now()}-${rowSeq}`, patientId, description: "", qty: 1, price: 0 };
}

const TYPE_OPTIONS = [
  { value: "Masuk", label: "Masuk (pemasukan)" },
  { value: "Keluar", label: "Keluar (pengeluaran / belanja)" },
  { value: "Piutang", label: "Piutang" },
];

/**
 * Form transaksi keuangan / invoice. Mendukung:
 * - satu invoice untuk beberapa pasien dari pemilik yang sama (patientId per baris item)
 * - rincian item + harga yang diisi manual, baris bisa ditambah/dihapus bebas
 */
export default function FinanceForm({ mode, initial, owners, patients, staff, onClose, onSave }) {
  const [date, setDate] = useState(initial?.date || todayStr());
  const [type, setType] = useState(initial?.type || "Masuk");
  const [doctor, setDoctor] = useState(initial?.doctor || "");
  const [ownerId, setOwnerId] = useState(() => {
    if (initial?.ownerId) return initial.ownerId;
    const pids = financePatientIds(initial || {});
    const p = patients.find((pt) => pt.id === pids[0]);
    return p?.ownerId || "";
  });
  const [items, setItems] = useState(() => {
    const rows = normalizeFinanceItems(initial || {}).map((r) => ({
      id: r.id && r.id !== "legacy" ? r.id : newRow().id,
      patientId: r.patientId || "",
      description: r.description || "",
      qty: r.qty ?? 1,
      price: r.price ?? 0,
    }));
    return rows.length ? rows : [newRow()];
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const ownerOptions = [
    { value: "", label: "- Umum (tanpa pemilik) -" },
    ...owners.map((o) => ({ value: o.id, label: o.name + (o.phone ? ` (${o.phone})` : "") })),
  ];
  const doctorOptions = [
    { value: "", label: "- Umum (tanpa dokter penanggung jawab) -" },
    ...(staff || []).filter((s) => s.role === "Dokter").map((d) => ({ value: d.name, label: d.name })),
  ];
  const ownerPatients = useMemo(() => patients.filter((p) => p.ownerId === ownerId), [patients, ownerId]);
  const patientOptions = [{ value: "", label: "Umum" }, ...ownerPatients.map((p) => ({ value: p.id, label: p.name }))];

  function updateRow(id, patch) {
    setItems((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function addRow() {
    setItems((rows) => [...rows, newRow()]);
  }
  function removeRow(id) {
    setItems((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  }

  const total = items.reduce((s, r) => s + itemSubtotal(r), 0);

  async function submit() {
    const cleanItems = items
      .map((r) => ({
        patientId: r.patientId || "",
        description: String(r.description || "").trim(),
        qty: Number(r.qty) || 0,
        price: Number(r.price) || 0,
      }))
      .filter((r) => r.description || r.price);

    if (!cleanItems.length) {
      setError("Tambahkan minimal 1 rincian item (deskripsi + harga).");
      return;
    }
    if (cleanItems.some((r) => !r.description)) {
      setError("Setiap item wajib punya deskripsi.");
      return;
    }
    setError("");
    setSaving(true);

    const itemsWithQty = cleanItems.map((r) => ({ ...r, qty: r.qty || 1 }));
    const patientIds = [...new Set(itemsWithQty.map((r) => r.patientId).filter(Boolean))];
    const description =
      itemsWithQty.length === 1
        ? itemsWithQty[0].description
        : `${itemsWithQty[0].description} (+${itemsWithQty.length - 1} item lainnya)`;

    const payload = {
      date,
      type,
      ownerId,
      doctor,
      patientIds,
      items: itemsWithQty,
      description,
      amount: itemsWithQty.reduce((s, r) => s + itemSubtotal(r), 0),
      shareToken: initial?.shareToken || genShareToken(),
    };

    try {
      await onSave(payload);
    } catch (e) {
      // Error sudah ditampilkan lewat toast di pemanggil; modal tetap terbuka.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={mode === "edit" ? "Edit Transaksi / Invoice" : "Tambah Transaksi / Invoice"} onClose={onClose} wide>
      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Tanggal">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Tipe">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <Field label="Pemilik">
          <SearchSelect options={ownerOptions} value={ownerId} onChange={setOwnerId} placeholder="Cari nama pemilik..." />
        </Field>
        <Field label="Dokter Penanggung Jawab">
          <Select value={doctor} onChange={(e) => setDoctor(e.target.value)}>
            {doctorOptions.map((o) => (
              <option key={o.value || "umum"} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label={ownerPatients.length > 1 ? "Rincian Item (satu invoice bisa untuk beberapa pasien dari pemilik ini)" : "Rincian Item"}>
        <div className="finance-items">
          <div className="finance-items-head">
            <span>Pasien</span>
            <span>Deskripsi</span>
            <span>Qty</span>
            <span>Harga (Rp)</span>
            <span>Subtotal</span>
            <span></span>
          </div>
          {items.map((row) => (
            <div className="finance-items-row" key={row.id}>
              <Select value={row.patientId} onChange={(e) => updateRow(row.id, { patientId: e.target.value })}>
                {patientOptions.map((o) => (
                  <option key={o.value || "umum"} value={o.value}>{o.label}</option>
                ))}
              </Select>
              <TextInput
                value={row.description}
                placeholder="mis. Jasa dokter, obat, vaksinasi"
                onChange={(e) => updateRow(row.id, { description: e.target.value })}
              />
              <TextInput type="number" min="0" step="1" value={row.qty} onChange={(e) => updateRow(row.id, { qty: e.target.value })} />
              <TextInput type="number" min="0" step="500" value={row.price} onChange={(e) => updateRow(row.id, { price: e.target.value })} />
              <div className="finance-items-subtotal">{fmtRp(itemSubtotal(row))}</div>
              <IconBtn danger title="Hapus baris" onClick={() => removeRow(row.id)}><Trash2 size={14} /></IconBtn>
            </div>
          ))}
        </div>
        <GhostBtn onClick={addRow} style={{ marginTop: 8 }}><Plus size={14} /> Tambah Item</GhostBtn>
      </Field>

      <div className="finance-total-row">
        <span>Total</span>
        <b>{fmtRp(total)}</b>
      </div>

      {error && <div className="alert-error"><AlertTriangle size={14} /> {error}</div>}
      <div className="modal-actions">
        <GhostBtn onClick={onClose}>Batal</GhostBtn>
        <PrimaryBtn onClick={submit} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</PrimaryBtn>
      </div>
    </Modal>
  );
}
