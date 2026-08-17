import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAll, getOne, updateItem, deleteItem, COLLECTIONS } from "@/lib/db";
import { getSession, hasRole } from "@/lib/auth";
import { adjustStockMany, buildStockDeltaMap, procedureInventoryRows, financeInventoryRows } from "@/lib/inventoryStock";

// Item resource yang pemakaian stoknya perlu disesuaikan ulang saat diedit:
// stok lama dikembalikan dulu, lalu stok versi baru dikurangi. Kalau
// record dihapus, stok yang pernah dipakai dikembalikan semua.
async function stockRowsFor(resource, item) {
  if (resource === "procedures") return procedureInventoryRows(item);
  if (resource === "finance") return financeInventoryRows(item);
  return [];
}

async function applyStockOnUpdate(resource, before, after) {
  try {
    const oldRows = await stockRowsFor(resource, before);
    const newRows = await stockRowsFor(resource, after);
    if (!oldRows.length && !newRows.length) return;
    const restore = buildStockDeltaMap(oldRows, 1);
    const apply = buildStockDeltaMap(newRows, -1);
    const combined = { ...restore };
    for (const [id, delta] of Object.entries(apply)) combined[id] = (combined[id] || 0) + delta;
    await adjustStockMany(combined);
  } catch (e) {
    console.error("Gagal menyesuaikan stok inventaris saat edit:", e);
  }
}

async function applyStockOnDelete(resource, item) {
  try {
    const rows = await stockRowsFor(resource, item);
    if (!rows.length) return;
    await adjustStockMany(buildStockDeltaMap(rows, 1));
  } catch (e) {
    console.error("Gagal mengembalikan stok inventaris saat hapus:", e);
  }
}

const WRITE_ROLES = {
  staff: ["Admin"],
  medicalNotes: ["Admin", "Dokter"],
  careLog: ["Admin", "Dokter"],
  inpatientCare: ["Admin", "Dokter"],
  vaccinations: ["Admin", "Dokter"],
  labResults: ["Admin", "Dokter", "Paramedis"],
  procedures: ["Admin", "Dokter"],
};

function checkResource(resource) {
  return COLLECTIONS.includes(resource);
}

function sanitizeStaff(item) {
  const { passwordHash, password, ...rest } = item;
  return rest;
}

export async function PUT(req, { params }) {
  const { resource, id } = params;
  if (!checkResource(resource)) return NextResponse.json({ error: "Resource tidak dikenal" }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const allowedRoles = WRITE_ROLES[resource];
  if (allowedRoles && !hasRole(session, allowedRoles)) {
    return NextResponse.json({ error: "Tidak punya akses untuk mengubah data ini" }, { status: 403 });
  }
  if (resource === "staff" && session.isDemo) {
    return NextResponse.json({ error: "Akun demo tidak dapat mengubah pengaturan." }, { status: 403 });
  }
  const body = await req.json();

  if (resource === "staff") {
    if (body.email !== undefined) {
      if (!String(body.email).trim()) {
        return NextResponse.json({ error: "Email tidak boleh kosong." }, { status: 400 });
      }
      const email = String(body.email).trim().toLowerCase();
      const existing = await getAll("staff");
      if (existing.some((s) => s.id !== id && String(s.email || "").toLowerCase() === email)) {
        return NextResponse.json({ error: "Email sudah dipakai staf lain." }, { status: 400 });
      }
      body.email = email;
    }
    if (body.password && String(body.password).trim()) {
      body.passwordHash = await bcrypt.hash(body.password, 10);
    }
    delete body.password;
  }

  try {
    const before = await getOne(resource, id);
    const updated = await updateItem(resource, id, body);
    if (!updated) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    if (before) await applyStockOnUpdate(resource, before, updated);
    return NextResponse.json(resource === "staff" ? sanitizeStaff(updated) : updated);
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal mengubah data di database" }, { status: 500 });
  }
}

// Resource yang menyimpan referensi ke patientId — ikut dihapus saat
// pasien pemiliknya dihapus, supaya tidak ada data "yatim" yang tersisa.
const PATIENT_DEPENDENT_RESOURCES = [
  "appointments", "medicalNotes", "inpatientCare", "vaccinations", "procedures", "labResults", "finance",
];

export async function DELETE(req, { params }) {
  const { resource, id } = params;
  if (!checkResource(resource)) return NextResponse.json({ error: "Resource tidak dikenal" }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const allowedRoles = WRITE_ROLES[resource];
  if (allowedRoles && !hasRole(session, allowedRoles)) {
    return NextResponse.json({ error: "Tidak punya akses untuk menghapus data ini" }, { status: 403 });
  }
  if (resource === "staff" && session.isDemo) {
    return NextResponse.json({ error: "Akun demo tidak dapat mengubah pengaturan." }, { status: 403 });
  }

  if (resource === "owners") {
    const patients = await getAll("patients");
    if (patients.some((p) => p.ownerId === id)) {
      return NextResponse.json(
        { error: "Tidak bisa menghapus pemilik ini karena masih memiliki data pasien terkait. Hapus atau pindahkan pasiennya terlebih dahulu." },
        { status: 400 }
      );
    }
  }

  try {
    if (resource === "patients") {
      for (const dep of PATIENT_DEPENDENT_RESOURCES) {
        const items = await getAll(dep);
        const toDelete = items.filter((it) => {
          if (it.patientId === id) return true;
          if (dep === "finance") {
            if (Array.isArray(it.patientIds) && it.patientIds.includes(id)) return true;
            if (Array.isArray(it.items) && it.items.some((row) => row.patientId === id)) return true;
          }
          return false;
        });
        for (const it of toDelete) {
          await applyStockOnDelete(dep, it);
          await deleteItem(dep, it.id);
        }
      }
    }
    const existing = await getOne(resource, id);
    if (existing) await applyStockOnDelete(resource, existing);
    await deleteItem(resource, id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal menghapus data di database" }, { status: 500 });
  }
}