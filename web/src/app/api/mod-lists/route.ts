import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

// GET /api/mod-lists?public=true
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const isPublic = searchParams.get("public") === "true";

  const where: Record<string, unknown> = {};
  if (isPublic) where.isPublic = true;

  // If not requesting public lists, require auth
  if (!isPublic) {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "请先登录" }, { status: 401 });
    }
    where.userId = parseInt(session.user.id);
  }

  const lists = await prisma.modList.findMany({
    where: where as any,
    include: {
      user: { select: { name: true } },
      _count: { select: { entries: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return Response.json({ data: lists });
}

// POST /api/mod-lists - Create mod list
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { name, summary, isPublic, modIds } = await request.json();
  if (!name) {
    return Response.json({ error: "名称为必填项" }, { status: 400 });
  }

  const list = await prisma.modList.create({
    data: {
      userId: parseInt(session.user.id),
      name,
      summary: summary || "",
      isPublic: isPublic || false,
      entries: modIds?.length
        ? { create: modIds.map((modId: number) => ({ modId })) }
        : undefined,
    },
    include: { _count: { select: { entries: true } } },
  });

  return Response.json({ data: list });
}
