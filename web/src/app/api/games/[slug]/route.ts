import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const game = await prisma.game.findUnique({
    where: { slug },
    include: {
      categories: {
        orderBy: { modCount: "desc" },
      },
    },
  });

  if (!game) {
    return Response.json({ error: "Game not found" }, { status: 404 });
  }

  return Response.json({ data: game });
}
