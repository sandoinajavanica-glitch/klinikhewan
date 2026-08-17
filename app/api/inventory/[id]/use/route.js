import { NextResponse } from "next/server";
import { getOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { adjustStock } from "@/lib/inventoryStock";

// POST /api/inventory/:id/use  body: { qty: number }
// Mengurangi stok item inventaris sebanyak `qty` (harus > 0). Dipakai oleh
// tombol cepat "Pakai Stok" di halaman Inventaris, sebagai jalan pintas
// tanpa perlu masuk mode edit penuh.
export async function POST(req, { params }) {
  const { id } = params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Belum login" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const qty = Number(body?.qty);
  if (!qty || qty <= 0) {
    return NextResponse.json({ error: "Jumlah pemakaian harus lebih dari 0." }, { status: 400 });
  }

  const existing = await getOne("inventory", id);
  if (!existing) return NextResponse.json({ error: "Item inventaris tidak ditemukan" }, { status: 404 });

  const currentStock = Number(existing.stock) || 0;
  if (qty > currentStock) {
    return NextResponse.json(
      { error: `Jumlah melebihi stok tersedia (sisa ${currentStock} ${existing.unit || ""}).` },
      { status: 400 }
    );
  }

  try {
    const updated = await adjustStock(id, -qty);
    if (!updated) return NextResponse.json({ error: "Gagal memperbarui stok" }, { status: 500 });
    const data = typeof updated.data === "string" ? JSON.parse(updated.data) : updated.data;
    return NextResponse.json({ id: updated.id, ...data });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal memperbarui stok" }, { status: 500 });
  }
}
