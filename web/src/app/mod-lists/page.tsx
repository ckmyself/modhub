import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function ModListsPage() {
  const session = await auth();

  const [publicLists, userLists] = await Promise.all([
    prisma.modList.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { name: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    session?.user?.id
      ? prisma.modList.findMany({
          where: { userId: parseInt(session.user.id) },
          include: { _count: { select: { entries: true } } },
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Mod 合集</h1>
        {session && (
          <Link
            href="/mod-lists/new"
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg text-sm transition-colors"
          >
            创建合集
          </Link>
        )}
      </div>

      {/* User's Lists */}
      {userLists.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4">我的合集</h2>
          <div className="space-y-3">
            {userLists.map((list) => (
              <Link
                key={list.id}
                href={`/mod-lists/${list.id}`}
                className="block p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{list.name}</h3>
                    {list.summary && (
                      <p className="text-sm text-[var(--muted)] mt-1">{list.summary}</p>
                    )}
                  </div>
                  <div className="text-xs text-[var(--muted)] text-right">
                    <p>{list._count.entries} 个模组</p>
                    {list.isPublic ? (
                      <span className="text-green-400">公开</span>
                    ) : (
                      <span>私密</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Public Lists */}
      <section>
        <h2 className="text-lg font-semibold mb-4">公开合集</h2>
        {publicLists.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">暂无公开合集</p>
        ) : (
          <div className="space-y-3">
            {publicLists.map((list) => (
              <Link
                key={list.id}
                href={`/mod-lists/${list.id}`}
                className="block p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{list.name}</h3>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      {list.user.name || "匿名用户"} · {list._count.entries} 个模组
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
