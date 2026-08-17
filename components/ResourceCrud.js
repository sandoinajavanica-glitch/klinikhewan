"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { Card, Table, Modal, Field, TextInput, Select, SearchSelect, TextArea, PrimaryBtn, GhostBtn, IconBtn } from "./ui";
import { useToast } from "./Toast";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "@/lib/apiClient";
import { ageYearsToDOB, dobToAgeYears } from "@/lib/constants";

/**
 * fields: [{ name, label, type: 'text'|'textarea'|'number'|'date'|'select', options: [{value,label}], required }]
 * columns: [{ key, label, render(row) }]
 */
export default function ResourceCrud({
  resource, title, fields, columns, canWrite = true, emptyText, addLabel,
  onBeforeSave, extraTop, filterFn, sortBy, searchText, extraRowActions,
  deleteConfirmMessage = "Yakin ingin menghapus data ini? Tindakan ini tidak bisa dibatalkan.",
}) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // {mode: 'add'|'edit', item}
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await apiGet(resource);
      setItems(data);
    } catch (e) {
      toast.error(e.message);
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
    try {
      const payload = onBeforeSave ? onBeforeSave(form) : form;
      if (modal.mode === "edit") {
        await apiUpdate(resource, modal.item.id, payload);
        toast.success(`${title} berhasil diperbarui.`);
      } else {
        await apiCreate(resource, payload);
        toast.success(`${title} berhasil ditambahkan.`);
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.message);
      throw e;
    }
  }

  async function remove(id) {
    if (!window.confirm(deleteConfirmMessage)) return;
    try {
      await apiDelete(resource, id);
      toast.success(`${title} berhasil dihapus.`);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  let fullColumns = columns;
  if (extraRowActions) {
    fullColumns = [...fullColumns, { key: "__extra", label: "", render: (r) => extraRowActions(r, load) }];
  }
  if (canWrite) {
    fullColumns = [...fullColumns, {
      key: "__actions", label: "", render: (r) => (
        <div style={{ display: "flex", gap: 2 }}>
          <IconBtn onClick={() => openEdit(r)}><Pencil size={15} /></IconBtn>
          <IconBtn danger onClick={() => remove(r.id)}><Trash2 size={15} /></IconBtn>
        </div>
      ),
    }];
  }

  let rows = (filterFn ? items.filter(filterFn) : items).filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const haystack = JSON.stringify(r) + " " + (searchText ? searchText(r) : "");
    return haystack.toLowerCase().includes(s);
  });

  if (sortBy) {
    rows = [...rows].sort((a, b) =>
      String(a[sortBy] || "").localeCompare(String(b[sortBy] || ""), "id", { sensitivity: "base" })
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <input className="input" style={{ maxWidth: 220 }} placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div style={{ display: "flex", gap: 8 }}>
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
    <Modal title={title} onClose={onClose} wide={fields.length > 5}>
      {fields.map((f) => {
        if (f.type === "age-dob") {
          return (
            <div key={f.name} style={{ display: "flex", gap: 10 }}>
              <Field label={f.label || "Umur"}>
                <TextInput
                  type="number"
                  step="0.1"
                  min="0"
                  value={form[f.name] ?? ""}
                  placeholder={f.placeholder || "mis. 2"}
                  onChange={(e) => {
                    const v = e.target.value;
                    set(f.name, v);
                    set(f.dobName, v === "" ? "" : ageYearsToDOB(v));
                  }}
                />
              </Field>
              <Field label={f.dobLabel || "Tanggal Lahir"}>
                <TextInput
                  type="date"
                  value={form[f.dobName] ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    set(f.dobName, v);
                    set(f.name, v === "" ? "" : dobToAgeYears(v));
                  }}
                />
              </Field>
            </div>
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
