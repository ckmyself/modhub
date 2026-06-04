const fs = require("fs");
const path = require("path");

// Read .env file manually if present
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, "$1");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

const provider = process.env.DATABASE_PROVIDER || "sqlite";
const prismaDir = path.join(__dirname, "..", "prisma");
const schemaFile = path.join(prismaDir, "schema.prisma");
const sqliteFile = path.join(prismaDir, "schema.sqlite.prisma");
const postgresFile = path.join(prismaDir, "schema.postgres.prisma");

if (provider === "postgres") {
  fs.copyFileSync(postgresFile, schemaFile);
  console.log("✅ 已切换到 PostgreSQL");
} else {
  if (!fs.existsSync(sqliteFile)) {
    fs.copyFileSync(schemaFile, sqliteFile);
    console.log("✅ 已备份当前 schema 为 schema.sqlite.prisma");
  } else {
    fs.copyFileSync(sqliteFile, schemaFile);
    console.log("✅ 已切换到 SQLite");
  }
}
