import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const userId = parseInt(session.user.id);

  const [uploadedMods, favorites] = await Promise.all([
    prisma.mod.findMany({
      where: { uploaderId: userId },
      include: { game: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.favorite.findMany({
      where: { userId },
      include: {
        mod: {
          include: { game: { select: { name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">{session.user.name || "用户"}</h1>
      <p className="text-sm text-[var(--muted)] mb-8">{session.user.email}</p>

      {/* My Mods */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">我的发布 ({uploadedMods.length})</h2>
        {uploadedMods.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            还没有发布过模组，{" "}
            <Link href="/mods/new" className="text-[var(--primary)] hover:underline">去发布</Link>
          </p>
        ) : (
          <div className="space-y-3">
            {uploadedMods.map((mod) => (
              <Link
                key={mod.id}
                href={`/mods/${mod.id}`}
                className="block p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{mod.name}</h3>
                    <p className="text-xs text-[var(--muted)] mt-1">{mod.game.name}</p>
                  </div>
                  <div className="text-xs text-[var(--muted)] text-right">
                    <p>{mod.downloadCount.toLocaleString()} 下载</p>
                    <p>{mod.rating.toFixed(1)} ★</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Favorites */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4">我的收藏 ({favorites.length})</h2>
        {favorites.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">还没有收藏任何模组</p>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav) => (
              <Link
                key={fav.id}
                href={`/mods/${fav.mod.id}`}
                className="block p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--card-hover)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{fav.mod.name}</h3>
                    <p className="text-xs text-[var(--muted)] mt-1">{fav.mod.game.name}</p>
                  </div>
                  <span className="text-xs text-[var(--muted)]">
                    {new Date(fav.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
