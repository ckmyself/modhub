import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return Response.json({ error: "缺少验证令牌" }, { status: 400 });
    }

    // Find valid token
    const vt = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!vt) {
      return Response.json({ error: "验证链接无效" }, { status: 400 });
    }

    if (vt.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { id: vt.id } });
      return Response.json({ error: "验证链接已过期，请重新注册" }, { status: 400 });
    }

    // Update user
    await prisma.user.update({
      where: { email: vt.identifier },
      data: { emailVerified: new Date() },
    });

    // Delete used token
    await prisma.verificationToken.delete({ where: { id: vt.id } });

    return Response.json({
      data: { message: "邮箱验证成功！现在可以登录了。" },
    });
  } catch (e) {
    console.error("Verification error:", e);
    return Response.json({ error: "验证失败" }, { status: 500 });
  }
}
