import { cookies } from "next/headers";

export const SESSION_COOKIE = "draftklinik_session";

// Catatan: ini sesi sederhana (cookie berisi JSON ter-encode base64) yang cocok
// untuk aplikasi internal di jaringan klinik. Untuk penggunaan yang terekspos
// ke internet publik, ganti dengan sesi yang ditandatangani (mis. JWT + secret)
// atau library seperti next-auth / iron-session.

export function encodeSession(user) {
  const payload = { id: user.id, name: user.name, role: user.role };
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64");
}

export function decodeSession(value) {
  try {
    const json = Buffer.from(value, "base64").toString("utf-8");
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// Dipakai di Server Component / Route Handler (async, membaca cookies()).
export async function getSession() {
  const store = cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decodeSession(raw);
}

export function hasRole(session, allowedRoles) {
  if (!session) return false;
  return allowedRoles.includes(session.role);
}
