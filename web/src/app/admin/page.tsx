import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [modCount, gameCount, userCount, pendingMods, categoryCount] = await Promise.all([
    prisma.mod.count(),
    prisma.game.count(),
    prisma.user.count(),
    prisma.mod.count({ where: { isApproved: false } }),
    prisma.category.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">管理概览</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">模组总数</p>
          <p className="text-3xl font-bold mt-1">{modCount}</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">游戏数</p>
          <p className="text-3xl font-bold mt-1">{gameCount}</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">用户数</p>
          <p className="text-3xl font-bold mt-1">{userCount}</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <p className="text-sm text-[var(--muted)]">待审核</p>
          <p className={`text-3xl font-bold mt-1 ${pendingMods > 0 ? "text-[var(--accent)]" : ""}`}>
            {pendingMods}
          </p>
        </div>
      </div>

      {pendingMods > 0 && (
        <div className="p-4 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/30">
          <p className="text-sm">
            有 <strong>{pendingMods}</strong> 个模组等待审核 →
            <a href="/admin/mods" className="text-[var(--primary)] hover:underline ml-1">去处理</a>
          </p>
        </div>
      )}
    </div>
  );
}
