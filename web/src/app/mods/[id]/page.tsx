import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FavoriteButton } from "@/components/ModActions";
import ReviewsSection from "@/components/ReviewsSection";
import InstallButton from "@/components/InstallButton";
import AddToListButton from "@/components/AddToListButton";

export default async function ModDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const mod = await prisma.mod.findUnique({
    where: { id: parseInt(id) },
    include: {
      game: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: true } },
      versions: {
        orderBy: { createdAt: "desc" },
        include: { files: true },
      },
      files: { where: { modVersionId: null } },
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!mod || !mod.isApproved) notFound();

  // Increment view count
  await prisma.mod.update({
    where: { id: mod.id },
    data: { viewCount: { increment: 1 } },
  });

  const allFiles = [
    ...mod.files,
    ...mod.versions.flatMap((v) => v.files),
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-[var(--muted)] mb-6">
        <Link href="/" className="hover:text-white">首页</Link>
        <span className="mx-2">/</span>
        <Link href="/games" className="hover:text-white">游戏</Link>
        <span className="mx-2">/</span>
        <Link href={`/games/${mod.game.slug}`} className="hover:text-white">
          {mod.game.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white">{mod.name}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold">{mod.name}</h1>
          <div className="flex items-center gap-2 shrink-0">
            <AddToListButton modId={mod.id} />
            <FavoriteButton modId={mod.id} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-[var(--muted)]">
          <span>作者: {mod.author || "未知"}</span>
          <span>版本: v{mod.version}</span>
          <span className="flex items-center gap-1">
            <span className="text-[var(--accent)]">&#9733;</span>
            {mod.rating.toFixed(1)} ({mod.ratingCount} 评价)
          </span>
          <span>{mod.downloadCount.toLocaleString()} 下载</span>
          <span>{mod.viewCount.toLocaleString()} 浏览</span>
        </div>
        {mod.category && (
          <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs bg-[var(--primary)]/10 text-[var(--primary)]">
            {mod.category.name}
          </span>
        )}
        {mod.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {mod.tags.map((t) => (
              <span
                key={t.tag.id}
                className="px-2 py-0.5 rounded text-xs bg-[var(--card)] border border-[var(--border)]"
              >
                {t.tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Local Install */}
      <div className="mb-6">
        <InstallButton modId={mod.id} modName={mod.name} gameSlug={mod.game.slug} />
      </div>

      {/* Description */}
      {mod.description && (
        <section className="mb-8 p-6 rounded-xl bg-[var(--card)] border border-[var(--border)]">
          <h2 className="text-lg font-semibold mb-4">描述</h2>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {mod.description}
          </div>
        </section>
      )}

      {/* Files */}
      {allFiles.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">文件</h2>
          <div className="space-y-2">
            {allFiles.map((file) => (
              <div
                key={file.id}
                className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium">{file.fileName}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <span className="px-3 py-1 rounded-lg text-xs bg-[var(--primary)]/20 text-[var(--primary)]">
                  {file.fileType === "archive" ? "压缩包" : file.fileType}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Versions */}
      {mod.versions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">版本历史</h2>
          <div className="space-y-2">
            {mod.versions.map((v) => (
              <div
                key={v.id}
                className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">v{v.version}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {v.createdAt.toLocaleDateString("zh-CN")}
                  </span>
                </div>
                {v.changelog && (
                  <p className="text-xs text-[var(--muted)] mt-2">{v.changelog}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <ReviewsSection modId={mod.id} />
    </div>
  );
}
