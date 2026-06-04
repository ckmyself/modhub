import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { role: true },
  });

  if (user?.role !== "admin") redirect("/");

  return (
    <div className="flex">
      <aside className="w-56 shrink-0 min-h-[calc(100vh-4rem)] border-r border-[var(--border)] p-4 hidden md:block">
        <div className="text-xs font-semibold text-[var(--muted)] uppercase mb-4">管理面板</div>
        <nav className="space-y-1">
          <Link href="/admin" className="block px-3 py-2 rounded-lg text-sm hover:bg-[var(--card)] transition-colors">
            📊 概览
          </Link>
          <Link href="/admin/mods" className="block px-3 py-2 rounded-lg text-sm hover:bg-[var(--card)] transition-colors">
            📦 模组管理
          </Link>
          <Link href="/admin/games" className="block px-3 py-2 rounded-lg text-sm hover:bg-[var(--card)] transition-colors">
            🎮 游戏管理
          </Link>
          <Link href="/admin/categories" className="block px-3 py-2 rounded-lg text-sm hover:bg-[var(--card)] transition-colors">
            🏷️ 分类管理
          </Link>
          <Link href="/admin/users" className="block px-3 py-2 rounded-lg text-sm hover:bg-[var(--card)] transition-colors">
            👥 用户管理
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
