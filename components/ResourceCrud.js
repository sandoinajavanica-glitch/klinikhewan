"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Card, Table, Modal, Field, TextInput, Select, SearchSelect, TextArea, PrimaryBtn, GhostBtn, IconBtn } from "./ui";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "@/lib/apiClient";

/**
 * fields: [{ name, label, type: 'text'|'textarea'|'number'|'date'|'select', options: [{value,label}], required }]
 * columns: [{ key, label, render(row) }]
 */
export default function ResourceCrud({
  resource, title, fields, columns, canWrite = true, emptyText, addLabel,
  onBeforeSave, extraTop, filterFn, sortBy,
  deleteConfirmMessage = "Yakin ingin menghapus data ini? Tindakan ini tidak bisa dibatalkan.",
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // {mode: 'add'|'edit', item}
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet(resource);
      setItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [resource]);

  function openAdd() {
    const initial = {};
    fields.forEach((f) => { initial[f.name] = f.default !== undefined ? f.default : ""; });
    setModal({ mode: "add", item: initial });
  }
  function openEdit(item) { setModal({ mode: "edit", item: { ...item } }); }

  async function save(form) {
    setError("");
    try {
      const payload = onBeforeSave ? onBeforeSave(form) : form;
      if (modal.mode === "edit") {
        await apiUpdate(resource, modal.item.id, payload);
      } else {
        await apiCreate(resource, payload);
      }
      setModal(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function remove(id) {
    if (!window.confirm(deleteConfirmMessage)) return;
    setError("");
    try {
      await apiDelete(resource, id);
      load();
    } catch (e) {
      setError(e.message);
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

  let rows = (filterFn ? items.filter(filterFn) : items).filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return JSON.stringify(r).toLowerCase().includes(s);
  });

  if (sortBy) {
    rows = [...rows].sort((a, b) =>
      String(a[sortBy] || "").localeCompare(String(b[sortBy] || ""), "id", { sensitivity: "base" })
    );
  }

  return (
    <div>
      {error && <div className="alert-error"><AlertTriangle size={14} /> {error}</div>}
      <div className="crud-toolbar" style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <input className="input crud-search" style={{ maxWidth: 220 }} placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="crud-toolbar-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {extraTop}
          {canWrite && <PrimaryBtn onClick={openAdd}><Plus size={15} /> {addLabel || `Tambah ${title}`}</PrimaryBtn>}
        </div>
      </div>
      <Card>
        {loading ? <div className="empty-state">Memuat data...</div> : <Table columns={fullColumns} rows={rows} empty={emptyText} />}
      </Card>

      {modal && (
        <RecordFormModal
          title={modal.mode === "edit" ? `Edit ${title}` : `Tambah ${title}`}
          fields={fields}
          initial={modal.item}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function RecordFormModal({ title, fields, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial);
  const [localError, setLocalError] = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    const missing = fields.filter((f) => f.required && !String(form[f.name] || "").trim());
    if (missing.length) {
      setLocalError(`Wajib diisi: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setLocalError("");
    onSave(form);
  }

  return (
    <Modal title={title} onClose={onClose} wide={fields.length > 5}>
      {fields.map((f) => (
        <Field key={f.name} label={f.label}>
          {f.type === "select" && (
            <Select value={form[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)}>
              {f.placeholder && <option value="">{f.placeholder}</option>}
              {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          )}
          {f.type === "search-select" && (
            <SearchSelect options={f.options} value={form[f.name] ?? ""} onChange={(v) => set(f.name, v)} placeholder={f.placeholder} />
          )}
          {f.type === "textarea" && (
            <TextArea value={form[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} />
          )}
          {(!f.type || ["text", "number", "date", "email", "password"].includes(f.type)) && (
            <TextInput type={f.type || "text"} value={form[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} placeholder={f.placeholder} autoComplete={f.type === "password" ? "new-password" : "off"} />
          )}
        </Field>
      ))}
      {localError && <div className="alert-error">{localError}</div>}
      <div className="modal-actions">
        <GhostBtn onClick={onClose}>Batal</GhostBtn>
        <PrimaryBtn onClick={submit}>Simpan</PrimaryBtn>
      </div>
    </Modal>
  );
}