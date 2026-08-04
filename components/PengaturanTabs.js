"use client";

import { useState } from "react";
import { Users, Database } from "lucide-react";
import StaffManager from "./StaffManager";
import BackupManager from "./BackupManager";

const TABS = [
  { key: "staff", label: "Manajemen Staf", icon: Users },
  { key: "backup", label: "Backup Data", icon: Database },
];

export default function PengaturanTabs() {
  const [tab, setTab] = useState("staff");

  return (
    <div>
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e5e7eb", marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <div
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", cursor: "pointer",
                fontSize: 13.5, fontWeight: active ? 600 : 500, color: active ? "#059669" : "#6b7280",
                borderBottom: active ? "2px solid #059669" : "2px solid transparent", marginBottom: -1,
              }}
            >
              <Icon size={15} /> {t.label}
            </div>
          );
        })}
      </div>

      {tab === "staff" && (
        <div>
          <div style={{ fontSize: 11.5, color: "#9ca3af", marginBottom: 14 }}>
            Peran menentukan hak akses: Admin mengelola staf, Dokter dapat menulis semua bagian rekam medis, Paramedis sama seperti Resepsionis ditambah bisa mengisi Hasil Lab, Groomer sama seperti Resepsionis ditambah bisa mengisi Log Perawatan, Resepsionis hanya dapat melihat rekam medis dan mengelola jadwal/pasien/keuangan. Login memakai email &amp; password.
          </div>
          <StaffManager />
        </div>
      )}

      {tab === "backup" && <BackupManager />}
    </div>
  );
}
