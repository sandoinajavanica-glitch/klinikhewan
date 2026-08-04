import { NextResponse } from "next/server";
import { getRawSql } from "@/lib/db";
import { getSession, hasRole } from "@/lib/auth";

function escapeSqlString(str) {
  return String(str).replace(/'/g, "''");
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  if (!hasRole(session, ["Admin"])) {
    return NextResponse.json({ error: "Hanya Admin yang bisa membuat backup" }, { status: 403 });
  }

  try {
    const sql = getRawSql();
    const rows = await sql`SELECT id, resource, data, created_at FROM items ORDER BY resource, created_at`;

    const now = new Date();
    let out = "";
    out += `-- Backup data Lareangon\n`;
    out += `-- Dibuat pada: ${now.toISOString()}\n`;
    out += `-- Total baris: ${rows.length}\n\n`;
    out += `CREATE TABLE IF NOT EXISTS items (\n`;
    out += `  id text PRIMARY KEY,\n`;
    out += `  resource text NOT NULL,\n`;
    out += `  data jsonb NOT NULL,\n`;
    out += `  created_at timestamptz NOT NULL DEFAULT now()\n`;
    out += `);\n\n`;
    out += `CREATE INDEX IF NOT EXISTS idx_items_resource ON items (resource);\n\n`;
    out += `-- Mengosongkan data saat ini sebelum memasukkan data dari backup ini.\n`;
    out += `DELETE FROM items;\n\n`;

    for (const r of rows) {
      const dataObj = typeof r.data === "string" ? JSON.parse(r.data) : r.data;
      const idLit = escapeSqlString(r.id);
      const resourceLit = escapeSqlString(r.resource);
      const dataLit = escapeSqlString(JSON.stringify(dataObj));
      const createdAtLit = new Date(r.created_at).toISOString();
      out += `INSERT INTO items (id, resource, data, created_at) VALUES ('${idLit}', '${resourceLit}', '${dataLit}'::jsonb, '${createdAtLit}');\n`;
    }

    const dateStr = now.toISOString().slice(0, 10);
    return new NextResponse(out, {
      status: 200,
      headers: {
        "Content-Type": "application/sql; charset=utf-8",
        "Content-Disposition": `attachment; filename="draftklinik-backup-${dateStr}.sql"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal membuat backup" }, { status: 500 });
  }
}
