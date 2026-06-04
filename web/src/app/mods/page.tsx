import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ModsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    gameId?: string;
    categoryId?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const q = sp.q || "";
  const gameId = sp.gameId ? parseInt(sp.gameId) : undefined;
  const categoryId = sp.categoryId ? parseInt(sp.categoryId) : undefined;
  const sort = sp.sort || "downloads";
  const page = parseInt(sp.page || "1");
  const pageSize = 24;

  const where: Record<string, unknown> = { isApproved: true };
  if (gameId) where.gameId = gameId;
  if (categoryId) where.categoryId = categoryId;
  if (q) where.name = { contains: q };

  const orderBy: Record<string, string> =
    sort === "rating"
      ? { rating: "desc" }
      : sort === "updated"
        ? { updatedAt: "desc" }
        : sort === "name"
          ? { name: "asc" }
          : { downloadCount: "desc" };

  const [mods, total, games, categories] = await Promise.all([
    prisma.mod.findMany({
      where: where as any,
      include: {
        game: { select: { name: true, slug: true } },
        category: { select: { name: true, id: true } },
        tags: { include: { tag: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.mod.count({ where: where as any }),
    prisma.game.findMany({ orderBy: { name: "asc" } }),
    gameId
      ? prisma.category.findMany({
          where: { gameId },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const buildUrl = (params: Record<string, string | undefined>) => {
    const usp = new URLSearchParams();
    if (params.q || q) usp.set("q", params.q || q);
    if (params.gameId || gameId) usp.set("gameId", String(params.gameId || gameId));
    if (params.categoryId || categoryId) usp.set("categoryId", String(params.categoryId || categoryId));
    if (params.sort || sort) usp.set("sort", params.sort || sort);
    if (params.page) usp.set("page", params.page);
    return `/mods?${usp.toString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">浏览模组</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-56 shrink-0">
          <div className="space-y-6">
            {/* Game Filter */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--muted)] uppercase mb-3">游戏</h3>
              <div className="space-y-1">
                <Link
                  href={buildUrl({ gameId: undefined, categoryId: undefined, page: "1" })}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    !gameId ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "hover:bg-[var(--card)]"
                  }`}
                >
                  全部
                </Link>
                {games.map((g) => (
                  <Link
                    key={g.id}
                    href={`/mods?gameId=${g.id}`}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      gameId === g.id ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "hover:bg-[var(--card)]"
                    }`}
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--muted)] uppercase mb-3">分类</h3>
                <div className="space-y-1">
                  <Link
                    href={buildUrl({ categoryId: undefined, page: "1" })}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      !categoryId ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "hover:bg-[var(--card)]"
                    }`}
                  >
                    全部
                  </Link>
                  {categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/mods?gameId=${gameId}&categoryId=${c.id}`}
                      className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                        categoryId === c.id ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "hover:bg-[var(--card)]"
                      }`}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Sort */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--muted)] uppercase mb-3">排序</h3>
              <div className="space-y-1">
                {[
                  { key: "downloads", label: "下载量" },
                  { key: "rating", label: "评分" },
                  { key: "updated", label: "最近更新" },
                  { key: "name", label: "名称" },
                ].map((s) => (
                  <Link
                    key={s.key}
                    href={buildUrl({ sort: s.key, page: "1" })}
                    className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                      sort === s.key ? "bg-[var(--primary)]/20 text-[var(--primary)]" : "hover:bg-[var(--card)]"
                    }`}
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Search info */}
          {q && (
            <p className="text-sm text-[var(--muted)] mb-4">
              搜索 &ldquo;{q}&rdquo; 找到 {total} 个结果
            </p>
          )}

          {/* Mods Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {mods.map((mod) => (
              <Link
                key={mod.id}
                href={`/mods/${mod.id}`}
                className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] hover:border-[var(--primary)] transition-all group"
              >
                <h3 className="font-semibold group-hover:text-[var(--primary)] transition-colors line-clamp-1">
                  {mod.name}
                </h3>
                <p className="text-xs text-[var(--primary)] mt-1">{mod.game.name}</p>
                <p className="text-sm text-[var(--muted)] mt-2 line-clamp-2">
                  {mod.summary}
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-[var(--muted)]">
                  {mod.category && <span>{mod.category.name}</span>}
                  <span>v{mod.version}</span>
                  <span className="flex items-center gap-1">
                    <span className="text-[var(--accent)]">&#9733;</span>
                    {mod.rating.toFixed(1)}
                  </span>
                  <span>{mod.downloadCount.toLocaleString()} 下载</span>
                </div>
                {mod.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {mod.tags.map((t) => (
                      <span
                        key={t.tag.id}
                        className="px-2 py-0.5 rounded text-xs bg-[var(--primary)]/10 text-[var(--primary)]"
                      >
                        {t.tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>

          {mods.length === 0 && (
            <div className="text-center py-16 text-[var(--muted)]">
              {q ? `没有找到与 "${q}" 相关的模组` : "暂无模组"}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildUrl({ page: String(p) })}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    page === p
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]"
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
