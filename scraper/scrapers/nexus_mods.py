import asyncio
import random
import re
from typing import Optional
from urllib.parse import quote

from playwright.async_api import async_playwright, Page
from bs4 import BeautifulSoup

from .base import BaseScraper, ScrapedMod


NEXUS_GAME_MAP = {
    "elden-ring": "eldenring",
    "skyrim": "skyrimspecialedition",
    "stardew-valley": "stardewvalley",
    "cyberpunk-2077": "cyberpunk2077",
    "baldurs-gate-3": "baldursgate3",
    "minecraft": "minecraft",
    "oxygen-not-included": "oxygennotincluded",
}


class NexusModsScraper(BaseScraper):
    """Nexus Mods 爬虫（使用 Playwright 浏览器）"""

    def __init__(self):
        super().__init__()
        self._playwright = None
        self._browser = None

    async def _ensure_browser(self):
        if not self._browser:
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=True,
                args=["--disable-blink-features=AutomationControlled"],
            )

    async def _delay(self):
        await asyncio.sleep(self.base_delay + random.random())

    async def _fetch_page(self, url: str) -> Optional[str]:
        """使用 Playwright 获取页面 HTML"""
        await self._ensure_browser()
        context = await self._browser.new_context(
            user_agent=random.choice([
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36",
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
            ]),
            viewport={"width": 1920, "height": 1080},
        )
        page = await context.new_page()
        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
            html = await page.content()
            return html
        except Exception as e:
            print(f"  [ERROR] 页面加载失败: {url} - {e}")
            return None
        finally:
            await page.close()
            await context.close()

    async def scrape_mod(self, url: str) -> Optional[ScrapedMod]:
        """爬取单个模组详情页"""
        await self._delay()
        html = await self._fetch_page(url)
        if not html:
            return None

        soup = BeautifulSoup(html, "lxml")
        try:
            name_el = soup.select_one("h1")
            name = name_el.get_text(strip=True) if name_el else "Unknown"

            summary = ""
            summary_el = soup.select_one(".mod-description__summary, meta[name=description]")
            if summary_el:
                if summary_el.name == "meta":
                    summary = summary_el.get("content", "")
                else:
                    summary = summary_el.get_text(strip=True)

            author_el = soup.select_one(".author, a[href*=/users/]")
            author = author_el.get_text(strip=True) if author_el else ""

            version_el = soup.select_one(".version, .file-version")
            version = version_el.get_text(strip=True) if version_el else ""

            page_text = soup.get_text()
            dl_match = re.search(r"(\d[\d,]*)\s*downloads?", page_text, re.I)
            download_count = int(dl_match.group(1).replace(",", "")) if dl_match else 0

            rating = 0.0
            rating_el = soup.select_one(".rating, .stars")
            if rating_el:
                rating_match = re.search(r"([\d.]+)\s*star", rating_el.get_text(), re.I)
                if rating_match:
                    rating = float(rating_match.group(1))

            category_el = soup.select_one(".category, a[href*=/categories/]")
            category = category_el.get_text(strip=True) if category_el else ""

            thumbnail = ""
            img_el = soup.select_one(".mod-image img, .slideshow img")
            if img_el:
                thumbnail = img_el.get("src", "")

            tags = []
            tag_els = soup.select(".tag, a[href*=/tags/]")
            for t in tag_els:
                tags.append(t.get_text(strip=True))

            source_id = ""
            if "/mods/" in url:
                source_id = url.split("/mods/")[-1].split("?")[0]
                source_id = source_id.split("/")[0]

            return ScrapedMod(
                source="nexus",
                source_id=source_id,
                name=name,
                summary=summary[:300],
                author=author,
                version=version,
                category=category,
                tags=tags,
                thumbnail_url=thumbnail,
                download_count=download_count,
                rating=rating,
            )
        except Exception as e:
            print(f"  [ERROR] 解析失败: {url} - {e}")
            return None

    async def scrape_game_list(self, game_slug: str, pages: int = 3) -> list[ScrapedMod]:
        """爬取某游戏的热门模组列表"""
        nexus_game = NEXUS_GAME_MAP.get(game_slug)
        if not nexus_game:
            print(f"  [SKIP] 未找到 Nexus 映射: {game_slug}")
            return []

        results = []
        for page_num in range(1, pages + 1):
            url = f"https://www.nexusmods.com/{nexus_game}/mods/?page={page_num}&sort=downloads"
            print(f"  [FETCH] {url}")
            await self._delay()

            html = await self._fetch_page(url)
            if not html:
                continue

            soup = BeautifulSoup(html, "lxml")
            links = soup.select("a[href*=/mods/]")
            seen = set()
            for link in links:
                href = link.get("href", "")
                if "/mods/" in href and href not in seen:
                    seen.add(href)
                    full_url = f"https://www.nexusmods.com{href}" if href.startswith("/") else href
                    mod = await self.scrape_mod(full_url)
                    if mod:
                        mod.game_slug = game_slug
                        results.append(mod)
                        print(f"    + {mod.name}")

        return results

    async def search(self, query: str, game: str = "") -> list[ScrapedMod]:
        """搜索模组"""
        nexus_game = NEXUS_GAME_MAP.get(game) if game else ""
        if nexus_game:
            url = f"https://www.nexusmods.com/{nexus_game}/mods/?search={quote(query)}"
        else:
            url = f"https://www.nexusmods.com/search/?search={quote(query)}"

        print(f"  [SEARCH] {url}")
        await self._delay()

        html = await self._fetch_page(url)
        if not html:
            return []

        soup = BeautifulSoup(html, "lxml")
        links = soup.select("a[href*=/mods/]")
        results = []
        seen = set()
        for link in links:
            href = link.get("href", "")
            if "/mods/" in href and href not in seen:
                seen.add(href)
                full_url = f"https://www.nexusmods.com{href}" if href.startswith("/") else href
                mod = await self.scrape_mod(full_url)
                if mod:
                    if game:
                        mod.game_slug = game
                    results.append(mod)

        return results

    async def close(self):
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()
