import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET() {
  const games = await prisma.game.findMany({
    orderBy: { modCount: "desc" },
  });
  return Response.json({ data: games });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "未登录" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { role: true },
  });
  if (user?.role !== "admin") return Response.json({ error: "需要管理员权限" }, { status: 403 });

  const { slug, name, developer } = await request.json();
  const game = await prisma.game.create({
    data: { slug, name, developer: developer || null },
  });
  return Response.json({ data: game });
}
