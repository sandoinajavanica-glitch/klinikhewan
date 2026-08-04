import { NextResponse } from "next/server";
import { getRawSql } from "@/lib/db";
import { getSession, hasRole } from "@/lib/auth";

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  if (!hasRole(session, ["Admin"])) {
    return NextResponse.json({ error: "Hanya Admin yang bisa memulihkan (restore) backup" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!file) return NextResponse.json({ error: "Tidak ada file yang diunggah" }, { status: 400 });
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file maksimal 20MB" }, { status: 400 });
  }

  const text = await file.text();
  if (!text.includes("CREATE TABLE") || !text.includes("items")) {
    return NextResponse.json(
      { error: "File tidak dikenali sebagai backup Lareangon yang valid." },
      { status: 400 }
    );
  }

  try {
    const sql = getRawSql();
    await sql.begin(async (tx) => {
      await tx.unsafe(text);
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal memulihkan backup. Data saat ini tidak berubah (dibatalkan otomatis)." }, { status: 500 });
  }
}
