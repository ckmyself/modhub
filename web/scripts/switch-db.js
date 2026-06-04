/**
 * 数据库切换脚本
 * DATABASE_PROVIDER=postgres → 使用 schema.postgres.prisma
 * 其他值 → 使用 schema.sqlite.prisma
 */
const fs = require("fs");
const path = require("path");

const provider = process.env.DATABASE_PROVIDER || "sqlite";
const prismaDir = path.join(__dirname, "..", "prisma");
const schemaFile = path.join(prismaDir, "schema.prisma");
const sqliteFile = path.join(prismaDir, "schema.sqlite.prisma");
const postgresFile = path.join(prismaDir, "schema.postgres.prisma");

if (provider === "postgres") {
  if (!fs.existsSync(postgresFile)) {
    console.error("❌ schema.postgres.prisma 不存在");
    process.exit(1);
  }
  fs.copyFileSync(postgresFile, schemaFile);
  console.log("✅ 已切换到 PostgreSQL");
} else {
  if (!fs.existsSync(sqliteFile)) {
    // 首次备份当前 schema
    fs.copyFileSync(schemaFile, sqliteFile);
    console.log("✅ 已备份当前 schema 为 schema.sqlite.prisma");
  } else {
    fs.copyFileSync(sqliteFile, schemaFile);
    console.log("✅ 已切换到 SQLite");
  }
}
