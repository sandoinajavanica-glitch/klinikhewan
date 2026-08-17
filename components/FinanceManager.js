"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Printer, Send } from "lucide-react";
import { Card, Table, IconBtn, PrimaryBtn, Badge } from "./ui";
import { useToast } from "./Toast";
import FinanceForm from "./FinanceForm";
import { apiGet, apiCreate, apiUpdate, apiDelete } from "@/lib/apiClient";
import { fmtRp, fmtDate, financePatientIds, toWaNumber, genShareToken } from "@/lib/constants";

const TYPE_COLOR = { Masuk: "#10b981", Keluar: "#ef4444", Piutang: "#f59e0b" };

export default function FinanceManager({ patients, owners, staff, onChanged }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // {mode:'add'|'edit', item}
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [data, inv] = await Promise.all([apiGet("finance"), apiGet("inventory")]);
      setItems(data);
      setInventory(inv);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function openAdd() { setModal({ mode: "add", item: null }); }
  function openEdit(item) { setModal({ mode: "edit", item }); }

  async function save(payload) {
    try {
      if (modal.mode === "edit") {
        await apiUpdate("finance", modal.item.id, payload);
        toast.success("Transaksi berhasil diperbarui.");
      } else {
        await apiCreate("finance", payload);
        toast.success("Transaksi berhasil ditambahkan.");
      }
      setModal(null);
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e.message);
      throw e;
    }
  }

  async function remove(id) {
    if (!window.confirm("Yakin ingin menghapus transaksi ini? Tindakan ini tidak bisa dibatalkan.")) return;
    try {
      await apiDelete("finance", id);
      toast.success("Transaksi berhasil dihapus.");
      load();
      onChanged?.();
    } catch (e) {
      toast.error(e.message);
    }
  }

  function ownerOf(row) {
    if (row.ownerId) return owners.find((o) => o.id === row.ownerId) || null;
    const pids = financePatientIds(row);
    const p = patients.find((pt) => pt.id === pids[0]);
    return p ? owners.find((o) => o.id === p.ownerId) || null : null;
  }

  function patientNames(row) {
    const pids = financePatientIds(row);
    if (!pids.length) return "Umum";
    const names = pids.map((id) => patients.find((p) => p.id === id)?.name).filter(Boolean);
    return names.length ? names.join(", ") : "Umum";
  }

  // Kirim link nota lewat WhatsApp (wa.me). Membuat/menyimpan shareToken dulu
  // kalau transaksi ini belum pernah punya, supaya link bisa dibuka pemilik
  // tanpa perlu login ke aplikasi staf.
  async function sendWa(row) {
    const owner = ownerOf(row);
    const waNumber = toWaNumber(owner?.phone);
    if (!owner) { toast.error("Transaksi ini tidak punya pemilik terkait."); return; }
    if (!waNumber) { toast.error(`Pemilik "${owner.name}" belum punya nomor telepon.`); return; }

    let token = row.shareToken;
    if (!token) {
      token = genShareToken();
      try {
        const updated = await apiUpdate("finance", row.id, { shareToken: token });
        setItems((prev) => prev.map((it) => (it.id === row.id ? updated : it)));
      } catch (e) {
        toast.error(e.message);
        return;
      }
    }

    const link = `${window.location.origin}/api/finance/${row.id}/invoice?token=${token}`;
    const text = `Halo ${owner.name}, berikut nota/invoice dari Lareangon:\n${link}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
  }

  const columns = [
    { key: "date", label: "Tanggal", render: (r) => fmtDate(r.date) },
    { key: "owner", label: "Pemilik", render: (r) => ownerOf(r)?.name || "Umum" },
    { key: "patient", label: "Pasien", render: (r) => patientNames(r) },
    { key: "doctor", label: "Dokter", render: (r) => r.doctor || "-" },
    { key: "description", label: "Deskripsi" },
    { key: "type", label: "Tipe", render: (r) => <Badge color={TYPE_COLOR[r.type] || "#6b7280"}>{r.type}</Badge> },
    { key: "amount", label: "Jumlah", render: (r) => fmtRp(r.amount) },
    {
      key: "actions", label: "", render: (r) => (
        <div style={{ display: "flex", gap: 2 }}>
          <IconBtn title="Cetak Nota / Invoice" onClick={() => window.open(`/api/finance/${r.id}/invoice`, "_blank")}>
            <Printer size={15} />
          </IconBtn>
          <IconBtn title="Kirim via WhatsApp" onClick={() => sendWa(r)}>
            <Send size={15} />
          </IconBtn>
          <IconBtn title="Edit" onClick={() => openEdit(r)}><Pencil size={15} /></IconBtn>
          <IconBtn danger title="Hapus" onClick={() => remove(r.id)}><Trash2 size={15} /></IconBtn>
        </div>
      ),
    },
  ];

  let rows = items.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return JSON.stringify(r).toLowerCase().includes(s);
  });
  rows = [...rows].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 10, flexWrap: "wrap" }}>
        <input className="input" style={{ maxWidth: 220 }} placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <PrimaryBtn onClick={openAdd}><Plus size={15} /> Tambah Transaksi</PrimaryBtn>
      </div>
      <Card>
        {loading ? <div className="empty-state">Memuat data...</div> : <Table columns={columns} rows={rows} empty="Belum ada transaksi." />}
      </Card>

      {modal && (
        <FinanceForm
          mode={modal.mode}
          initial={modal.item}
          owners={owners}
          patients={patients}
          staff={staff}
          inventory={inventory}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
