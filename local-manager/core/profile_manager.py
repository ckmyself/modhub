import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional


class ProfileManager:
    """模组配置管理器：保存/加载模组组合"""

    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(exist_ok=True)
        self._ensure_db()

    def _ensure_db(self):
        if not self.db_path.exists():
            self.db_path.write_text(json.dumps({"profiles": []}, indent=2))

    def _load(self) -> dict:
        return json.loads(self.db_path.read_text())

    def _save(self, data: dict):
        self.db_path.write_text(json.dumps(data, indent=2))

    def list_all(self) -> list[dict]:
        """列出所有配置"""
        data = self._load()
        return data.get("profiles", [])

    def get(self, profile_id: str) -> Optional[dict]:
        """获取单个配置"""
        data = self._load()
        for p in data.get("profiles", []):
            if p["id"] == profile_id:
                return p
        return None

    def save(self, name: str, mods: list[dict]) -> dict:
        """保存当前模组列表为配置"""
        data = self._load()

        profile = {
            "id": str(uuid.uuid4())[:8],
            "name": name,
            "created_at": datetime.now().isoformat(),
            "mods": [
                {
                    "id": m.get("id"),
                    "name": m.get("name"),
                    "enabled": m.get("enabled", True),
                }
                for m in mods
            ],
        }

        data["profiles"].append(profile)
        self._save(data)
        return profile

    def delete(self, profile_id: str):
        """删除配置"""
        data = self._load()
        data["profiles"] = [p for p in data["profiles"] if p["id"] != profile_id]
        self._save(data)
