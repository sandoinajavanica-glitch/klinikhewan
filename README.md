# Lareangon — Aplikasi Internal Klinik Hewan

Aplikasi Next.js untuk manajemen operasional klinik hewan (internal staf saja):
pasien, pemilik, jadwal/antrian, rekam medis, keuangan, inventaris obat,
papan kerja, laporan, dan manajemen staf dengan hak akses per peran.

**Database:** PostgreSQL via [Neon](https://neon.tech) (gratis, tanpa kartu kredit).
**Foto rekam medis:** [Vercel Blob](https://vercel.com/storage/blob) (gratis 1GB di plan Hobby).

Panduan di bawah ini urut: (1) jalankan lokal, (2) unggah ke GitHub,
(3) siapkan database Neon, (4) deploy ke Vercel.

---

## 1. Jalankan di komputer lokal (opsional, untuk tes dulu)

Proyek ini dibuat di lingkungan tanpa akses internet, jadi dependensi **belum
ter-install** dan **belum pernah dijalankan**. Di komputer Anda yang
terhubung internet:

```bash
cd draftklinik-next
npm install
cp .env.example .env.local
# lalu isi DATABASE_URL dan BLOB_READ_WRITE_TOKEN di .env.local (lihat langkah 3 & 4)
npm run dev
```

Buka `http://localhost:3000`.

---

## 2. Unggah ke GitHub

```bash
cd draftklinik-next
git init
git add .
git commit -m "Initial commit: Lareangon"
```

Lalu buat repo baru (kosong, tanpa README) di https://github.com/new,
misalnya bernama `draftklinik`. Setelah itu:

```bash
git branch -M main
git remote add origin https://github.com/USERNAME/draftklinik.git
git push -u origin main
```

Ganti `USERNAME` dengan akun GitHub Anda. `.env.local` tidak ikut ter-upload
(sudah di `.gitignore`) — aman, karena berisi kredensial rahasia.

---

## 3. Siapkan database gratis (Neon Postgres)

**Cara termudah — lewat Vercel (sekalian untuk langkah 5):**
1. Saat mengimpor proyek di Vercel (langkah 5), buka tab **Storage** di
   dashboard proyek → **Create Database** → pilih **Neon** (gratis, tanpa
   kartu kredit) → ikuti wizard-nya. Vercel otomatis menambahkan
   `DATABASE_URL` ke Environment Variables proyek Anda.

**Atau langsung di Neon:**
1. Daftar gratis di https://neon.tech (tidak perlu kartu kredit).
2. Buat project baru.
3. Buka **SQL Editor** di dashboard Neon, salin-tempel isi file
   `schema.sql` dari proyek ini, lalu jalankan (Run). Ini membuat tabel
   `items` dan 4 akun staf awal untuk login.
4. Salin **connection string** dari **Connection Details** (format
   `postgresql://user:pass@host/db?sslmode=require`) — ini nilai
   `DATABASE_URL` Anda.

Kalau pakai jalur "lewat Vercel", jangan lupa tetap jalankan isi `schema.sql`
sekali lewat SQL Editor Neon (buka database-nya dari tab Storage → "Open in
Neon") supaya tabel & data staf awal dibuatkan.

**Kenapa Neon?** Gratis selamanya untuk skala klinik kecil (ratusan/ribuan
baris data jauh di bawah batas gratisnya), terintegrasi native dengan Vercel,
dan berbasis PostgreSQL standar (mudah dipindah ke provider lain kalau perlu).
Alternatif lain yang juga punya tier gratis: **Supabase** (kalau nanti mau
tambah fitur auth/login Google, dsb.) atau **Turso** (kalau prefer SQLite).

---

## 4. Siapkan penyimpanan foto (Vercel Blob)

Fitur foto lab/rontgen di Rekam Medis butuh Vercel Blob (karena Vercel tidak
punya filesystem permanen — foto yang ditulis ke folder biasa akan hilang
saat deploy ulang).

1. Di dashboard proyek Vercel → tab **Storage** → **Create Database** →
   pilih **Blob** → beri nama, buat.
2. Vercel otomatis menambahkan `BLOB_READ_WRITE_TOKEN` ke Environment
   Variables proyek. Tidak perlu setting manual.
3. Gratis sampai 1GB penyimpanan & 10GB transfer/bulan di plan Hobby — lebih
   dari cukup untuk foto rekam medis klinik kecil.

---

## 4b. Kirim nota lewat WhatsApp

Menu **Keuangan** bisa mengirim nota/invoice ke pemilik hewan lewat WhatsApp
(link `wa.me`, langsung aktif tanpa setup apa pun — tidak butuh API
berbayar). Klik tombol kirim WA pada baris transaksi, lalu WhatsApp Web/App
akan terbuka dengan pesan + link PDF nota sudah terisi otomatis, tinggal
ditekan kirim.

Pastikan data **Pemilik** sudah diisi nomor teleponnya di menu Pemilik, agar
tombol ini bisa langsung membuka percakapan ke nomor yang benar.

---

## 5. Deploy ke Vercel

1. Daftar/masuk ke https://vercel.com, hubungkan akun GitHub Anda.
2. **Add New → Project** → pilih repo `draftklinik` yang barusan di-push.
3. Framework Preset otomatis terdeteksi **Next.js** — tidak perlu diubah.
4. Sebelum klik Deploy, buka **Environment Variables** dan tambahkan (kalau
   belum otomatis terisi dari integrasi Storage di langkah 3 & 4):
   - `DATABASE_URL` → connection string Neon
   - `BLOB_READ_WRITE_TOKEN` → token dari Vercel Blob
5. Klik **Deploy**. Setelah selesai, buka URL `*.vercel.app` yang diberikan.
6. Pastikan `schema.sql` sudah pernah dijalankan di Neon (langkah 3) sebelum
   mencoba login — kalau belum, halaman login akan menampilkan pesan error
   dari database.

Setiap kali Anda `git push` ke branch `main`, Vercel otomatis deploy ulang.

---

## Login staf

Login memakai email + password. Akun awal (dibuat lewat `schema.sql`):

| Nama              | Peran        | Email                          | Password default |
|-------------------|--------------|---------------------------------|-------------------|
| ismundiono        | Admin        | admin@draftklinik.local         | admin123          |
| drg. Ani          | Dokter       | ani@draftklinik.local           | dokter123         |
| drg. Budi         | Dokter       | budi@draftklinik.local          | dokter123         |
| Resepsionis Klinik| Resepsionis  | resepsionis@draftklinik.local   | resepsionis123    |

**Ganti password ini sebelum dipakai sungguhan**, lewat menu Pengaturan
(khusus Admin) setelah login.

## Mode Demo

Untuk membagikan aplikasi ini sebagai demo publik tanpa risiko datanya
diubah-ubah, aktifkan mode demo:

1. Set `NEXT_PUBLIC_DEMO_MODE=true`, `NEXT_PUBLIC_DEMO_EMAIL`, dan
   `NEXT_PUBLIC_DEMO_PASSWORD` di Environment Variables (lihat
   `.env.example`).
2. Pastikan ada akun staf dengan email & password yang **sama persis**
   dengan dua nilai di atas (baris `demo1` di `schema.sql` sudah menyediakan
   contohnya: `demo@lareangon.local` / `demo123`).
3. Saat aktif, halaman login menampilkan tombol **"Isi Email & Password
   Demo"** yang otomatis mengisi form login.
4. Staf yang login memakai email demo tersebut otomatis ditandai sebagai
   akun demo: mereka tetap bisa memakai seluruh fitur operasional klinik
   seperti biasa, tapi **tidak bisa mengubah apa pun di halaman Pengaturan**
   (tambah/edit/hapus staf, maupun impor/restore backup). Batasan ini
   diterapkan di server (API), jadi tidak bisa dilewati lewat panggilan API
   langsung — bukan cuma disembunyikan di tampilan.

## Hak akses per peran

- **Admin**: akses penuh, termasuk menu Pengaturan (kelola staf & PIN).
- **Dokter**: dapat menulis/mengubah rekam medis (diagnosis, tindakan, resep,
  unggah foto lab/rontgen), plus semua fitur operasional lain.
- **Resepsionis**: dapat mengelola pasien, pemilik, jadwal, keuangan, dan
  inventaris, tapi hanya bisa **melihat** rekam medis (tidak bisa menambah/
  mengubah).

Aturan ini diterapkan di server (API), bukan cuma disembunyikan di tampilan,
jadi tidak bisa dilewati hanya dengan mengubah tampilan di browser.

## Struktur data di database

Semua data (pasien, pemilik, jadwal, rekam medis, keuangan, inventaris, staf)
disimpan di satu tabel `items` dengan kolom `resource` (nama koleksi) dan
`data` (JSONB, isi record). Desain ini dipilih supaya seluruh API CRUD bisa
memakai fungsi yang sama tanpa migrasi skema terpisah tiap kali ada field
baru. Untuk kebutuhan query SQL yang lebih kompleks di kemudian hari, tabel
ini bisa dipecah per resource dengan kolom asli — struktur kode di `lib/db.js`
sengaja dipisah rapi supaya mudah diganti.

## Struktur folder singkat

```
app/
  login/                 halaman login
  (app)/                 halaman terproteksi (perlu login), berisi sidebar
    dashboard/  pasien/  pemilik/  jadwal/  rekam-medis/
    keuangan/   inventaris/  papan-kerja/  laporan/  pengaturan/
  api/
    auth/login, auth/logout, auth/me     autentikasi
    [resource]/, [resource]/[id]/        CRUD generik semua data (ke Neon)
    upload/                              unggah foto rekam medis (ke Vercel Blob)
lib/        db.js (Neon), auth.js (sesi), apiClient.js (fetch client), constants.js
components/ komponen UI & CRUD generik yang dipakai berulang di banyak halaman
schema.sql  jalankan sekali di Neon SQL Editor untuk membuat tabel & staf awal
```
