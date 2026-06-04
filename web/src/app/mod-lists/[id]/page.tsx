import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function ModListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const list = await prisma.modList.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: { select: { name: true } },
      entries: {
        include: {
          mod: {
            include: {
              game: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  });

  if (!list) notFound();

  const isOwner = session?.user?.id && list.userId === parseInt(session.user.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-[var(--muted)] mb-6">
        <Link href="/" className="hover:text-white">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/mod-lists" className="hover:text-white">合集</Link>
        <span className="mx-2">/</span>
        <span className="text-white">{list.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{list.name}</h1>
        {list.summary && (
          <p className="text-[var(--muted)] mt-2">{list.summary}</p>
        )}
        <div className="flex items-center gap-3 mt-3 text-sm text-[var(--muted)]">
          <span>创建者: {list.user.name || "匿名用户"}</span>
          <span>{list.entries.length} 个模组</span>
          {list.isPublic && <span className="text-green-400">公开</span>}
        </div>
      </div>

      {/* Mod List */}
      <div className="space-y-3">
        {list.entries.map((entry, index) => (
          <Link
            key={entry.modId}
            href={`/mods/${entry.mod.id}`}
            className="block p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[var(--muted)] w-6">#{index + 1}</span>
                <div>
                  <h3 className="font-medium">{entry.mod.name}</h3>
                  <p className="text-xs text-[var(--muted)] mt-1">{entry.mod.game.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                <span>⭐ {entry.mod.rating.toFixed(1)}</span>
                <span>{entry.mod.downloadCount.toLocaleString()} 下载</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {list.entries.length === 0 && (
        <p className="text-center py-12 text-[var(--muted)]">
          合集为空
          {isOwner && " — 浏览模组时点击「添加到合集」来填充内容"}
        </p>
      )}
    </div>
  );
}
