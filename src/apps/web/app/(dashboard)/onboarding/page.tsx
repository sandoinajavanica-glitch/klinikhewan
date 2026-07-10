"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Check,
  Building2,
  Users,
  Database,
  Rocket,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: Building2,
    title: "Konfirmasi detail klinik kamu",
    body: "Atur nama klinik, negara, mata uang, tarif pajak, dan zona waktu.",
    href: "/settings?tab=practice",
    cta: "Buka pengaturan klinik",
  },
  {
    icon: Users,
    title: "Undang tim kamu",
    body: "Tambahkan dokter hewan, paramedis, dan staf administrasi agar semua dapat masuk.",
    href: "/settings?tab=staff",
    cta: "Kelola staf",
  },
  {
    icon: Database,
    title: "Masukkan data kamu",
    body: "Impor klien dan pasien dari sistem kamu saat ini, atau mulai dari awal.",
    href: "/settings?tab=data",
    cta: "Impor data",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const status = trpc.settings.onboardingStatus.useQuery(undefined, {
    retry: false,
  });

  const clearDemo = trpc.settings.clearDemoData.useMutation({
    onSuccess: () => {
      utils.settings.onboardingStatus.invalidate();
      toast.success("Data demo berhasil dihapus");
    },
    onError: (e) => toast.error(e.message),
  });
  const complete = trpc.settings.completeOnboarding.useMutation({
    onSuccess: () => {
      toast.success("Semuanya sudah siap!");
      router.push("/");
      router.refresh();
    },
    onError: (e) => toast.error(e.message),
  });

  if (status.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <Rocket className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 font-heading text-2xl font-bold">
          Selamat datang di DraftKlinik
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Beberapa langkah cepat untuk menjalankan klinik kamu.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {STEPS.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.title}
              className="flex items-start gap-4 rounded-lg border border-border bg-card p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
              <Link href={s.href}>
                <Button variant="outline" size="sm">
                  {s.cta}
                </Button>
              </Link>
            </div>
          );
        })}
      </div>

      {status.data?.hasDemoData && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-border bg-muted/30 p-5">
          <div>
            <h3 className="font-medium">Hapus data demo</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Hapus data sampel klien, pasien, dan reservasi saat kamu siap
              menggunakan data asli.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={clearDemo.isPending}
            onClick={() => clearDemo.mutate()}
          >
            {clearDemo.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Hapus data demo
          </Button>
        </div>
      )}

      <div className="mt-8 flex justify-end gap-3">
        <Link href="/">
          <Button variant="ghost">Lewati untuk saat ini</Button>
        </Link>
        <Button disabled={complete.isPending} onClick={() => complete.mutate()}>
          {complete.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          Selesaikan pengaturan
        </Button>
      </div>
    </div>
  );
}
