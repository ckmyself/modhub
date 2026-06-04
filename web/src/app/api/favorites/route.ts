import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

// GET /api/favorites
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    include: {
      mod: {
        include: {
          game: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: favorites });
}

// POST /api/favorites - Toggle favorite
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { modId } = await request.json();
  const userId = parseInt(session.user.id);

  const existing = await prisma.favorite.findUnique({
    where: { userId_modId: { userId, modId } },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { id: existing.id },
    });
    return Response.json({ data: { favorited: false } });
  }

  await prisma.favorite.create({
    data: { userId, modId },
  });

  return Response.json({ data: { favorited: true } });
}
