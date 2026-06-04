"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InstallButton({
  modId,
  modName,
  gameSlug,
}: {
  modId: number;
  modName: string;
  gameSlug: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleInstall = async () => {
    setLoading(true);
    setMessage("");

    try {
      // Check if local manager is running
      const statusRes = await fetch("/api/local/status");
      if (!statusRes.ok) {
        setMessage("本地管理器未运行，请先启动");
        setLoading(false);
        return;
      }

      const status = await statusRes.json();
      const gameDir = status.detected_games?.[gameSlug];
      if (!gameDir) {
        setMessage(`未检测到游戏目录，请先在「本地管理」中设置路径`);
        setLoading(false);
        return;
      }

      // Get mod file info
      const modRes = await fetch(`/api/mods/${modId}`);
      const modData = await modRes.json();
      const mod = modData.data;

      const file = mod.files?.[0] || mod.versions?.[0]?.files?.[0];
      const filePath = file?.localPath || "";

      if (!filePath && !file?.downloadUrl) {
        setMessage("该模组暂无可用文件");
        setLoading(false);
        return;
      }

      // Install
      const installRes = await fetch("/api/local/mods/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mod_id: modId,
          mod_name: modName,
          game_slug: gameSlug,
          file_path: filePath || file.downloadUrl,
        }),
      });

      if (installRes.ok) {
        setMessage("安装成功！");
      } else {
        const err = await installRes.json();
        setMessage(`安装失败: ${err.detail || err.error}`);
      }
    } catch {
      setMessage("安装请求失败");
    }

    setLoading(false);
  };

  return (
    <div>
      <button
        onClick={handleInstall}
        disabled={loading}
        className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {loading ? "安装中..." : "📥 安装到本地"}
      </button>
      {message && (
        <p className={`text-xs mt-2 ${message.includes("成功") ? "text-green-400" : message.includes("未运行") ? "text-[var(--accent)]" : "text-red-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
