import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { NextRequest } from "next/server";

async function sendVerificationEmail(email: string, token: string) {
  const url = `http://localhost:3000/auth/verify?token=${token}`;
  const msg = `
======================================
  ModHub 邮箱验证
======================================

  您好！

  请点击以下链接验证您的邮箱地址：

  ${url}

  此链接有效期为 24 小时。

  如果您没有注册 ModHub，请忽略此邮件。

======================================
  ModHub - 游戏模组管理平台
======================================
`;

  // In development, log to console
  console.log(`\n📧 验证邮件已发送到: ${email}`);
  console.log(`📧 验证链接: ${url}\n`);
  console.log(msg);

  // Try to send via SMTP if configured
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || "587"),
        auth: { user, pass },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"ModHub" <${user}>`,
        to: email,
        subject: "ModHub - 验证您的邮箱",
        text: msg,
      });
      console.log(`  ✅ SMTP 发送成功`);
    } catch (err) {
      console.log(`  ⚠️  SMTP 发送失败: ${err}`);
    }
  } else {
    console.log(`  ℹ️  未配置 SMTP，请在 .env 中设置 SMTP_HOST/SMTP_USER/SMTP_PASS`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, password } = await request.json();

    if (!email || !password) {
      return Response.json(
        { error: "邮箱和密码为必填项" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return Response.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // 开发模式下自动验证，生产模式下发送验证邮件
    const isDev = !process.env.SMTP_HOST;

    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split("@")[0],
        passwordHash,
        emailVerified: isDev ? new Date() : null, // 开发模式自动验证
      },
    });

    if (isDev) {
      console.log(`  ✅ 开发模式：用户 ${email} 已自动验证`);
    } else {
      // 生产模式：发送验证邮件
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      try {
        await sendVerificationEmail(email, token);
      } catch (emailErr) {
        console.error("发送验证邮件失败:", emailErr);
      }
    }

    return Response.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        message: "注册成功！",
      },
    });
  } catch (e) {
    console.error("Registration error:", e);
    return Response.json({ error: "注册失败" }, { status: 500 });
  }
}
