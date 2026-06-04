import { prisma } from "@/lib/prisma";
import { CategoryForm } from "./CategoryForm";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      game: { select: { name: true } },
      _count: { select: { mods: true } },
    },
    orderBy: [{ gameId: "asc" }, { modCount: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">分类管理</h1>
      </div>

      <div className="space-y-2 mb-8">
        {categories.map((cat) => (
          <div key={cat.id} className="p-3 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-between">
            <div>
              <span className="font-medium text-sm">{cat.name}</span>
              <span className="text-xs text-[var(--muted)] ml-2">{cat.game.name}</span>
            </div>
            <span className="text-xs text-[var(--muted)]">{cat._count.mods} 个模组</span>
          </div>
        ))}
      </div>

      <CategoryForm />
    </div>
  );
}
