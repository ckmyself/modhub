import { prisma } from "@/lib/prisma";
import { SetRoleButton } from "./SetRoleButton";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    include: {
      _count: { select: { reviews: true, favorites: true, uploadedMods: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">用户管理</h1>

      <div className="space-y-2">
        {users.map((user) => (
          <div key={user.id} className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{user.name || "未设置"}</p>
              <p className="text-xs text-[var(--muted)]">{user.email}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                发布: {user._count.uploadedMods} · 评价: {user._count.reviews} · 收藏: {user._count.favorites}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${user.role === "admin" ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "bg-[var(--card)] border border-[var(--border)]"}`}>
                {user.role === "admin" ? "管理员" : "用户"}
              </span>
              <SetRoleButton userId={user.id} currentRole={user.role} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
