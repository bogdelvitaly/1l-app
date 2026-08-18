import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { Sidebar, MobileNav } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)] md:flex-row">
      <Sidebar logoutAction={logout} />
      <MobileNav logoutAction={logout} />
      <main className="h-full min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
