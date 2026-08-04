-- Jalankan file ini SEKALI di SQL Editor (Neon/Supabase) setelah membuat
-- project/database baru, sebelum aplikasi dipakai.

CREATE TABLE IF NOT EXISTS items (
  id text PRIMARY KEY,
  resource text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_resource ON items (resource);

-- Data staf awal untuk login (email + password).
-- Password di bawah ini masih polos (belum di-hash) HANYA untuk data awal —
-- begitu staf berhasil login pertama kali, aplikasi otomatis meng-hash dan
-- menyimpannya ulang dengan aman. Setelah login pertama, SEGERA ganti
-- password lewat menu Pengaturan.
INSERT INTO items (id, resource, data) VALUES
  ('admin1', 'staff', '{"name":"ismundiono","role":"Admin","email":"admin@draftklinik.local","password":"admin123"}'::jsonb),
  ('dok1',   'staff', '{"name":"drg. Ani","role":"Dokter","email":"ani@draftklinik.local","password":"dokter123"}'::jsonb),
  ('dok2',   'staff', '{"name":"drg. Budi","role":"Dokter","email":"budi@draftklinik.local","password":"dokter123"}'::jsonb),
  ('resep1', 'staff', '{"name":"Resepsionis Klinik","role":"Resepsionis","email":"resepsionis@draftklinik.local","password":"resepsionis123"}'::jsonb)
ON CONFLICT (id) DO NOTHING;
