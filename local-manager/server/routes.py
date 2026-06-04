import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from .models import InstallRequest, ToggleRequest, GamePathRequest
from core.game_detector import GameDetector
from core.mod_installer import ModInstaller
from core.conflict_detector import ConflictDetector
from core.profile_manager import ProfileManager

router = APIRouter()

# 数据目录
DATA_DIR = Path.home() / ".modhub"
DATA_DIR.mkdir(exist_ok=True)

game_detector = GameDetector()
mod_installer = ModInstaller(DATA_DIR / "installed.json")
conflict_detector = ConflictDetector()
profile_manager = ProfileManager(DATA_DIR / "profiles.json")


@router.get("/status")
async def get_status():
    """获取本地管理器状态"""
    games = game_detector.detect_all_games()
    installed = mod_installer.list_installed()
    return {
        "status": "running",
        "detected_games": games,
        "installed_mods_count": len(installed),
    }


@router.get("/games")
async def get_detected_games():
    """获取检测到的游戏"""
    games = game_detector.detect_all_games()
    return {"data": games}


@router.post("/games/path")
async def set_game_path(req: GamePathRequest):
    """手动设置游戏路径"""
    path = Path(req.path)
    if not path.exists():
        raise HTTPException(status_code=400, detail="路径不存在")
    game_detector.set_manual_path(req.game_slug, str(path))
    return {"data": {"game_slug": req.game_slug, "path": str(path)}}


@router.get("/mods")
async def get_installed_mods():
    """获取已安装的模组列表"""
    mods = mod_installer.list_installed()
    return {"data": mods}


@router.post("/mods/install")
async def install_mod(req: InstallRequest):
    """安装模组"""
    # 获取游戏目录
    game_dirs = game_detector.detect_all_games()
    game_dir = game_dirs.get(req.game_slug)
    if not game_dir:
        raise HTTPException(status_code=404, detail=f"未找到游戏 {req.game_slug} 的安装目录")

    try:
        result = mod_installer.install(
            mod_id=req.mod_id,
            mod_name=req.mod_name,
            source_path=req.file_path,
            game_dir=game_dir,
            install_subdir=req.install_path or "",
        )
        return {"data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mods/{mod_id}/uninstall")
async def uninstall_mod(mod_id: int):
    """卸载模组"""
    try:
        mod_installer.uninstall(mod_id)
        return {"data": {"mod_id": mod_id, "status": "uninstalled"}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mods/{mod_id}/toggle")
async def toggle_mod(mod_id: int, req: ToggleRequest):
    """启用/禁用模组"""
    try:
        mod_installer.toggle(mod_id, req.enabled)
        return {"data": {"mod_id": mod_id, "enabled": req.enabled}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conflicts")
async def get_conflicts():
    """检测模组冲突"""
    installed = mod_installer.list_installed()
    conflicts = conflict_detector.detect(installed)
    return {"data": conflicts}


@router.get("/profiles")
async def get_profiles():
    """获取保存的配置"""
    profiles = profile_manager.list_all()
    return {"data": profiles}


@router.post("/profiles")
async def save_profile(name: str):
    """保存当前配置"""
    installed = mod_installer.list_installed()
    profile = profile_manager.save(name, installed)
    return {"data": profile}


@router.post("/profiles/{profile_id}/load")
async def load_profile(profile_id: str):
    """加载配置"""
    profile = profile_manager.get(profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="配置未找到")
    mod_installer.apply_profile(profile["mods"])
    return {"data": {"status": "loaded", "profile": profile["name"]}}
