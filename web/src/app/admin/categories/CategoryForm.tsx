"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function CategoryForm() {
  const router = useRouter();
  const [games, setGames] = useState<{ id: number; name: string }[]>([]);
  const [gameId, setGameId] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/games").then((r) => r.json()).then((d) => setGames(d.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId || !name) return;
    setLoading(true);
    await fetch("/api/categories", {
      method: "POST",
      body: JSON.stringify({ gameId: parseInt(gameId), name }),
    });
    setName("");
    router.refresh();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
      <h3 className="font-medium mb-3">添加分类</h3>
      <div className="flex gap-3 mb-3">
        <select value={gameId} onChange={(e) => setGameId(e.target.value)} required
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)]">
          <option value="">选择游戏</option>
          {games.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="分类名称" required
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)]" />
      </div>
      <button type="submit" disabled={loading}
        className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg text-sm transition-colors disabled:opacity-50">
        {loading ? "添加中..." : "添加分类"}
      </button>
    </form>
  );
}
