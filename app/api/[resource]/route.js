import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAll, createItem, COLLECTIONS } from "@/lib/db";
import { getSession, hasRole } from "@/lib/auth";

// Peran yang boleh MENAMBAH data per koleksi. Semua peran yang login boleh membaca (GET).
const WRITE_ROLES = {
  staff: ["Admin"],
  medicalNotes: ["Admin", "Dokter"],
  careLog: ["Admin", "Dokter", "Groomer"],
  inpatientCare: ["Admin", "Dokter"],
  vaccinations: ["Admin", "Dokter"],
  labResults: ["Admin", "Dokter", "Paramedis"],
  procedures: ["Admin", "Dokter"],
};

function checkResource(resource) {
  return COLLECTIONS.includes(resource);
}

// Data staf tidak pernah dikirim ke browser dengan hash password-nya.
function sanitizeStaff(item) {
  const { passwordHash, password, ...rest } = item;
  return rest;
}

export async function GET(req, { params }) {
  const { resource } = params;
  if (!checkResource(resource)) return NextResponse.json({ error: "Resource tidak dikenal" }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  try {
    let items = await getAll(resource);
    if (resource === "staff") items = items.map(sanitizeStaff);
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal mengambil data dari database" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  const { resource } = params;
  if (!checkResource(resource)) return NextResponse.json({ error: "Resource tidak dikenal" }, { status: 404 });
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  const allowedRoles = WRITE_ROLES[resource];
  if (allowedRoles && !hasRole(session, allowedRoles)) {
    return NextResponse.json({ error: "Tidak punya akses untuk menambah data ini" }, { status: 403 });
  }
  const body = await req.json();

  if (resource === "staff") {
    if (!body.email || !String(body.email).trim()) {
      return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 });
    }
    if (!body.password || !String(body.password).trim()) {
      return NextResponse.json({ error: "Password wajib diisi untuk staf baru." }, { status: 400 });
    }
    const existing = await getAll("staff");
    if (existing.some((s) => String(s.email || "").toLowerCase() === String(body.email).trim().toLowerCase())) {
      return NextResponse.json({ error: "Email sudah dipakai staf lain." }, { status: 400 });
    }
    body.email = String(body.email).trim().toLowerCase();
    body.passwordHash = await bcrypt.hash(body.password, 10);
    delete body.password;
  }

  try {
    const item = await createItem(resource, body);
    return NextResponse.json(resource === "staff" ? sanitizeStaff(item) : item);
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal menyimpan data ke database" }, { status: 500 });
  }
}
