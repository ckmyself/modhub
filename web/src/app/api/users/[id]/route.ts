import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "未登录" }, { status: 401 });

  const admin = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: { role: true },
  });
  if (admin?.role !== "admin") return Response.json({ error: "需要管理员权限" }, { status: 403 });

  const { id } = await params;
  const data = await request.json();

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    select: { id: true, email: true, name: true, role: true },
    data,
  });

  return Response.json({ data: user });
}
