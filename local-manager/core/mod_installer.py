import json
import shutil
import zipfile
import os
from pathlib import Path
from typing import Optional


class ModInstaller:
    """模组安装/卸载/启停管理器"""

    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(exist_ok=True)
        self._ensure_db()

    def _ensure_db(self):
        if not self.db_path.exists():
            self.db_path.write_text(json.dumps({"mods": {}}, indent=2))

    def _load(self) -> dict:
        return json.loads(self.db_path.read_text())

    def _save(self, data: dict):
        self.db_path.write_text(json.dumps(data, indent=2))

    def list_installed(self) -> list[dict]:
        """列出所有已安装模组"""
        data = self._load()
        return list(data.get("mods", {}).values())

    def get_mod(self, mod_id: int) -> Optional[dict]:
        """获取单个已安装模组信息"""
        data = self._load()
        return data.get("mods", {}).get(str(mod_id))

    def install(self, mod_id: int, mod_name: str, source_path: str,
                game_dir: str, install_subdir: str = "") -> dict:
        """安装模组

        Args:
            mod_id: 模组 ID
            mod_name: 模组名称
            source_path: 源文件路径（zip 或目录）
            game_dir: 游戏安装目录
            install_subdir: 相对于游戏目录的安装子目录
        """
        source = Path(source_path)
        if not source.exists():
            raise FileNotFoundError(f"源文件不存在: {source_path}")

        # 目标目录：game_dir / ModHub / mod_name_xxx
        modhub_dir = Path(game_dir) / "ModHub"
        modhub_dir.mkdir(exist_ok=True)

        target_dir = modhub_dir / f"{mod_name}_{mod_id}"
        if target_dir.exists():
            shutil.rmtree(target_dir)
        target_dir.mkdir(parents=True)

        disabled_dir = modhub_dir / "ModHub_Disabled"
        disabled_dir.mkdir(exist_ok=True)

        # 解压或复制文件
        if source.suffix.lower() in (".zip", ".rar", ".7z"):
            with zipfile.ZipFile(source, "r") as zf:
                zf.extractall(target_dir)
        elif source.is_dir():
            shutil.copytree(source, target_dir, dirs_exist_ok=True)
        else:
            shutil.copy2(source, target_dir)

        # 创建从游戏目录到 ModHub 目录的符号链接
        install_path = Path(game_dir) / (install_subdir or mod_name)
        if install_path.exists():
            # 如果已存在，先备份
            backup = Path(str(install_path) + ".modhub_bak")
            if not backup.exists():
                shutil.move(str(install_path), str(backup))

        # 符号链接（Windows 需要管理员或开发模式）
        try:
            if install_path.exists():
                install_path.unlink()
            os.symlink(str(target_dir), str(install_path),
                       target_is_directory=True)
            link_method = "symlink"
        except (OSError, NotImplementedError):
            # 回退：复制文件
            if install_path.exists():
                shutil.rmtree(install_path)
            shutil.copytree(target_dir, install_path)
            link_method = "copy"

        mod_entry = {
            "id": mod_id,
            "name": mod_name,
            "game_dir": game_dir,
            "install_path": str(install_path),
            "target_dir": str(target_dir),
            "link_method": link_method,
            "enabled": True,
            "has_backup": install_path.exists(),
        }

        data = self._load()
        data["mods"][str(mod_id)] = mod_entry
        self._save(data)

        return mod_entry

    def uninstall(self, mod_id: int):
        """卸载模组"""
        data = self._load()
        mod = data["mods"].pop(str(mod_id), None)
        if not mod:
            raise ValueError(f"模组 {mod_id} 未安装")

        # 删除安装目录
        install_path = Path(mod["install_path"])
        if install_path.exists():
            if mod.get("link_method") == "symlink":
                install_path.unlink()
            else:
                if install_path.is_dir():
                    shutil.rmtree(install_path)
                else:
                    install_path.unlink()

        # 恢复备份
        backup = Path(str(install_path) + ".modhub_bak")
        if backup.exists():
            shutil.move(str(backup), str(install_path))

        # 删除目标目录
        target_dir = Path(mod["target_dir"])
        if target_dir.exists():
            shutil.rmtree(target_dir)

        self._save(data)

    def toggle(self, mod_id: int, enabled: bool):
        """启用/禁用模组"""
        data = self._load()
        mod = data["mods"].get(str(mod_id))
        if not mod:
            raise ValueError(f"模组 {mod_id} 未安装")

        install_path = Path(mod["install_path"])
        target_dir = Path(mod["target_dir"])

        disabled_dir = install_path.parent / "ModHub_Disabled"
        disabled_dir.mkdir(exist_ok=True)

        if enabled and not install_path.exists():
            # 从 disabled 目录移回
            disabled_path = disabled_dir / install_path.name
            if disabled_path.exists():
                shutil.move(str(disabled_path), str(install_path))
        elif not enabled and install_path.exists():
            # 移动到 disabled 目录
            disabled_path = disabled_dir / install_path.name
            shutil.move(str(install_path), str(disabled_path))

        mod["enabled"] = enabled
        data["mods"][str(mod_id)] = mod
        self._save(data)

    def apply_profile(self, mods: list[dict]):
        """应用配置：安装/卸载/启停模组列表"""
        # 先全部禁用
        current = self.list_installed()
        for m in current:
            if m.get("enabled"):
                self.toggle(m["id"], enabled=False)

        # 按配置启停
        profile_ids = {m.get("id") for m in mods}
        for m in current:
            if m["id"] in profile_ids:
                self.toggle(m["id"], enabled=True)
