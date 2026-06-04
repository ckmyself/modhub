import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// GET /api/mod-lists/:id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const list = await prisma.modList.findUnique({
    where: { id: parseInt(id) },
    include: {
      user: { select: { name: true } },
      entries: {
        include: {
          mod: {
            include: {
              game: { select: { name: true, slug: true } },
            },
          },
        },
      },
    },
  });

  if (!list) {
    return Response.json({ error: "Mod list not found" }, { status: 404 });
  }

  return Response.json({ data: list });
}

// PATCH /api/mod-lists/:id - Update mod list
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, summary, isPublic } = await request.json();

  const list = await prisma.modList.update({
    where: { id: parseInt(id) },
    data: {
      ...(name !== undefined && { name }),
      ...(summary !== undefined && { summary }),
      ...(isPublic !== undefined && { isPublic }),
    },
  });

  return Response.json({ data: list });
}

// DELETE /api/mod-lists/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.modList.delete({
    where: { id: parseInt(id) },
  });
  return Response.json({ data: { deleted: true } });
}
