-- =====================================================================
-- DATA DUMMY - Lareangon Klinik Hewan
-- =====================================================================
-- Cara pakai: buka SQL Editor di provider database kamu (Neon/Supabase/dll),
-- lalu jalankan file ini SEKALI. File ini HANYA menambahkan (INSERT) data
-- contoh baru dengan id berawalan "dummy-" — data yang sudah ada (data asli
-- klinik) TIDAK akan tersentuh/terhapus sama sekali.
--
-- Untuk menghapus data dummy ini nanti, jalankan file
-- dummy-data-cleanup.sql (satu baris DELETE yang aman, hanya menyasar
-- baris dengan id berawalan "dummy-").
--
-- Cakupan data dummy di bawah ini: 5 pemilik, 7 pasien (mewakili semua
-- jenis: Anjing, Kucing, Kelinci, Burung, Reptil), 5 jadwal, 3 catatan
-- medis, 2 log perawatan, 2 catatan rawat inap, 3 riwayat vaksin,
-- 2 tindakan, 2 hasil lab, 5 item inventaris, dan 4 transaksi keuangan.
-- =====================================================================

-- ---------- Pemilik ----------
INSERT INTO items (id, resource, data) VALUES
  ('dummy-own-1', 'owners', '{"name":"Budi Santoso","phone":"0812-3456-7890","address":"Jl. Merdeka No. 12, Jakarta Selatan"}'::jsonb),
  ('dummy-own-2', 'owners', '{"name":"Siti Aminah","phone":"0813-2345-6789","address":"Jl. Kenanga No. 5, Bandung"}'::jsonb),
  ('dummy-own-3', 'owners', '{"name":"Andi Wijaya","phone":"0857-1122-3344","address":"Jl. Sudirman No. 88, Surabaya"}'::jsonb),
  ('dummy-own-4', 'owners', '{"name":"Rina Marlina","phone":"0821-9988-7766","address":"Jl. Diponegoro No. 21, Semarang"}'::jsonb),
  ('dummy-own-5', 'owners', '{"name":"Hendra Gunawan","phone":"0878-5566-7788","address":"Jl. Gatot Subroto No. 3, Medan"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ---------- Pasien ----------
INSERT INTO items (id, resource, data) VALUES
  ('dummy-pat-1', 'patients', '{"name":"Milo","species":"Anjing","breed":"Golden Retriever","birthDate":"2022-03-15","ownerId":"dummy-own-1"}'::jsonb),
  ('dummy-pat-2', 'patients', '{"name":"Luna","species":"Kucing","breed":"Anggora","birthDate":"2021-07-01","ownerId":"dummy-own-1"}'::jsonb),
  ('dummy-pat-3', 'patients', '{"name":"Kiki","species":"Kelinci","breed":"Anggora","birthDate":"2023-01-10","ownerId":"dummy-own-2"}'::jsonb),
  ('dummy-pat-4', 'patients', '{"name":"Coco","species":"Burung","breed":"Kakatua","birthDate":"2020-11-20","ownerId":"dummy-own-3"}'::jsonb),
  ('dummy-pat-5', 'patients', '{"name":"Rex","species":"Anjing","breed":"Pudel","birthDate":"2019-05-05","ownerId":"dummy-own-4"}'::jsonb),
  ('dummy-pat-6', 'patients', '{"name":"Sisi","species":"Reptil","breed":"Iguana","birthDate":"2022-09-09","ownerId":"dummy-own-5"}'::jsonb),
  ('dummy-pat-7', 'patients', '{"name":"Bella","species":"Kucing","breed":"Persia","birthDate":"2023-06-18","ownerId":"dummy-own-2"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ---------- Jadwal / Appointments ----------
INSERT INTO items (id, resource, data) VALUES
  ('dummy-appt-1', 'appointments', '{"patientId":"dummy-pat-1","date":"2026-08-20","time":"09:00","doctor":"drg. Ani","reason":"Vaksinasi rutin","status":"Menunggu"}'::jsonb),
  ('dummy-appt-2', 'appointments', '{"patientId":"dummy-pat-2","date":"2026-08-20","time":"10:30","doctor":"drg. Budi","reason":"Kontrol bulanan","status":"Menunggu"}'::jsonb),
  ('dummy-appt-3', 'appointments', '{"patientId":"dummy-pat-4","date":"2026-08-18","time":"13:00","doctor":"drg. Ani","reason":"Sakit sayap","status":"Selesai"}'::jsonb),
  ('dummy-appt-4', 'appointments', '{"patientId":"dummy-pat-5","date":"2026-08-15","time":"08:30","doctor":"drg. Budi","reason":"Cek gigi","status":"Selesai"}'::jsonb),
  ('dummy-appt-5', 'appointments', '{"patientId":"dummy-pat-6","date":"2026-08-22","time":"15:00","doctor":"drg. Ani","reason":"Pemeriksaan kulit","status":"Menunggu"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ---------- Catatan Medis ----------
INSERT INTO items (id, resource, data) VALUES
  ('dummy-mn-1', 'medicalNotes', '{"patientId":"dummy-pat-1","date":"2026-08-01","anamnesis":"Nafsu makan menurun sejak 2 hari","weight":24.5,"temperature":38.7,"examination":"Kondisi umum baik, sedikit lesu","diagnosis":"Gastritis ringan","therapy":"Obat lambung 2x sehari selama 5 hari"}'::jsonb),
  ('dummy-mn-2', 'medicalNotes', '{"patientId":"dummy-pat-4","date":"2026-08-15","anamnesis":"Sayap kanan sulit digerakkan","weight":0.4,"temperature":40.1,"examination":"Bengkak ringan di sendi sayap","diagnosis":"Keseleo ringan","therapy":"Istirahat & anti-inflamasi"}'::jsonb),
  ('dummy-mn-3', 'medicalNotes', '{"patientId":"dummy-pat-5","date":"2026-08-10","anamnesis":"Kontrol rutin gigi","weight":8.2,"temperature":38.3,"examination":"Karang gigi ringan","diagnosis":"Tidak ada kelainan berarti","therapy":"Scaling gigi dijadwalkan"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ---------- Log Perawatan ----------
INSERT INTO items (id, resource, data) VALUES
  ('dummy-cl-1', 'careLog', '{"patientId":"dummy-pat-6","date":"2026-08-05","time":"08:00","condition":"Aktif, nafsu makan baik","actionLog":"Pemberian pakan & penjemuran pagi"}'::jsonb),
  ('dummy-cl-2', 'careLog', '{"patientId":"dummy-pat-1","date":"2026-08-01","time":"16:00","condition":"Lesu, tidak mau makan","actionLog":"Diberi obat lambung, dipantau"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ---------- Rawat Inap ----------
INSERT INTO items (id, resource, data) VALUES
  ('dummy-ic-1', 'inpatientCare', '{"patientId":"dummy-pat-1","date":"2026-08-01","period":"Sore","description":"Pasien rawat inap observasi gastritis","treatment":"Infus cairan & obat lambung"}'::jsonb),
  ('dummy-ic-2', 'inpatientCare', '{"patientId":"dummy-pat-4","date":"2026-08-15","period":"Siang","description":"Observasi sayap pasca cedera","treatment":"Kompres & anti-inflamasi"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ---------- Riwayat Vaksin ----------
INSERT INTO items (id, resource, data) VALUES
  ('dummy-vac-1', 'vaccinations', '{"patientId":"dummy-pat-1","date":"2026-06-01","vaccineType":"Rabies","vaccineNumber":"RB-2026-0456","doctor":"drg. Ani"}'::jsonb),
  ('dummy-vac-2', 'vaccinations', '{"patientId":"dummy-pat-2","date":"2026-05-20","vaccineType":"Tricat","vaccineNumber":"TC-2026-0221","doctor":"drg. Budi"}'::jsonb),
  ('dummy-vac-3', 'vaccinations', '{"patientId":"dummy-pat-5","date":"2026-04-10","vaccineType":"DHPPi","vaccineNumber":"DH-2026-0099","doctor":"drg. Ani"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ---------- Tindakan ----------
INSERT INTO items (id, resource, data) VALUES
  ('dummy-proc-1', 'procedures', '{"patientId":"dummy-pat-3","date":"2026-07-12","procedureName":"Potong Kuku","description":"Kuku terlalu panjang, mengganggu jalan","medication":"-","notes":"Kondisi baik setelah tindakan"}'::jsonb),
  ('dummy-proc-2', 'procedures', '{"patientId":"dummy-pat-7","date":"2026-07-25","procedureName":"Sterilisasi","description":"Sterilisasi elektif","medication":"Anastesi umum + antibiotik","notes":"Pemulihan 7-10 hari, kontrol luka"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ---------- Hasil Lab ----------
INSERT INTO items (id, resource, data) VALUES
  ('dummy-lab-1', 'labResults', '{"patientId":"dummy-pat-1","date":"2026-08-01","testName":"Hematologi Lengkap","value":"Normal","unit":"-"}'::jsonb),
  ('dummy-lab-2', 'labResults', '{"patientId":"dummy-pat-5","date":"2026-08-10","testName":"Urinalisa","value":"Sedikit keruh","unit":"-"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ---------- Inventaris ----------
INSERT INTO items (id, resource, data) VALUES
  ('dummy-inv-1', 'inventory', '{"name":"Amoxicillin 500mg","category":"Obat","stock":120,"unit":"strip","minStock":20,"expiry":"2027-03-01"}'::jsonb),
  ('dummy-inv-2', 'inventory', '{"name":"Vaksin Rabies","category":"Vaksin","stock":15,"unit":"vial","minStock":10,"expiry":"2026-12-01"}'::jsonb),
  ('dummy-inv-3', 'inventory', '{"name":"Spuit 3ml","category":"Alat Medis","stock":200,"unit":"pcs","minStock":50,"expiry":null}'::jsonb),
  ('dummy-inv-4', 'inventory', '{"name":"Kalung Anti Kutu","category":"Lainnya","stock":8,"unit":"pcs","minStock":10,"expiry":null}'::jsonb),
  ('dummy-inv-5', 'inventory', '{"name":"Vitamin B Kompleks","category":"Obat","stock":40,"unit":"botol","minStock":10,"expiry":"2026-09-05"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ---------- Keuangan ----------
INSERT INTO items (id, resource, data) VALUES
  ('dummy-fin-1', 'finance', '{"date":"2026-08-01","type":"Masuk","ownerId":"dummy-own-1","doctor":"drg. Ani","patientIds":["dummy-pat-1"],"items":[{"patientId":"dummy-pat-1","description":"Konsultasi + Obat Lambung","qty":1,"price":150000}],"description":"Konsultasi + Obat Lambung","amount":150000}'::jsonb),
  ('dummy-fin-2', 'finance', '{"date":"2026-07-25","type":"Masuk","ownerId":"dummy-own-2","doctor":"drg. Budi","patientIds":["dummy-pat-7"],"items":[{"patientId":"dummy-pat-7","description":"Biaya Sterilisasi","qty":1,"price":850000},{"patientId":"dummy-pat-7","description":"Obat Pasca Operasi","qty":1,"price":75000}],"description":"Biaya Sterilisasi (+1 item lainnya)","amount":925000}'::jsonb),
  ('dummy-fin-3', 'finance', '{"date":"2026-08-15","type":"Masuk","ownerId":"dummy-own-4","doctor":"drg. Budi","patientIds":["dummy-pat-5"],"items":[{"patientId":"dummy-pat-5","description":"Cek Gigi & Scaling","qty":1,"price":300000}],"description":"Cek Gigi & Scaling","amount":300000}'::jsonb),
  ('dummy-fin-4', 'finance', '{"date":"2026-08-05","type":"Keluar","ownerId":"","doctor":"","patientIds":[],"items":[{"patientId":"","description":"Pembelian Stok Obat & Vaksin","qty":1,"price":2500000}],"description":"Pembelian Stok Obat & Vaksin","amount":2500000}'::jsonb)
ON CONFLICT (id) DO NOTHING;
