import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

async function updateGameModCount(gameId: number) {
  const count = await prisma.mod.count({ where: { gameId, isApproved: true } });
  await prisma.game.update({ where: { id: gameId }, data: { modCount: count } });
}

async function updateCategoryModCount(categoryId: number | null) {
  if (!categoryId) return;
  const count = await prisma.mod.count({ where: { categoryId, isApproved: true } });
  await prisma.category.update({ where: { id: categoryId }, data: { modCount: count } });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const summary = formData.get("summary") as string;
    const description = formData.get("description") as string || "";
    const gameId = parseInt(formData.get("gameId") as string);
    const categoryId = formData.get("categoryId") ? parseInt(formData.get("categoryId") as string) : null;
    const version = formData.get("version") as string || "1.0.0";
    const file = formData.get("file") as File | null;

    if (!name || !summary || !gameId) {
      return Response.json({ error: "名称、简介和游戏为必填项" }, { status: 400 });
    }

    const mod = await prisma.mod.create({
      data: {
        gameId,
        categoryId,
        name,
        summary,
        description,
        version,
        author: session.user.name || "未知",
        uploaderId: parseInt(session.user.id),
        isApproved: false,
      },
    });

    await updateGameModCount(gameId);
    if (categoryId) await updateCategoryModCount(categoryId);

    // Add version
    await prisma.modVersion.create({
      data: {
        modId: mod.id,
        version,
        changelog: "初始发布",
      },
    });

    // Add file if provided
    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const uploadsDir = "public/uploads";

      // Ensure uploads dir exists
      const fs = await import("fs/promises");
      try { await fs.mkdir(uploadsDir, { recursive: true }); } catch {}

      const fileName = `${mod.id}_${file.name}`;
      const filePath = `${uploadsDir}/${fileName}`;
      await fs.writeFile(filePath, buffer);

      await prisma.modFile.create({
        data: {
          modId: mod.id,
          fileName: file.name,
          fileSize: file.size,
          localPath: filePath,
          fileType: "archive",
          isMain: true,
        },
      });
    }

    return Response.json({ data: mod });
  } catch (e) {
    console.error("Upload error:", e);
    return Response.json({ error: "上传失败" }, { status: 500 });
  }
}
