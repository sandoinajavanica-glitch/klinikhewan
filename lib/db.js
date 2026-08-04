import postgres from "postgres";

// Semua koleksi (dulu "tabel" di JSON) yang dikenal aplikasi.
export const COLLECTIONS = [
  "patients",
  "owners",
  "appointments",
  "medicalNotes",
  "careLog",
  "inpatientCare",
  "vaccinations",
  "labResults",
  "procedures",
  "inventory",
  "finance",
  "staff",
];

// Satu koneksi (dibuat sekali, dipakai ulang) ke database Postgres.
// Bekerja dengan provider Postgres manapun (Supabase, Neon, dll) selama
// DATABASE_URL adalah connection string Postgres standar.
let _sql;
function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL belum diset. Tambahkan connection string database di Environment Variables Vercel (atau .env.local saat development)."
    );
  }
  if (!_sql) {
    _sql = postgres(process.env.DATABASE_URL, { ssl: "require", prepare: false });
  }
  return _sql;
}

// Untuk kebutuhan lanjutan (backup/restore) yang butuh akses SQL mentah.
export function getRawSql() {
  return getSql();
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

// Beberapa driver Postgres mengembalikan kolom jsonb sudah berupa objek JS,
// sebagian lain mengembalikannya sebagai teks JSON mentah. Fungsi ini aman
// untuk kedua kemungkinan tersebut.
function parseData(d) {
  if (d == null) return {};
  if (typeof d === "string") {
    try { return JSON.parse(d); } catch (e) { return {}; }
  }
  return d;
}

// Semua data disimpan di satu tabel generik `items` (kolom `data` bertipe
// JSONB), dipisahkan per `resource`. Ini sengaja dibuat generik supaya semua
// endpoint CRUD (pasien, pemilik, jadwal, dst.) bisa memakai fungsi yang sama
// tanpa perlu tabel & migrasi terpisah untuk tiap koleksi.
export async function getAll(resource) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, data FROM items WHERE resource = ${resource} ORDER BY created_at ASC
  `;
  return rows.map((r) => ({ id: r.id, ...parseData(r.data) }));
}

export async function getOne(resource, id) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, data FROM items WHERE resource = ${resource} AND id = ${id} LIMIT 1
  `;
  if (!rows.length) return null;
  return { id: rows[0].id, ...parseData(rows[0].data) };
}

export async function createItem(resource, data) {
  const sql = getSql();
  const id = uid();
  await sql`
    INSERT INTO items (id, resource, data) VALUES (${id}, ${resource}, ${JSON.stringify(data)}::jsonb)
  `;
  return { id, ...data };
}

export async function updateItem(resource, id, data) {
  const sql = getSql();
  const existing = await getOne(resource, id);
  if (!existing) return null;
  const { id: _drop, ...prevData } = existing;
  const merged = { ...prevData, ...data };
  await sql`
    UPDATE items SET data = ${JSON.stringify(merged)}::jsonb
    WHERE resource = ${resource} AND id = ${id}
  `;
  return { id, ...merged };
}

export async function deleteItem(resource, id) {
  const sql = getSql();
  await sql`DELETE FROM items WHERE resource = ${resource} AND id = ${id}`;
  return true;
}
