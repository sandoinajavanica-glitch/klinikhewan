import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAll, updateItem } from "@/lib/db";
import { encodeSession, SESSION_COOKIE, isDemoModeEnabled, isDemoLoginEmail } from "@/lib/auth";

export async function POST(req) {
  const body = await req.json();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan password wajib diisi." }, { status: 400 });
  }

  let staffList;
  try {
    staffList = await getAll("staff");
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal terhubung ke database" }, { status: 500 });
  }

  const staff = staffList.find((s) => String(s.email || "").toLowerCase() === email);
  if (!staff) {
    return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
  }

  let ok = false;

  if (staff.passwordHash) {
    ok = await bcrypt.compare(password, staff.passwordHash);
  } else if (staff.password) {
    // Data lama (seed awal / migrasi dari sistem PIN) masih pakai password polos.
    // Kalau cocok, langsung di-hash dan disimpan ulang supaya ke depannya aman.
    ok = password === staff.password;
    if (ok) {
      try {
        const passwordHash = await bcrypt.hash(password, 10);
        await updateItem("staff", staff.id, { passwordHash, password: undefined });
      } catch (e) {
        // Migrasi gagal tidak menghalangi login yang sedang berjalan.
      }
    }
  }

  if (!ok) {
    return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
  }

  const isDemo = isDemoModeEnabled() && isDemoLoginEmail(email);

  const res = NextResponse.json({ id: staff.id, name: staff.name, role: staff.role, isDemo });
  res.cookies.set(SESSION_COOKIE, encodeSession({ ...staff, isDemo }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 jam
  });
  return res;
}
