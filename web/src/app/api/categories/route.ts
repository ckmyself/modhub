import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const gameId = searchParams.get("gameId");

  const where = gameId ? { gameId: parseInt(gameId) } : {};

  const categories = await prisma.category.findMany({
    where,
    include: {
      game: { select: { name: true, slug: true } },
    },
    orderBy: [{ gameId: "asc" }, { modCount: "desc" }],
  });

  return Response.json({ data: categories });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "未登录" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { role: true },
  });
  if (user?.role !== "admin") return Response.json({ error: "需要管理员权限" }, { status: 403 });

  const { gameId, name } = await request.json();
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const category = await prisma.category.create({
    data: { gameId, name, slug },
  });
  return Response.json({ data: category });
}
