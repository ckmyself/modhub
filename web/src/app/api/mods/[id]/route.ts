import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

async function refreshCounts(mod: { gameId: number; categoryId: number | null }) {
  const gameCount = await prisma.mod.count({ where: { gameId: mod.gameId, isApproved: true } });
  await prisma.game.update({ where: { id: mod.gameId }, data: { modCount: gameCount } });
  if (mod.categoryId) {
    const catCount = await prisma.mod.count({ where: { categoryId: mod.categoryId, isApproved: true } });
    await prisma.category.update({ where: { id: mod.categoryId }, data: { modCount: catCount } });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  if (!mod) {
    return Response.json({ error: "Mod not found" }, { status: 404 });
  }

  await prisma.mod.update({
    where: { id: mod.id },
    data: { viewCount: { increment: 1 } },
  });

  return Response.json({ data: { ...mod, viewCount: mod.viewCount + 1 } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { role: true },
  });
  if (user?.role !== "admin") {
    return Response.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const { id } = await params;
  const data = await request.json();

  const mod = await prisma.mod.update({
    where: { id: parseInt(id) },
    data,
  });

  await refreshCounts(mod);

  return Response.json({ data: mod });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { role: true },
  });
  if (user?.role !== "admin") {
    return Response.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const { id } = await params;

  // Get mod info before deleting for count refresh
  const mod = await prisma.mod.findUnique({
    where: { id: parseInt(id) },
    select: { gameId: true, categoryId: true },
  });

  await prisma.mod.delete({ where: { id: parseInt(id) } });

  if (mod) await refreshCounts(mod);

  return Response.json({ data: { deleted: true } });
}
