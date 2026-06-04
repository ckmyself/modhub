import { prisma } from "@/lib/prisma";
import { GameForm } from "./GameForm";

export default async function AdminGamesPage() {
  const games = await prisma.game.findMany({
    include: { _count: { select: { mods: true, categories: true } } },
    orderBy: { modCount: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">游戏管理</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {games.map((game) => (
          <div key={game.id} className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <h3 className="font-medium">{game.name}</h3>
            <p className="text-xs text-[var(--muted)] mt-1">
              {game._count.mods} 个模组 · {game._count.categories} 个分类
              {game.developer && ` · ${game.developer}`}
            </p>
          </div>
        ))}
      </div>

      <GameForm />
    </div>
  );
}
