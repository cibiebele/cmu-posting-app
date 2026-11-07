import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  console.log("DashboardLayout user:", user);
  if (!user) redirect("/login");
  if (!["admin", "super_admin"].includes(user.role)) redirect("/login");
  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-slate-950 text-white md:w-64 p-5 md:min-h-screen">
        <div className="font-bold text-lg">Crowd Management Unit</div>
        <p className="text-xs text-slate-400 mt-1">Management & Deployment</p>
        <nav className="mt-9 grid gap-2 text-sm">
          <Link
            className="rounded-lg px-3 py-2 hover:bg-slate-800"
            href="/dashboard"
          >
            Overview
          </Link>
          <Link
            className="rounded-lg px-3 py-2 hover:bg-slate-800"
            href="/dashboard/members"
          >
            Members
          </Link>
          <Link
            className="rounded-lg px-3 py-2 hover:bg-slate-800"
            href="/dashboard/branches"
          >
            Branches
          </Link>
          <Link
            className="rounded-lg px-3 py-2 hover:bg-slate-800"
            href="/dashboard/areas-locations"
          >
            Areas & Locations
          </Link>
        </nav>
        <div className="mt-10 border-t border-slate-800 pt-4">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-slate-400 capitalize">
            {user.role.replaceAll("_", " ")}
          </p>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-5 md:p-9 max-w-7xl">{children}</main>
    </div>
  );
}
