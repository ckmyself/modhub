import sqlite3
from typing import Optional

from scrapers.base import ScrapedMod


# 游戏 slug 映射：nexus 游戏名 → 本地 game slug
GAME_SLUG_MAP = {
    "eldenring": "elden-ring",
    "skyrimspecialedition": "skyrim",
    "stardewvalley": "stardew-valley",
    "cyberpunk2077": "cyberpunk-2077",
    "baldursgate3": "baldurs-gate-3",
    "minecraft": "minecraft",
    "oxygennotincluded": "oxygen-not-included",
}


class ModStorage:
    """将爬取的数据写入 SQLite 数据库"""

    def __init__(self, db_path: str):
        self.db_path = db_path

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def get_or_create_game(self, game_slug: str) -> Optional[int]:
        """根据 slug 查找或创建游戏，返回 game.id"""
        conn = self._connect()
        cursor = conn.cursor()

        cursor.execute("SELECT id FROM Game WHERE slug = ?", (game_slug,))
        row = cursor.fetchone()
        if row:
            conn.close()
            return row["id"]

        # 创建新游戏（占位）
        name = game_slug.replace("-", " ").title()
        cursor.execute(
            "INSERT INTO Game (slug, name) VALUES (?, ?)",
            (game_slug, name),
        )
        conn.commit()
        game_id = cursor.lastrowid
        conn.close()
        return game_id

    def get_or_create_category(self, game_id: int, name: str) -> Optional[int]:
        """查找或创建分类"""
        if not name:
            return None

        conn = self._connect()
        cursor = conn.cursor()
        slug = name.lower().replace(" ", "-")

        cursor.execute(
            "SELECT id FROM Category WHERE gameId = ? AND slug = ?",
            (game_id, slug),
        )
        row = cursor.fetchone()
        if row:
            conn.close()
            return row["id"]

        cursor.execute(
            "INSERT INTO Category (gameId, name, slug) VALUES (?, ?, ?)",
            (game_id, name, slug),
        )
        conn.commit()
        cat_id = cursor.lastrowid
        conn.close()
        return cat_id

    def save_mod(self, mod: ScrapedMod) -> Optional[int]:
        """保存或更新模组，返回 mod.id"""
        game_slug = GAME_SLUG_MAP.get(mod.game_slug) or mod.game_slug
        game_id = self.get_or_create_game(game_slug)
        if not game_id:
            print(f"    [ERR] 无法获取游戏: {game_slug}")
            return None

        category_id = self.get_or_create_category(game_id, mod.category)

        conn = self._connect()
        cursor = conn.cursor()

        # 检查是否已存在（按 source + source_id）
        cursor.execute(
            "SELECT id FROM Mod WHERE source = ? AND sourceUrl LIKE ?",
            (mod.source, f"%{mod.source_id}%"),
        )
        existing = cursor.fetchone()

        if existing:
            # 更新
            cursor.execute(
                """UPDATE Mod SET
                    name=?, summary=?, description=?, author=?, version=?,
                    downloadCount=?, rating=?, thumbnailUrl=?, categoryId=?
                WHERE id=?""",
                (
                    mod.name, mod.summary, mod.description, mod.author, mod.version,
                    mod.download_count, mod.rating, mod.thumbnail_url, category_id,
                    existing["id"],
                ),
            )
            mod_id = existing["id"]
        else:
            # 插入
            cursor.execute(
                """INSERT INTO Mod
                    (gameId, categoryId, name, summary, description, author, version,
                     downloadCount, rating, thumbnailUrl, sourceUrl, source, isApproved)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)""",
                (
                    game_id, category_id, mod.name, mod.summary, mod.description,
                    mod.author, mod.version, mod.download_count, mod.rating,
                    mod.thumbnail_url, f"https://www.nexusmods.com/mods/{mod.source_id}",
                    mod.source,
                ),
            )
            mod_id = cursor.lastrowid

        conn.commit()
        conn.close()
        return mod_id
