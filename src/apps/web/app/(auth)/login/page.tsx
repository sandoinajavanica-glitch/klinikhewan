"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWith(emailValue: string, passwordValue: string) {
    setError("");
    setLoading(true);
    setEmail(emailValue);
    setPassword(passwordValue);

    const result = await signIn("credentials", {
      email: emailValue,
      password: passwordValue,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Email atau kata sandi tidak valid");
    } else {
      // HAPUS atau KOMENTARI baris bawaan ini:
      // router.push("/");
      // router.refresh();

      // GANTI dengan baris ini untuk memaksa browser memuat halaman dashboard:
      window.location.href = "/";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signInWith(email, password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">
            DraftKlinik
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk ke akun klinik
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="anda@klinik.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Kata Sandi
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Masukkan kata sandi kamu"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Sedang masuk..." : "Masuk"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="text-primary hover:underline"
          >
            Lupa kata sandi?
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Belum punya akun?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Daftarkan klinik kamu
          </Link>
        </p>
      </div>
    </div>
  );
}
