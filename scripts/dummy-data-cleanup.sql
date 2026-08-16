-- =====================================================================
-- HAPUS DATA DUMMY - Lareangon Klinik Hewan
-- =====================================================================
-- Jalankan file ini di SQL Editor (Neon/Supabase/dll) untuk menghapus
-- SEMUA data contoh yang dibuat oleh dummy-data-seed.sql.
--
-- Aman: hanya menghapus baris yang id-nya berawalan "dummy-", jadi data
-- asli klinik (pasien, pemilik, dst. yang dibuat lewat aplikasi) TIDAK
-- akan terpengaruh sama sekali.
--
-- Kalau nanti mau isi ulang data dummu yang baru, tinggal jalankan
-- dummy-data-cleanup.sql (file ini) lalu dummy-data-seed.sql lagi.
-- =====================================================================

DELETE FROM items WHERE id LIKE 'dummy-%';
