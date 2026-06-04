from pydantic import BaseModel
from typing import Optional


class InstallRequest(BaseModel):
    mod_id: int
    mod_name: str
    game_slug: str
    file_path: str  # 本地文件路径或下载 URL
    install_path: Optional[str] = None  # 相对于游戏目录的安装路径


class ToggleRequest(BaseModel):
    mod_id: int
    enabled: bool


class GamePathRequest(BaseModel):
    game_slug: str
    path: str
