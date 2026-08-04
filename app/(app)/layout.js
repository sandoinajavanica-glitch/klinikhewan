import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Shell from "@/components/Shell";

export default async function ProtectedLayout({ children }) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <Shell session={session}>{children}</Shell>;
}
