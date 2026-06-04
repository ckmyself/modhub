import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

// POST /api/mod-lists/:id/entries - Add mod to list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const { modId } = await request.json();

  const entry = await prisma.modListEntry.create({
    data: {
      modListId: parseInt(id),
      modId,
    },
  });

  return Response.json({ data: entry });
}

// DELETE /api/mod-lists/:id/entries - Remove mod from list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  const { modId } = await request.json();

  await prisma.modListEntry.delete({
    where: {
      modListId_modId: { modListId: parseInt(id), modId },
    },
  });

  return Response.json({ data: { deleted: true } });
}
