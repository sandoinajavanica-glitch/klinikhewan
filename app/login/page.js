"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Sparkles } from "lucide-react";

// Variabel ini HARUS diawali NEXT_PUBLIC_ dan diakses langsung (bukan lewat
// nama variabel lain) supaya Next.js bisa meng-inline nilainya ke bundle
// client saat build. Diset lewat .env.local / Environment Variables Vercel.
const DEMO_MODE = String(process.env.NEXT_PUBLIC_DEMO_MODE || "").toLowerCase() === "true";
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL || "";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || "";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function fillDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) { setError(body.error || "Login gagal"); setLoading(false); return; }
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-title">
          <Image src="/logo.png" alt="Lareangon" width={200} height={200} priority style={{ width: 130, height: "auto" }} />
          <div className="brand-sub">Portal Staf Klinik</div>
        </div>

        {DEMO_MODE && DEMO_EMAIL && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={fillDemo}
            style={{ width: "100%", justifyContent: "center", marginBottom: 14 }}
          >
            <Sparkles size={15} /> Isi Email &amp; Password Demo
          </button>
        )}

        <form onSubmit={submit}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@draftklinik.local" />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan password" />
          </div>
          {error && <div className="alert-error">{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}