from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class ScrapedMod:
    source: str               # "nexus", "steam", "moddb"
    source_id: str            # 外部 ID
    name: str
    summary: str
    description: str = ""
    author: str = ""
    version: str = ""
    game_slug: str = ""       # 映射到系统的游戏 slug
    category: str = ""
    tags: list[str] = field(default_factory=list)
    download_url: str = ""
    file_name: str = ""
    file_size: int = 0
    thumbnail_url: str = ""
    download_count: int = 0
    rating: float = 0.0


class BaseScraper(ABC):
    """爬虫基类，所有平台爬虫继承此类"""

    def __init__(self):
        self.base_delay = 1.5  # 请求间隔（秒）

    @abstractmethod
    async def scrape_mod(self, url: str) -> Optional[ScrapedMod]:
        """爬取单个模组详情"""
        ...

    @abstractmethod
    async def scrape_game_list(self, game_slug: str, pages: int = 3) -> list[ScrapedMod]:
        """爬取某游戏的热门模组列表"""
        ...

    @abstractmethod
    async def search(self, query: str, game: str = "") -> list[ScrapedMod]:
        """搜索模组"""
        ...
