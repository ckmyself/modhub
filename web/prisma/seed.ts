import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // ===== 创建游戏 =====
  const games = [
    {
      slug: "elden-ring",
      name: "艾尔登法环",
      description: "由 FromSoftware 开发、万代南梦宫发行的黑暗奇幻动作角色扮演游戏。",
      developer: "FromSoftware",
      publisher: "万代南梦宫",
    },
    {
      slug: "stardew-valley",
      name: "星露谷物语",
      description: "由 ConcernedApe 开发的乡村模拟经营角色扮演游戏。",
      developer: "ConcernedApe",
      publisher: "ConcernedApe",
    },
    {
      slug: "minecraft",
      name: "Minecraft",
      description: "由 Mojang 开发的沙盒建造游戏，无限可能性。",
      developer: "Mojang",
      publisher: "Mojang",
    },
    {
      slug: "skyrim",
      name: "上古卷轴 V：天际",
      description: "由 Bethesda 开发的开放世界动作角色扮演游戏。",
      developer: "Bethesda",
      publisher: "Bethesda",
    },
    {
      slug: "baldurs-gate-3",
      name: "博德之门 3",
      description: "由 Larian Studios 开发的基于龙与地下城规则的回合制角色扮演游戏。",
      developer: "Larian Studios",
      publisher: "Larian Studios",
    },
    {
      slug: "cyberpunk-2077",
      name: "赛博朋克 2077",
      description: "由 CD Projekt Red 开发的开放世界动作冒险角色扮演游戏。",
      developer: "CD Projekt Red",
      publisher: "CD Projekt Red",
    },
    {
      slug: "oxygen-not-included",
      name: "缺氧",
      description: "由 Klei Entertainment 开发的太空殖民地模拟生存游戏。",
      developer: "Klei Entertainment",
      publisher: "Klei Entertainment",
    },
  ];

  for (const game of games) {
    await prisma.game.upsert({
      where: { slug: game.slug },
      update: {},
      create: game,
    });
  }
  console.log(`Created ${games.length} games`);

  // ===== 创建分类 =====
  const categoriesData: { gameSlug: string; name: string; slug: string }[] = [
    // 艾尔登法环
    { gameSlug: "elden-ring", name: "武器", slug: "weapons" },
    { gameSlug: "elden-ring", name: "盔甲", slug: "armor" },
    { gameSlug: "elden-ring", name: "魔法", slug: "magic" },
    { gameSlug: "elden-ring", name: "地图与难度", slug: "maps-difficulty" },
    { gameSlug: "elden-ring", name: "UI 改进", slug: "ui-improvements" },
    // 星露谷物语
    { gameSlug: "stardew-valley", name: "农场美化", slug: "farm-aesthetics" },
    { gameSlug: "stardew-valley", name: "角色外观", slug: "character-appearance" },
    { gameSlug: "stardew-valley", name: "功能增强", slug: "quality-of-life" },
    { gameSlug: "stardew-valley", name: "新内容", slug: "new-content" },
    // Minecraft
    { gameSlug: "minecraft", name: "科技", slug: "tech" },
    { gameSlug: "minecraft", name: "魔法", slug: "magic" },
    { gameSlug: "minecraft", name: "冒险", slug: "adventure" },
    { gameSlug: "minecraft", name: "农业", slug: "farming" },
    { gameSlug: "minecraft", name: "装饰", slug: "decoration" },
    // 天际
    { gameSlug: "skyrim", name: "任务", slug: "quests" },
    { gameSlug: "skyrim", name: "装备", slug: "equipment" },
    { gameSlug: "skyrim", name: "随从", slug: "followers" },
    { gameSlug: "skyrim", name: "房屋", slug: "housing" },
    { gameSlug: "skyrim", name: "画质增强", slug: "visuals" },
    // 博德之门 3
    { gameSlug: "baldurs-gate-3", name: "角色外观", slug: "character-appearance" },
    { gameSlug: "baldurs-gate-3", name: "装备", slug: "equipment" },
    { gameSlug: "baldurs-gate-3", name: "UI 改进", slug: "ui-improvements" },
    { gameSlug: "baldurs-gate-3", name: "游戏性", slug: "gameplay" },
    // 赛博朋克 2077
    { gameSlug: "cyberpunk-2077", name: "画质增强", slug: "visuals" },
    { gameSlug: "cyberpunk-2077", name: "车辆", slug: "vehicles" },
    { gameSlug: "cyberpunk-2077", name: "角色外观", slug: "character-appearance" },
    { gameSlug: "cyberpunk-2077", name: "功能增强", slug: "quality-of-life" },
    // 缺氧
    { gameSlug: "oxygen-not-included", name: "建筑", slug: "buildings" },
    { gameSlug: "oxygen-not-included", name: "植物与食物", slug: "plants-food" },
    { gameSlug: "oxygen-not-included", name: "UI 改进", slug: "ui-improvements" },
  ];

  for (const cat of categoriesData) {
    const game = await prisma.game.findUnique({ where: { slug: cat.gameSlug } });
    if (!game) continue;
    await prisma.category.upsert({
      where: { gameId_slug: { gameId: game.id, slug: cat.slug } },
      update: {},
      create: { gameId: game.id, name: cat.name, slug: cat.slug },
    });
  }
  console.log(`Created ${categoriesData.length} categories`);

  // ===== 创建标签 =====
  const tagNames = ["单人", "多人", "作弊", "画质改进", "性能优化", "新内容", "Bug 修复", "汉化", "工具", "大型模组"];
  for (const name of tagNames) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Created ${tagNames.length} tags`);

  // ===== 创建 Mod =====
  const modsData: {
    gameSlug: string;
    categorySlug: string;
    name: string;
    summary: string;
    author: string;
    version: string;
    rating: number;
    downloadCount: number;
    tags: string[];
    isApproved: boolean;
    description?: string;
  }[] = [
    // === 艾尔登法环 ===
    {
      gameSlug: "elden-ring",
      categorySlug: "weapons",
      name: "月光大剑增强",
      summary: "大幅增强月光大剑的伤害和施法效果，增加新的战技。",
      author: "ModMaster",
      version: "2.1.0",
      rating: 4.8,
      downloadCount: 45231,
      tags: ["单人", "新内容"],
      isApproved: true,
    },
    {
      gameSlug: "elden-ring",
      categorySlug: "maps-difficulty",
      name: "自定义难度调整",
      summary: "允许精细调整游戏难度参数，包括敌人伤害、血量、掉落率等。",
      author: "DifficultyTweaker",
      version: "1.4.2",
      rating: 4.5,
      downloadCount: 32890,
      tags: ["单人", "作弊"],
      isApproved: true,
    },
    {
      gameSlug: "elden-ring",
      categorySlug: "ui-improvements",
      name: "快捷地图标记",
      summary: "在地图上添加更多自定义标记选项，支持备注和分类管理。",
      author: "MapEnhancer",
      version: "1.0.5",
      rating: 4.3,
      downloadCount: 21567,
      tags: ["单人", "工具"],
      isApproved: true,
    },
    // === 星露谷物语 ===
    {
      gameSlug: "stardew-valley",
      categorySlug: "farm-aesthetics",
      name: "农场美化包",
      summary: "替换农场建筑和地面纹理，让你的农场焕然一新。",
      author: "FarmArtist",
      version: "3.0.1",
      rating: 4.9,
      downloadCount: 89234,
      tags: ["单人", "画质改进"],
      isApproved: true,
    },
    {
      gameSlug: "stardew-valley",
      categorySlug: "quality-of-life",
      name: "自动采集机",
      summary: "自动收获农作物、采集果树果实，节省大量时间。",
      author: "AutoCollectDev",
      version: "2.2.0",
      rating: 4.6,
      downloadCount: 67890,
      tags: ["单人", "工具"],
      isApproved: true,
    },
    {
      gameSlug: "stardew-valley",
      categorySlug: "new-content",
      name: "更多鱼类扩展",
      summary: "添加 50+ 种新鱼类，包括全新的钓鱼机制和收集品。",
      author: "FishMaster",
      version: "1.8.3",
      rating: 4.4,
      downloadCount: 45678,
      tags: ["单人", "新内容"],
      isApproved: true,
    },
    // === Minecraft ===
    {
      gameSlug: "minecraft",
      categorySlug: "tech",
      name: "通用机械",
      summary: "大型科技模组，添加了大量的机器、管道和自动化系统。",
      author: "TeamMekanism",
      version: "10.4.5",
      rating: 4.9,
      downloadCount: 345678,
      tags: ["单人", "多人", "大型模组"],
      isApproved: true,
    },
    {
      gameSlug: "minecraft",
      categorySlug: "magic",
      name: "神秘时代",
      summary: "深度魔法模组，探索六种神秘元素的力量。",
      author: "ThaumCraftTeam",
      version: "6.2.0",
      rating: 4.7,
      downloadCount: 234567,
      tags: ["单人", "多人", "大型模组"],
      isApproved: true,
    },
    {
      gameSlug: "minecraft",
      categorySlug: "adventure",
      name: "暮色森林",
      summary: "添加了一个充满魔法与冒险的全新维度世界。",
      author: "TwilightTeam",
      version: "4.3.2",
      rating: 4.8,
      downloadCount: 456789,
      tags: ["单人", "多人", "新内容"],
      isApproved: true,
    },
    // === 天际 ===
    {
      gameSlug: "skyrim",
      categorySlug: "visuals",
      name: "天际高清重制",
      summary: "全面的画质增强包，包含 4K 纹理、光照和天气系统改进。",
      author: "VisualMaster",
      version: "3.0",
      rating: 4.9,
      downloadCount: 567890,
      tags: ["单人", "画质改进", "大型模组"],
      isApproved: true,
    },
    {
      gameSlug: "skyrim",
      categorySlug: "quests",
      name: "龙裔艺术馆",
      summary: "添加了一座庞大的博物馆，可以展示游戏中的各种收藏品。",
      author: "LegacyTeam",
      version: "5.6.3",
      rating: 4.9,
      downloadCount: 345678,
      tags: ["单人", "大型模组", "新内容"],
      isApproved: true,
    },
    {
      gameSlug: "skyrim",
      categorySlug: "followers",
      name: "伊尼戈随从",
      summary: "功能丰富的独立随从，拥有完整的背景故事和对话。",
      author: "InigoDev",
      version: "2.4.1",
      rating: 5.0,
      downloadCount: 456789,
      tags: ["单人", "新内容"],
      isApproved: true,
    },
    // === 博德之门 3 ===
    {
      gameSlug: "baldurs-gate-3",
      categorySlug: "character-appearance",
      name: "起源角色美化",
      summary: "全面美化起源角色的外观，包括高清纹理和新的发型。",
      author: "BGCosmetics",
      version: "2.0.0",
      rating: 4.6,
      downloadCount: 123456,
      tags: ["单人", "画质改进"],
      isApproved: true,
    },
    {
      gameSlug: "baldurs-gate-3",
      categorySlug: "gameplay",
      name: "额外子职业",
      summary: "添加 25+ 个全新的子职业，扩展每个职业的玩法选择。",
      author: "ClassExpander",
      version: "1.5.0",
      rating: 4.7,
      downloadCount: 98765,
      tags: ["单人", "新内容"],
      isApproved: true,
    },
    {
      gameSlug: "baldurs-gate-3",
      categorySlug: "ui-improvements",
      name: "更好的交易界面",
      summary: "改进交易界面，显示物品总价值、排序选项和搜索功能。",
      author: "UITweaker",
      version: "1.2.1",
      rating: 4.3,
      downloadCount: 65432,
      tags: ["单人", "工具"],
      isApproved: true,
    },
    // === 赛博朋克 2077 ===
    {
      gameSlug: "cyberpunk-2077",
      categorySlug: "visuals",
      name: "夜之城画质增强",
      summary: "全面的画质增强，包括光线追踪改进、更好的阴影和反射。",
      author: "CyberVisuals",
      version: "2.0.5",
      rating: 4.8,
      downloadCount: 234567,
      tags: ["单人", "画质改进", "性能优化"],
      isApproved: true,
    },
    {
      gameSlug: "cyberpunk-2077",
      categorySlug: "vehicles",
      name: "更多载具",
      summary: "添加 30+ 辆新车，包括现实世界品牌授权的车型。",
      author: "VehicleAddict",
      version: "1.6.0",
      rating: 4.5,
      downloadCount: 145678,
      tags: ["单人", "新内容"],
      isApproved: true,
    },
    {
      gameSlug: "cyberpunk-2077",
      categorySlug: "quality-of-life",
      name: "更好的驾驶体验",
      summary: "改进驾驶物理和操控手感，增加第一人称驾驶视角优化。",
      author: "DrivingFix",
      version: "1.3.2",
      rating: 4.4,
      downloadCount: 112345,
      tags: ["单人", "Bug 修复", "性能优化"],
      isApproved: true,
    },
    // === 缺氧 ===
    {
      gameSlug: "oxygen-not-included",
      categorySlug: "buildings",
      name: "更多建筑包",
      summary: "添加 40+ 个新建筑，包括高级发电、物料处理和自动化设施。",
      author: "BuildingCreator",
      version: "2.3.1",
      rating: 4.7,
      downloadCount: 56789,
      tags: ["单人", "新内容"],
      isApproved: true,
    },
    {
      gameSlug: "oxygen-not-included",
      categorySlug: "ui-improvements",
      name: "信息显示增强",
      summary: "显示更多有用信息，如管道内容物、电力负荷预警等。",
      author: "InfoEnhancer",
      version: "1.8.0",
      rating: 4.6,
      downloadCount: 34567,
      tags: ["单人", "工具"],
      isApproved: true,
    },
  ];

  for (const modData of modsData) {
    const game = await prisma.game.findUnique({ where: { slug: modData.gameSlug } });
    if (!game) continue;

    const category = await prisma.category.findFirst({
      where: { gameId: game.id, slug: modData.categorySlug },
    });

    const mod = await prisma.mod.create({
      data: {
        gameId: game.id,
        categoryId: category?.id ?? null,
        name: modData.name,
        summary: modData.summary,
        description: `# ${modData.name}\n\n${modData.summary}\n\n这是由 **${modData.author}** 制作的优质模组。\n\n## 安装说明\n\n1. 下载模组文件\n2. 解压到游戏目录\n3. 在启动器中启用\n\n## 更新日志\n\n### v${modData.version}\n\n- 修复了已知问题\n- 性能优化`,
        author: modData.author,
        version: modData.version,
        rating: modData.rating,
        downloadCount: modData.downloadCount,
        isApproved: modData.isApproved,
      },
    });

    // 添加标签
    const allTags = await prisma.tag.findMany();
    for (const tagName of modData.tags) {
      const tag = allTags.find((t) => t.name === tagName);
      if (tag) {
        await prisma.modTag.create({
          data: { modId: mod.id, tagId: tag.id },
        });
      }
    }

    // 添加版本和文件
    await prisma.modVersion.create({
      data: {
        modId: mod.id,
        version: modData.version,
        changelog: "初始版本",
      },
    });

    await prisma.modFile.create({
      data: {
        modId: mod.id,
        fileName: `${modData.name.replace(/\s+/g, "_")}_v${modData.version}.zip`,
        fileSize: Math.floor(Math.random() * 50000000) + 5000000,
        fileType: "archive",
        isMain: true,
      },
    });
  }
  console.log(`Created ${modsData.length} mods`);

  // ===== 创建管理员用户 =====
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@modhub.local" },
    update: { passwordHash: adminPassword, role: "admin", name: "管理员" },
    create: {
      email: "admin@modhub.local",
      name: "管理员",
      role: "admin",
      passwordHash: adminPassword,
      emailVerified: new Date(),
    },
  });

  // 创建测试用户
  const testPassword = await bcrypt.hash("123456", 10);
  await prisma.user.upsert({
    where: { email: "test@test.com" },
    update: { passwordHash: testPassword, name: "测试用户" },
    create: {
      email: "test@test.com",
      name: "测试用户",
      passwordHash: testPassword,
      emailVerified: new Date(),
    },
  });

  // 更新游戏 mod 计数
  for (const game of games) {
    const count = await prisma.mod.count({
      where: { game: { slug: game.slug } },
    });
    await prisma.game.update({
      where: { slug: game.slug },
      data: { modCount: count },
    });
  }

  // 更新分类 mod 计数
  const allCategories = await prisma.category.findMany();
  for (const cat of allCategories) {
    const count = await prisma.mod.count({
      where: { categoryId: cat.id },
    });
    await prisma.category.update({
      where: { id: cat.id },
      data: { modCount: count },
    });
  }

  console.log("Seed data created successfully!");
  console.log(`Admin user: admin@modhub.local`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
