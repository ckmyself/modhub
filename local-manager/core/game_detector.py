import json
import os
import re
from pathlib import Path
from typing import Optional


# Steam 默认安装路径
STEAM_PATHS = [
    "C:\\Program Files (x86)\\Steam",
    "C:\\Program Files\\Steam",
]

# 常见游戏的 Steam AppID 和子目录
GAME_REGISTRY: dict[str, dict] = {
    "elden-ring": {
        "appid": "1245620",
        "subdir": "ELDEN RING\\Game",
        "exe": "eldenring.exe",
    },
    "skyrim": {
        "appid": "489830",
        "subdir": "Skyrim Special Edition",
        "exe": "SkyrimSE.exe",
    },
    "stardew-valley": {
        "appid": "413150",
        "subdir": "Stardew Valley",
        "exe": "Stardew Valley.exe",
    },
    "cyberpunk-2077": {
        "appid": "1091500",
        "subdir": "Cyberpunk 2077",
        "exe": "Cyberpunk2077.exe",
    },
    "baldurs-gate-3": {
        "appid": "1086940",
        "subdir": "Baldurs Gate 3",
        "exe": "bg3.exe",
    },
    "minecraft": {
        "appid": None,
        "subdir": None,
        "exe": None,
    },
}

CONFIG_FILE = Path.home() / ".modhub" / "config.json"


class GameDetector:
    """游戏目录检测器"""

    def __init__(self):
        self._manual_paths: dict[str, str] = {}
        self._load_config()

    def _load_config(self):
        if CONFIG_FILE.exists():
            try:
                data = json.loads(CONFIG_FILE.read_text())
                self._manual_paths = data.get("manual_paths", {})
            except Exception:
                pass

    def _save_config(self):
        CONFIG_FILE.parent.mkdir(exist_ok=True)
        data = {"manual_paths": self._manual_paths}
        CONFIG_FILE.write_text(json.dumps(data, indent=2))

    def set_manual_path(self, game_slug: str, path: str):
        """手动设置游戏路径"""
        self._manual_paths[game_slug] = path
        self._save_config()

    def _find_steam_root(self) -> Optional[Path]:
        """查找 Steam 安装目录"""
        for p in STEAM_PATHS:
            path = Path(p)
            if path.exists() and (path / "steam.exe").exists():
                return path
        return None

    def _find_steam_libraries(self, steam_root: Path) -> list[Path]:
        """查找所有 Steam 库文件夹"""
        libraries = [steam_root / "steamapps"]
        vdf_path = steam_root / "steamapps" / "libraryfolders.vdf"
        if vdf_path.exists():
            try:
                text = vdf_path.read_text(encoding="utf-8")
                for match in re.finditer(r'"(\d+)"\s+"(.+?)"', text):
                    lib_path = Path(match.group(2).replace("\\\\", "\\"))
                    if (lib_path / "steamapps").exists():
                        libraries.append(lib_path / "steamapps")
            except Exception:
                pass
        return libraries

    def detect_all_games(self) -> dict[str, str]:
        """检测所有已安装的游戏，返回 {game_slug: install_path}"""
        result: dict[str, str] = {}

        # 手动路径优先
        result.update(self._manual_paths)

        # Steam 检测
        steam_root = self._find_steam_root()
        if steam_root:
            libraries = self._find_steam_libraries(steam_root)
            for slug, info in GAME_REGISTRY.items():
                if slug in result:  # 手动路径已覆盖
                    continue
                if info["appid"] is None:
                    continue

                # 检查 manifest 文件
                found = False
                for lib in libraries:
                    manifest = lib / f"appmanifest_{info['appid']}.acf"
                    if manifest.exists():
                        # 找到安装目录
                        game_dir = lib / "common" / info["subdir"]
                        if game_dir.exists():
                            result[slug] = str(game_dir.resolve())
                            found = True
                            break

                if not found:
                    # 兜底：直接检查常见位置
                    for lib in libraries:
                        candidate = lib / "common" / info["subdir"]
                        if candidate.exists():
                            result[slug] = str(candidate.resolve())
                            break

        return result
