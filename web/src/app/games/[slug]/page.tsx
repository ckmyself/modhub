import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function GameDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const game = await prisma.game.findUnique({
    where: { slug },
    include: {
      categories: { orderBy: { modCount: "desc" } },
    },
  });

  if (!game) notFound();

  const activeCategory = sp.category ? parseInt(sp.category) : undefined;
  const sort = sp.sort || "downloads";
  const page = parseInt(sp.page || "1");
  const pageSize = 12;

  const where: Record<string, unknown> = { gameId: game.id, isApproved: true };
  if (activeCategory) where.categoryId = activeCategory;

  const orderBy: Record<string, string> =
    sort === "rating"
      ? { rating: "desc" }
      : sort === "updated"
        ? { updatedAt: "desc" }
        : sort === "name"
          ? { name: "asc" }
          : { downloadCount: "desc" };

  const [mods, total] = await Promise.all([
    prisma.mod.findMany({
      where: where as any,
      include: {
        category: { select: { name: true } },
        tags: { include: { tag: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.mod.count({ where: where as any }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-[var(--muted)] mb-6">
        <Link href="/" className="hover:text-white">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/games" className="hover:text-white">游戏</Link>
        <span className="mx-2">/</span>
        <span className="text-white">{game.name}</span>
      </div>

      {/* Game Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{game.name}</h1>
        {game.developer && (
          <p className="text-[var(--muted)] mt-1">{game.developer}</p>
        )}
        {game.description && (
          <p className="text-[var(--muted)] mt-3 max-w-2xl">{game.description}</p>
        )}
        <p className="text-sm text-[var(--muted)] mt-2">{total} 个模组</p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={`/games/${slug}`}
          className={`px-4 py-2 rounded-lg text-sm transition-colors ${
            !activeCategory
              ? "bg-[var(--primary)] text-white"
              : "bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]"
          }`}
        >
          全部
        </Link>
        {game.categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/games/${slug}?category=${cat.id}`}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              activeCategory === cat.id
                ? "bg-[var(--primary)] text-white"
                : "bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)]"
            }`}
          >
            {cat.name} ({cat.modCount})
          </Link>
        ))}
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <span className="text-[var(--muted)]">排序:</span>
        {[
          { key: "downloads", label: "下载量" },
          { key: "rating", label: "评分" },
          { key: "updated", label: "最近更新" },
          { key: "name", label: "名称" },
        ].map((s) => (
          <Link
            key={s.key}
            href={`/games/${slug}?sort=${s.key}${activeCategory ? `&category=${activeCategory}` : ""}`}
            className={`px-3 py-1 rounded-md transition-colors ${
              sort === s.key
                ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Mods Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mods.map((mod) => (
          <Link
            key={mod.id}
            href={`/mods/${mod.id}`}
            className="p-5 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] hover:border-[var(--primary)] transition-all group"
          >
            <h3 className="font-semibold group-hover:text-[var(--primary)] transition-colors line-clamp-1">
              {mod.name}
            </h3>
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
          </Link>
        ))}
      </div>

      {mods.length === 0 && (
        <div className="text-center py-16 text-[var(--muted)]">
          该分类下暂无模组
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/games/${slug}?page=${p}${activeCategory ? `&category=${activeCategory}` : ""}${sort !== "downloads" ? `&sort=${sort}` : ""}`}
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
  );
}
