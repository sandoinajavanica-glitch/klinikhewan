"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, PawPrint, Users, Calendar, FileText, DollarSign,
  Package, Columns3, BarChart2, Settings, LogOut, Menu, X,
} from "lucide-react";
import { NAV } from "@/lib/constants";
import { useEffect, useState } from "react";
import { SessionProvider } from "./SessionContext";

const ICONS = {
  dashboard: LayoutDashboard, pasien: PawPrint, pemilik: Users, jadwal: Calendar,
  "rekam-medis": FileText, keuangan: DollarSign, inventaris: Package,
  "papan-kerja": Columns3, laporan: BarChart2, pengaturan: Settings,
};

export default function Shell({ session, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = NAV.filter((n) => !n.roles || n.roles.includes(session.role));
  const active = NAV.find((n) => pathname?.startsWith(n.href));

  // Kunci scroll halaman di belakang saat sidebar mobile terbuka.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Tutup otomatis kalau layar dibesarkan melewati breakpoint mobile.
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 900) setMobileOpen(false);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const initials = session.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="app-shell">
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <div className={"sidebar" + (mobileOpen ? " open" : "")}>
        <div className="sidebar-logo">
          <span className="mark">
            <Image src="/logo-mark.png" alt="Lareangon" width={30} height={30} priority />
          </span>
          Lareangon
          <button className="btn-icon sidebar-close-btn" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>
        <div className="sidebar-nav">
          {visibleNav.map((n) => {
            const Icon = ICONS[n.key];
            const isActive = pathname?.startsWith(n.href);
            return (
              <Link key={n.key} href={n.href} onClick={() => setMobileOpen(false)}>
                <div className={"nav-item" + (isActive ? " active" : "")}>
                  <Icon size={16} />
                  {n.label}
                </div>
              </Link>
            );
          })}
        </div>
        <div className="sidebar-user">
          <div className="avatar">{initials}</div>
          <div style={{ lineHeight: 1.2, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {session.name}
              {session.isDemo && (
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: "#059669", background: "#05966922", padding: "1px 6px", borderRadius: 999 }}>
                  DEMO
                </span>
              )}
            </div>
            <div style={{ fontSize: 11.5, color: "#9ca3af" }}>{session.role}</div>
          </div>
          <button className="btn-icon" title="Keluar" onClick={logout}><LogOut size={16} /></button>
        </div>
      </div>

      <div className="main-area">
        <div className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn-icon hamburger-btn" onClick={() => setMobileOpen((v) => !v)}><Menu size={18} /></button>
            <h2>{active ? active.label : ""}</h2>
          </div>
        </div>
        <div className="content"><SessionProvider session={session}>{children}</SessionProvider></div>
      </div>
    </div>
  );
}