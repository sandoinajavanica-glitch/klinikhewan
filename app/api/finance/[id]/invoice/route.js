import { NextResponse } from "next/server";
import { getOne } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { buildInvoicePdf } from "@/lib/invoicePdf";
import { financePatientIds } from "@/lib/constants";

export async function GET(req, { params }) {
  const { id } = params;

  try {
    const item = await getOne("finance", id);
    if (!item) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });

    // Staf yang login selalu boleh membuka. Tanpa sesi login (mis. pemilik
    // hewan yang membuka link dari WhatsApp), harus menyertakan token yang
    // sama dengan shareToken transaksi ini.
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const session = await getSession();
    const validToken = Boolean(token) && Boolean(item.shareToken) && token === item.shareToken;
    if (!session && !validToken) {
      return NextResponse.json({ error: "Belum login" }, { status: 401 });
    }

    const patientIds = financePatientIds(item);
    const patients = [];
    for (const pid of patientIds) {
      const p = await getOne("patients", pid);
      if (p) patients.push(p);
    }
    const owner = item.ownerId
      ? await getOne("owners", item.ownerId)
      : patients[0]?.ownerId
      ? await getOne("owners", patients[0].ownerId)
      : null;

    const { buffer, invoiceNo } = await buildInvoicePdf({ transaction: item, patients, owner });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoiceNo}.pdf"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || "Gagal membuat nota/invoice" }, { status: 500 });
  }
}
