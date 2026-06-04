import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  if (!email) {
    return Response.json({ error: "Missing email" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { emailVerified: true },
  });

  if (!user) {
    return Response.json({ data: null });
  }

  return Response.json({
    data: {
      verified: user.emailVerified !== null,
    },
  });
}
