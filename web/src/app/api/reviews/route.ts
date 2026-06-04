import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

// GET /api/reviews?modId=1
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const modId = parseInt(searchParams.get("modId") || "");

  if (!modId) {
    return Response.json({ error: "Missing modId" }, { status: 400 });
  }

  const reviews = await prisma.review.findMany({
    where: { modId },
    include: {
      user: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ data: reviews });
}

// POST /api/reviews
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  const { modId, rating, content } = await request.json();

  if (!modId) {
    return Response.json({ error: "Missing modId" }, { status: 400 });
  }

  const userId = parseInt(session.user.id);

  // Upsert review (one review per user per mod)
  const review = await prisma.review.upsert({
    where: {
      modId_userId: { modId, userId },
    },
    update: { rating, content },
    create: { modId, userId, rating, content },
  });

  // Update mod rating stats
  const stats = await prisma.review.aggregate({
    where: { modId },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.mod.update({
    where: { id: modId },
    data: {
      rating: stats._avg.rating || 0,
      ratingCount: stats._count,
    },
  });

  return Response.json({ data: review });
}
