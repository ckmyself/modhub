import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [games, recentMods] = await Promise.all([
    prisma.game.findMany({
      orderBy: { modCount: "desc" },
    }),
    prisma.mod.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        game: { select: { name: true, slug: true } },
        tags: { include: { tag: true } },
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="text-center py-16 mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent">
          ModHub
        </h1>
        <p className="text-xl text-[var(--muted)] mb-8 max-w-2xl mx-auto">
          发现、管理和分享你喜爱的游戏模组 — 一站式模组管理平台
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/games"
            className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition-colors"
          >
            浏览游戏
          </Link>
          <Link
            href="/mods"
            className="px-6 py-3 border border-[var(--border)] hover:border-[var(--primary)] text-white rounded-lg font-medium transition-colors"
          >
            浏览模组
          </Link>
        </div>
      </section>

      {/* Games Grid */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">支持的游戏</h2>
          <Link href="/games" className="text-sm text-[var(--primary)] hover:underline">
            查看全部 &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.slug}`}
              className="group p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] hover:border-[var(--primary)] transition-all"
            >
              <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/20 flex items-center justify-center mb-3 text-xl">
                {game.name.charAt(0)}
              </div>
              <h3 className="font-medium text-sm group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                {game.name}
              </h3>
              <p className="text-xs text-[var(--muted)] mt-1">
                {game.modCount} 个模组
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Mods */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">最新模组</h2>
          <Link href="/mods" className="text-sm text-[var(--primary)] hover:underline">
            查看全部 &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {recentMods.map((mod) => (
            <Link
              key={mod.id}
              href={`/mods/${mod.id}`}
              className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] hover:border-[var(--primary)] transition-all group"
            >
              <h3 className="font-medium group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                {mod.name}
              </h3>
              <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">
                {mod.summary}
              </p>
              <div className="flex items-center justify-between mt-3 text-xs text-[var(--muted)]">
                <span>{mod.game.name}</span>
                <span className="flex items-center gap-1">
                  <span className="text-[var(--accent)]">&#9733;</span>
                  {mod.rating.toFixed(1)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
