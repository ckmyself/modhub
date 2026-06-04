"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface LocalStatus {
  status: string;
  detected_games: Record<string, string>;
  installed_mods_count: number;
}

interface InstalledMod {
  id: number;
  name: string;
  game_dir: string;
  enabled: boolean;
  install_path: string;
}

interface Game { id: number; slug: string; name: string; }

export default function LocalManagerPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);
  const [status, setStatus] = useState<LocalStatus | null>(null);
  const [installedMods, setInstalledMods] = useState<InstalledMod[]>([]);
  const [conflicts, setConflicts] = useState<{ file: string; mods: string[] }[]>([]);
  const [error, setError] = useState("");
  const [manualSlug, setManualSlug] = useState("");
  const [manualPath, setManualPath] = useState("");
  const [pathMsg, setPathMsg] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [authStatus, router]);

  const fetchData = async () => {
    try {
      const [statusRes, modsRes, conflictRes] = await Promise.all([
        fetch("/api/local/status"),
        fetch("/api/local/mods"),
        fetch("/api/local/conflicts"),
      ]);

      if (statusRes.ok) setStatus(await statusRes.json());
      if (modsRes.ok) {
        const modsData = await modsRes.json();
        setInstalledMods(modsData.data || []);
      }
      if (conflictRes.ok) {
        const conflictData = await conflictRes.json();
        setConflicts(conflictData.data || []);
      }
      setError("");
    } catch {
      setError("无法连接到本地管理器");
    }
  };

  useEffect(() => {
    fetchData();
    fetch("/api/games").then((r) => r.json()).then((d) => {
      setGames(d.data || []);
      if (d.data?.length > 0) setManualSlug(d.data[0].slug);
    });
  }, []);

  const handleToggle = async (modId: number, enabled: boolean) => {
    await fetch(`/api/local/mods/${modId}/toggle`, {
      method: "POST",
      body: JSON.stringify({ modId, enabled }),
    });
    fetchData();
  };

  const handleSetPath = async () => {
    if (!manualPath.trim()) return;
    setPathMsg("");
    const res = await fetch("/api/local/games/path", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game_slug: manualSlug, path: manualPath }),
    });
    if (res.ok) {
      setPathMsg("路径已保存！");
      fetchData();
    } else {
      const err = await res.json();
      setPathMsg(err.detail || "设置失败");
    }
  };

  const handleUninstall = async (modId: number) => {
    await fetch(`/api/local/mods/${modId}/uninstall`, { method: "POST" });
    fetchData();
  };

  if (authStatus === "loading") {
    return <div className="text-center py-20 text-[var(--muted)]">加载中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">本地模组管理</h1>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm hover:border-[var(--primary)] transition-colors"
        >
          刷新
        </button>
      </div>

      {/* Status */}
      {status && (
        <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${status.status === "running" ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm">管理器 {status.status === "running" ? "运行中" : "离线"}</span>
          </div>
          <p className="text-xs text-[var(--muted)]">
            已安装 {status.installed_mods_count} 个模组
            | 检测到 {Object.keys(status.detected_games).length} 个游戏
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 mb-6">
          <p className="text-sm text-red-400">{error}</p>
          <p className="text-xs text-[var(--muted)] mt-2">
            请先启动本地管理器：
          </p>
          <code className="block text-xs bg-black/30 px-3 py-2 rounded mt-1">
            cd local-manager && python server/main.py
          </code>
        </div>
      )}

      {/* Games */}
      {status?.detected_games && Object.keys(status.detected_games).length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">检测到的游戏</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(status.detected_games).map(([slug, path]) => (
              <div key={slug} className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                <p className="font-medium text-sm">{slug}</p>
                <p className="text-xs text-[var(--muted)] mt-1 truncate">{path}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 手动设置游戏路径 */}
      <section className="mb-8 p-5 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <h2 className="text-lg font-semibold mb-3">手动添加游戏路径</h2>
        <p className="text-xs text-[var(--muted)] mb-4">
          如果 Steam 游戏未被自动检测，请手动指定游戏安装目录
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={manualSlug}
            onChange={(e) => setManualSlug(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)]"
          >
            {games.map((g) => (
              <option key={g.slug} value={g.slug}>{g.name}</option>
            ))}
          </select>
          <input
            type="text"
            value={manualPath}
            onChange={(e) => setManualPath(e.target.value)}
            placeholder="例如: D:\\Games\\Steam\\steamapps\\common\\Skyrim Special Edition"
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)]"
          />
          <button
            onClick={handleSetPath}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg text-sm transition-colors shrink-0"
          >
            保存路径
          </button>
        </div>
        {pathMsg && (
          <p className={`text-xs mt-2 ${pathMsg.includes("保存") ? "text-green-400" : "text-red-400"}`}>
            {pathMsg}
          </p>
        )}
      </section>

      {/* Installed Mods */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">
          已安装模组 ({installedMods.length})
        </h2>
        {installedMods.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">尚未安装任何模组</p>
        ) : (
          <div className="space-y-3">
            {installedMods.map((mod) => (
              <div
                key={mod.id}
                className={`p-4 rounded-xl border transition-colors ${
                  mod.enabled
                    ? "bg-[var(--card)] border-[var(--border)]"
                    : "bg-[var(--card)]/50 border-[var(--border)] opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{mod.name}</p>
                    <p className="text-xs text-[var(--muted)] mt-1 truncate max-w-md">
                      {mod.install_path}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(mod.id, !mod.enabled)}
                      className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                        mod.enabled
                          ? "bg-green-500/20 text-green-400"
                          : "bg-[var(--card)] border border-[var(--border)]"
                      }`}
                    >
                      {mod.enabled ? "已启用" : "已禁用"}
                    </button>
                    <button
                      onClick={() => handleUninstall(mod.id)}
                      className="px-3 py-1 rounded-lg text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      卸载
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 text-[var(--accent)]">
            ⚠ 文件冲突 ({conflicts.length})
          </h2>
          <div className="space-y-2">
            {conflicts.map((c, i) => (
              <div key={i} className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <p className="text-sm font-medium">{c.file}</p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  冲突模组: {c.mods.join(", ")}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
