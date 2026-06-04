import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const games = await prisma.game.findMany({
    orderBy: { modCount: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">支持的游戏</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.slug}`}
            className="p-6 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] hover:border-[var(--primary)] transition-all group"
          >
            <div className="w-14 h-14 rounded-xl bg-[var(--primary)]/20 flex items-center justify-center mb-4 text-2xl font-bold text-[var(--primary)]">
              {game.name.charAt(0)}
            </div>
            <h2 className="text-lg font-semibold group-hover:text-[var(--primary)] transition-colors">
              {game.name}
            </h2>
            {game.developer && (
              <p className="text-sm text-[var(--muted)] mt-1">{game.developer}</p>
            )}
            <p className="text-xs text-[var(--muted)] mt-3">
              {game.modCount} 个模组
            </p>
            {game.description && (
              <p className="text-sm text-[var(--muted)] mt-2 line-clamp-2">
                {game.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
