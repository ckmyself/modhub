import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") || "";
  const gameId = searchParams.get("gameId");
  const categoryId = searchParams.get("categoryId");
  const tags = searchParams.get("tags");
  const sort = searchParams.get("sort") || "downloads";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "24");

  const where: Record<string, unknown> = {};

  if (gameId) where.gameId = parseInt(gameId);
  if (categoryId) where.categoryId = parseInt(categoryId);
  if (q) {
    where.name = { contains: q };
  }
  if (tags) {
    const tagNames = tags.split(",");
    where.tags = {
      some: {
        tag: {
          name: { in: tagNames },
        },
      },
    };
  }

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
        game: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        tags: { include: { tag: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.mod.count({ where: where as any }),
  ]);

  return Response.json({
    data: mods,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
