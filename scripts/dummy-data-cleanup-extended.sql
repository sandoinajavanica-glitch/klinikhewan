-- =====================================================================
-- HAPUS DATA DUMMY TAMBAHAN (EXTENDED) - Lareangon Klinik Hewan
-- =====================================================================
-- Jalankan file ini untuk menghapus SEMUA data contoh yang dibuat oleh
-- dummy-data-seed-extended.sql.
--
-- Aman: hanya menghapus baris yang id-nya berawalan "ext-", jadi data
-- dummy lama (awalan "dummy-") dan data asli klinik TIDAK terpengaruh.
-- =====================================================================

DELETE FROM items WHERE id LIKE 'ext-%';
