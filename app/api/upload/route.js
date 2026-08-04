import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession, hasRole } from "@/lib/auth";
import { uid } from "@/lib/db";

const MAX_SIZE = 4 * 1024 * 1024; // 4MB per file
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Belum login" }, { status: 401 });
  if (!hasRole(session, ["Admin", "Dokter"])) {
    return NextResponse.json({ error: "Hanya dokter/admin yang bisa mengunggah foto rekam medis" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!file) return NextResponse.json({ error: "Tidak ada file" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Format harus JPG, PNG, atau WEBP" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Ukuran file maksimal 4MB" }, { status: 400 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Penyimpanan foto belum dikonfigurasi (BLOB_READ_WRITE_TOKEN belum diset di Vercel)." },
      { status: 500 }
    );
  }

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `rekam-medis/${uid()}.${ext}`;

  try {
    const blob = await put(filename, file, { access: "public", addRandomSuffix: false });
    return NextResponse.json({ url: blob.url, name: file.name });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal mengunggah foto" }, { status: 500 });
  }
}
