"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Card, Table, Modal, Field, TextInput, Select, TextArea, PrimaryBtn, GhostBtn, IconBtn } from "./ui";
import { useToast } from "./Toast";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "@/lib/apiClient";
import { fmtDate, todayStr } from "@/lib/constants";

/**
 * fields: [{ name, label, type: 'text'|'textarea'|'date'|'select', options, required }]
 * Tanggal pelaksanaan selalu wajib diisi (field pertama, key "date").
 */
export default function MedicalRecordSection({ resource, patientId, fields, columns, canWrite, addLabel, emptyText }) {
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
    fields.forEach((f) => { if (f.name !== "date") initial[f.name] = f.default !== undefined ? f.default : ""; });
    setModal({ mode: "add", item: initial });
  }
  function openEdit(item) { setModal({ mode: "edit", item: { ...item } }); }

  async function save(form) {
    try {
      const payload = { ...form, patientId };
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
      toast.success("Catatan berhasil dihapus.");
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
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function FormModal({ title, fields, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [localError, setLocalError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    const missing = fields.filter((f) => f.required && !String(form[f.name] || "").trim());
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
      {fields.map((f) => (
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
      ))}
      {localError && <div className="alert-error"><AlertTriangle size={14} /> {localError}</div>}
      <div className="modal-actions">
        <GhostBtn onClick={onClose}>Batal</GhostBtn>
        <PrimaryBtn onClick={submit} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</PrimaryBtn>
      </div>
    </Modal>
  );
}
