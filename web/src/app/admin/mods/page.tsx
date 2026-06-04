import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ApproveButton, DeleteButton } from "./AdminActions";

export default async function AdminModsPage({
  searchParams,
}: {
  searchParams: Promise<{ pending?: string }>;
}) {
  const sp = await searchParams;
  const showPending = sp.pending === "1";

  const where = showPending ? { isApproved: false } : {};
  const mods = await prisma.mod.findMany({
    where,
    include: {
      game: { select: { name: true } },
      uploader: { select: { name: true, email: true } },
      _count: { select: { reviews: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">模组管理</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href="/admin/mods"
            className={`px-3 py-1.5 rounded-lg transition-colors ${!showPending ? "bg-[var(--primary)] text-white" : "bg-[var(--card)] border border-[var(--border)]"}`}
          >
            全部
          </Link>
          <Link
            href="/admin/mods?pending=1"
            className={`px-3 py-1.5 rounded-lg transition-colors ${showPending ? "bg-[var(--primary)] text-white" : "bg-[var(--card)] border border-[var(--border)]"}`}
          >
            待审核
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        {mods.map((mod) => (
          <div key={mod.id} className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-between">
            <div className="min-w-0">
              <Link href={`/mods/${mod.id}`} className="font-medium text-sm hover:text-[var(--primary)]">
                {mod.name}
              </Link>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {mod.game.name} · 作者: {mod.author || mod.uploader?.name || "未知"} · 下载: {mod.downloadCount} · 评价: {mod._count.reviews}
                {!mod.isApproved && <span className="text-[var(--accent)] ml-2">待审核</span>}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!mod.isApproved && <ApproveButton modId={mod.id} />}
              <DeleteButton modId={mod.id} modName={mod.name} />
            </div>
          </div>
        ))}
        {mods.length === 0 && <p className="text-sm text-[var(--muted)] py-8 text-center">暂无模组</p>}
      </div>
    </div>
  );
}
