"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Card, Table, Modal, Field, TextInput, Select, TextArea, PrimaryBtn, GhostBtn, IconBtn } from "./ui";
import { useToast } from "./Toast";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "@/lib/apiClient";
import { fmtDate, todayStr } from "@/lib/constants";

let rowSeq = 0;
function newMedRow() {
  rowSeq += 1;
  return { id: `med-${Date.now()}-${rowSeq}`, inventoryId: "", name: "", unit: "", qty: 1 };
}

/**
 * fields: [{ name, label, type: 'text'|'textarea'|'date'|'select'|'inventory-items', options, required }]
 * Field bertipe "inventory-items" (mis. dipakai di Tindakan untuk Obat/Anastesi)
 * memakai `inventory` (daftar item inventaris) yang dikirim lewat prop
 * `inventory` di komponen ini, dan nilainya berupa array baris
 * { inventoryId, name, unit, qty } yang otomatis mengurangi stok saat disimpan.
 * Tanggal pelaksanaan selalu wajib diisi (field pertama, key "date").
 */
export default function MedicalRecordSection({ resource, patientId, fields, columns, canWrite, addLabel, emptyText, inventory }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const all = await apiGet(resource);
      setItems(all.filter((x) => x.patientId === patientId));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [resource, patientId]);

  function openAdd() {
    const initial = { date: todayStr() };
    fields.forEach((f) => {
      if (f.name === "date") return;
      if (f.type === "inventory-items") { initial[f.name] = []; return; }
      initial[f.name] = f.default !== undefined ? f.default : "";
    });
    setModal({ mode: "add", item: initial });
  }
  function openEdit(item) { setModal({ mode: "edit", item: { ...item } }); }

  async function save(form) {
    try {
      const cleaned = { ...form };
      fields.forEach((f) => {
        if (f.type === "inventory-items" && Array.isArray(cleaned[f.name])) {
          cleaned[f.name] = cleaned[f.name]
            .filter((r) => r.inventoryId && Number(r.qty) > 0)
            .map((r) => ({ id: r.id, inventoryId: r.inventoryId, name: r.name, unit: r.unit, qty: Number(r.qty) }));
        }
      });
      const payload = { ...cleaned, patientId };
      if (modal.mode === "edit") {
        await apiUpdate(resource, modal.item.id, payload);
        toast.success(`${addLabel} berhasil diperbarui.`);
      } else {
        await apiCreate(resource, payload);
        toast.success(`${addLabel} berhasil ditambahkan.`);
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.message);
      throw e;
    }
  }

  async function remove(id) {
    if (!window.confirm("Yakin ingin menghapus catatan ini? Tindakan ini tidak bisa dibatalkan.")) return;
    try {
      await apiDelete(resource, id);
      toast.success("Catatan berhasil dihapus & stok obat terkait (jika ada) telah dikembalikan.");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const fullColumns = canWrite
    ? [...columns, {
        key: "__actions", label: "", render: (r) => (
          <div style={{ display: "flex", gap: 2 }}>
            <IconBtn onClick={() => openEdit(r)}><Pencil size={15} /></IconBtn>
            <IconBtn danger onClick={() => remove(r.id)}><Trash2 size={15} /></IconBtn>
          </div>
        ),
      }]
    : columns;

  const sorted = [...items].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div>
      {canWrite && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
          <PrimaryBtn onClick={openAdd}><Plus size={15} /> {addLabel}</PrimaryBtn>
        </div>
      )}
      <Card>
        {loading ? <div className="empty-state">Memuat data...</div> : <Table columns={fullColumns} rows={sorted} empty={emptyText} />}
      </Card>

      {modal && (
        <FormModal
          title={modal.mode === "edit" ? `Edit ${addLabel}` : addLabel}
          fields={fields}
          initial={modal.item}
          inventory={inventory}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function FormModal({ title, fields, initial, inventory, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [localError, setLocalError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    const missing = fields.filter((f) => f.type !== "inventory-items" && f.required && !String(form[f.name] || "").trim());
    if (missing.length) {
      setLocalError(`Wajib diisi: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setLocalError("");
    setSaving(true);
    try {
      await onSave(form);
    } catch (e) {
      // Error sudah ditampilkan lewat toast di pemanggil; modal tetap terbuka.
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose} wide={fields.length > 4}>
      {fields.map((f) => {
        if (f.type === "inventory-items") {
          return (
            <InventoryItemsField
              key={f.name}
              label={f.label}
              value={form[f.name] || []}
              onChange={(v) => set(f.name, v)}
              inventory={inventory || []}
            />
          );
        }
        return (
        <Field key={f.name} label={f.label}>
          {f.type === "select" && (
            <Select value={form[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)}>
              {f.placeholder && <option value="">{f.placeholder}</option>}
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          )}
          {f.type === "textarea" && (
            <TextArea value={form[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />
          )}
          {(!f.type || ["text", "date", "time", "number"].includes(f.type)) && (
            <TextInput type={["date", "time", "number"].includes(f.type) ? f.type : "text"} step={f.type === "number" ? "any" : undefined} value={form[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />
          )}
        </Field>
        );
      })}
      {localError && <div className="alert-error"><AlertTriangle size={14} /> {localError}</div>}
      <div className="modal-actions">
        <GhostBtn onClick={onClose}>Batal</GhostBtn>
        <PrimaryBtn onClick={submit} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</PrimaryBtn>
      </div>
    </Modal>
  );
}

// Rincian pemakaian obat/alat dari inventaris: pilih item + jumlah. Stok
// berkurang otomatis di server saat catatan tindakan disimpan.
function InventoryItemsField({ label, value, onChange, inventory }) {
  const rows = value || [];
  const invOptions = inventory.map((it) => ({ value: it.id, label: `${it.name} (sisa ${it.stock} ${it.unit || ""})` }));

  function addRow() {
    onChange([...rows, newMedRow()]);
  }
  function updateRow(id, patch) {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }
  function removeRow(id) {
    onChange(rows.filter((r) => r.id !== id));
  }
  function pickItem(id, inventoryId) {
    const item = inventory.find((it) => it.id === inventoryId);
    updateRow(id, { inventoryId, name: item?.name || "", unit: item?.unit || "" });
  }

  return (
    <Field label={label}>
      {rows.length > 0 && (
        <div className="med-items">
          <div className="med-items-head">
            <span>Item Inventaris</span>
            <span>Jumlah</span>
            <span></span>
          </div>
          {rows.map((row) => {
            const invItem = inventory.find((it) => it.id === row.inventoryId);
            const maxStock = invItem ? Number(invItem.stock) : undefined;
            return (
              <div className="med-items-row" key={row.id}>
                <Select value={row.inventoryId} onChange={(e) => pickItem(row.id, e.target.value)}>
                  <option value="">- Pilih item -</option>
                  {invOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
                <TextInput
                  type="number" min="0" step="any"
                  value={row.qty}
                  onChange={(e) => updateRow(row.id, { qty: e.target.value })}
                  placeholder={invItem?.unit || "Jumlah"}
                />
                <IconBtn danger title="Hapus baris" onClick={() => removeRow(row.id)}><Trash2 size={14} /></IconBtn>
                {invItem && maxStock !== undefined && Number(row.qty) > maxStock && (
                  <div className="med-items-warn"><AlertTriangle size={12} /> Melebihi stok tersedia ({maxStock} {invItem.unit || ""})</div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <GhostBtn onClick={addRow} style={{ marginTop: 8 }}><Plus size={14} /> Tambah Item dari Inventaris</GhostBtn>
    </Field>
  );
}
