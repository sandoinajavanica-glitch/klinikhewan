import { getSession } from "@/lib/auth";
import PengaturanTabs from "@/components/PengaturanTabs";

export default async function PengaturanPage() {
  const session = await getSession();
  if (session.role !== "Admin") {
    return <div className="empty-state">Hanya Admin yang dapat mengakses halaman Pengaturan.</div>;
  }
  return <PengaturanTabs isDemo={!!session.isDemo} />;
}
