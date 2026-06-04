#!/usr/bin/env python3
"""ModHub 爬虫 CLI 工具"""

import asyncio
import argparse
import sys
import os

from scrapers.nexus_mods import NexusModsScraper
from storage.database import ModStorage


def get_db_path() -> str:
    """获取 Web 项目的 SQLite 数据库路径"""
    web_dir = os.path.join(os.path.dirname(__file__), "..", "web")
    db_path = os.path.join(web_dir, "prisma", "dev.db")
    if not os.path.exists(db_path):
        # 尝试查找其他路径
        alt = os.path.join(web_dir, "dev.db")
        if os.path.exists(alt):
            return alt
        print(f"[WARN] 数据库文件未找到: {db_path}")
        print(f"[WARN] 将使用本地测试数据库")
        db_path = os.path.join(os.path.dirname(__file__), "test.db")
    return os.path.abspath(db_path)


async def cmd_crawl(args):
    """爬取指定游戏的模组列表"""
    scraper = NexusModsScraper()
    storage = ModStorage(get_db_path())

    print(f"\n{'='*50}")
    print(f"开始爬取: {args.game}")
    print(f"数据库: {storage.db_path}")
    print(f"{'='*50}\n")

    try:
        mods = await scraper.scrape_game_list(args.game, pages=args.pages)
        print(f"\n爬取完成，共获取 {len(mods)} 个模组")

        saved = 0
        for mod in mods:
            mod_id = storage.save_mod(mod)
            if mod_id:
                saved += 1
                print(f"  [SAVED] {mod.name} (id={mod_id})")

        print(f"\n成功保存 {saved}/{len(mods)} 个模组到数据库")

    finally:
        await scraper.close()


async def cmd_search(args):
    """搜索模组"""
    scraper = NexusModsScraper()
    storage = ModStorage(get_db_path())

    print(f"\n搜索: {args.query} (game={args.game or 'all'})")

    try:
        mods = await scraper.search(args.query, game=args.game)
        print(f"\n找到 {len(mods)} 个结果:\n")

        for i, mod in enumerate(mods[:20], 1):
            print(f"  {i}. {mod.name}")
            print(f"     作者: {mod.author} | 版本: {mod.version} | 评分: {mod.rating}")
            print(f"     下载: {mod.download_count}")
            if mod.summary:
                print(f"     简介: {mod.summary[:100]}")
            print()

        if args.save:
            saved = 0
            for mod in mods:
                if storage.save_mod(mod):
                    saved += 1
            print(f"保存了 {saved} 个模组到数据库")

    finally:
        await scraper.close()


async def cmd_info(args):
    """获取单个模组详情"""
    scraper = NexusModsScraper()

    print(f"\n获取模组信息: {args.url}\n")

    try:
        mod = await scraper.scrape_mod(args.url)
        if mod:
            print(f"  名称: {mod.name}")
            print(f"  作者: {mod.author}")
            print(f"  版本: {mod.version}")
            print(f"  评分: {mod.rating}")
            print(f"  下载: {mod.download_count}")
            print(f"  分类: {mod.category}")
            print(f"  标签: {', '.join(mod.tags)}")
            print(f"  简介: {mod.summary}")

            if args.save:
                storage = ModStorage(get_db_path())
                mod_id = storage.save_mod(mod)
                print(f"\n  [SAVED] 到数据库 id={mod_id}")
        else:
            print("  [FAIL] 获取失败")

    finally:
        await scraper.close()


def main():
    parser = argparse.ArgumentParser(description="ModHub 爬虫工具")
    sub = parser.add_subparsers(dest="command")

    # crawl
    crawl_p = sub.add_parser("crawl", help="爬取游戏模组列表")
    crawl_p.add_argument("--game", required=True, help="游戏 slug，如 elden-ring")
    crawl_p.add_argument("--pages", type=int, default=3, help="爬取页数")

    # search
    search_p = sub.add_parser("search", help="搜索模组")
    search_p.add_argument("query", help="搜索关键词")
    search_p.add_argument("--game", help="游戏 slug（可选）")
    search_p.add_argument("--save", action="store_true", help="保存结果到数据库")

    # info
    info_p = sub.add_parser("info", help="获取单个模组信息")
    info_p.add_argument("url", help="模组 URL")
    info_p.add_argument("--save", action="store_true", help="保存到数据库")

    args = parser.parse_args()

    if args.command == "crawl":
        asyncio.run(cmd_crawl(args))
    elif args.command == "search":
        asyncio.run(cmd_search(args))
    elif args.command == "info":
        asyncio.run(cmd_info(args))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
