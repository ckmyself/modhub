from collections import defaultdict
from pathlib import Path
from typing import Optional


class ConflictDetector:
    """模组冲突检测器：检测多个模组是否修改了同一文件"""

    def detect(self, installed_mods: list[dict]) -> list[dict]:
        """检测已安装模组之间的文件冲突

        Args:
            installed_mods: 已安装模组列表

        Returns:
            conflict 列表: [{file: "xxx", mods: ["mod1", "mod2"]}]
        """
        # 构建文件→模组映射
        file_map: dict[str, list[str]] = defaultdict(list)

        for mod in installed_mods:
            if not mod.get("enabled", True):
                continue

            target_dir = Path(mod["target_dir"])
            if not target_dir.exists():
                continue

            mod_name = mod.get("name", f"Unknown({mod['id']})")

            # 扫描模组目录下所有文件
            for file_path in target_dir.rglob("*"):
                if file_path.is_file():
                    # 使用相对于游戏目录的路径作为 key
                    relative = file_path.relative_to(target_dir)
                    file_map[str(relative)].append(mod_name)

        # 找出冲突（多个模组修改同一文件）
        conflicts = [
            {"file": file_path, "mods": mod_names}
            for file_path, mod_names in file_map.items()
            if len(mod_names) > 1
        ]

        return conflicts
