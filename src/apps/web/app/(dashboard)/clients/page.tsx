"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/common/loading";

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = trpc.clients.list.useQuery({
    search: search || undefined,
    limit: 25,
    offset: 0,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-semibold">Pemilik</h2>
          <p className="text-sm text-muted-foreground">Kelola Data Pemilik</p>
        </div>
        <Button onClick={() => router.push("/clients/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Pemilik Baru
        </Button>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari pemilik..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {data && (
          <p className="text-sm text-muted-foreground">
            {data.total} client{data.total !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error.message}
        </div>
      )}

      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : data && data.items.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Nama
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Nomor Telp
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Kota
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Dibuat Tanggal
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => router.push(`/clients/${client.id}`)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">
                    {client.firstName} {client.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {client.email || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {client.phone || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {client.city || "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {client.createdAt
                      ? new Date(client.createdAt).toLocaleDateString()
                      : "\u2014"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">
            {search ? "Pemilik tidak ditemukan" : "Belum ada data pemilik"}
          </p>
          {!search && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/clients/new")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambahkan pemilik pertama
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
