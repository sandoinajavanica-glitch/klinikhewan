import { getRawSql } from "./db";

// Ubah stok satu item inventaris sebesar `delta` (boleh negatif untuk
// mengurangi, positif untuk mengembalikan/menambah) secara atomik langsung
// di database (bukan read-modify-write di Node), supaya aman kalau ada
// beberapa staf memakai stok yang sama secara bersamaan.
// Stok tidak pernah dibiarkan minus (dibatasi minimum 0).
export async function adjustStock(inventoryId, delta) {
  if (!inventoryId || !delta) return null;
  const sql = getRawSql();
  const rows = await sql`
    UPDATE items
    SET data = jsonb_set(
      data,
      '{stock}',
      to_jsonb(GREATEST(0, COALESCE((data->>'stock')::numeric, 0) + (${delta}::numeric)))
    )
    WHERE resource = 'inventory' AND id = ${inventoryId}
    RETURNING id, data
  `;
  return rows[0] || null;
}

// Terapkan sekumpulan perubahan stok { inventoryId: delta, ... } satu per satu.
export async function adjustStockMany(deltaMap) {
  const entries = Object.entries(deltaMap || {}).filter(([id, delta]) => id && Number(delta));
  for (const [id, delta] of entries) {
    await adjustStock(id, delta);
  }
}

// Gabungkan beberapa daftar { inventoryId, qty } (boleh dari sumber berbeda,
// misal medicationItems tindakan + items keuangan) menjadi satu peta delta,
// dikalikan `sign` (-1 untuk mengurangi stok, +1 untuk mengembalikan).
export function buildStockDeltaMap(rows, sign = -1) {
  const map = {};
  for (const row of rows || []) {
    const id = row?.inventoryId;
    const qty = Number(row?.qty) || 0;
    if (!id || !qty) continue;
    map[id] = (map[id] || 0) + qty * sign;
  }
  return map;
}

// Ambil rincian pemakaian inventaris dari sebuah record tindakan (procedures).
export function procedureInventoryRows(procedure) {
  return Array.isArray(procedure?.medicationItems) ? procedure.medicationItems : [];
}

// Ambil rincian pemakaian inventaris dari rincian item transaksi keuangan
// (hanya baris yang dikaitkan ke item inventaris lewat inventoryId).
export function financeInventoryRows(tx) {
  const items = Array.isArray(tx?.items) ? tx.items : [];
  return items.filter((r) => r?.inventoryId).map((r) => ({ inventoryId: r.inventoryId, qty: r.qty }));
}
