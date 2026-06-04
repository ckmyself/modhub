"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function UploadModPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [games, setGames] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    summary: "",
    description: "",
    gameId: "",
    categoryId: "",
    version: "1.0.0",
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    fetch("/api/games")
      .then((r) => r.json())
      .then((d) => setGames(d.data));
  }, []);

  useEffect(() => {
    if (form.gameId) {
      fetch(`/api/categories?gameId=${form.gameId}`)
        .then((r) => r.json())
        .then((d) => setCategories(d.data));
    }
  }, [form.gameId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = new FormData();
      body.append("name", form.name);
      body.append("summary", form.summary);
      body.append("description", form.description);
      body.append("gameId", form.gameId);
      body.append("version", form.version);
      if (form.categoryId) body.append("categoryId", form.categoryId);
      if (file) body.append("file", file);

      const res = await fetch("/api/mods/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "上传失败");
        setLoading(false);
        return;
      }

      router.push(`/mods/${data.data.id}`);
    } catch {
      setError("网络错误");
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="text-center py-20 text-[var(--muted)]">加载中...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">发布模组</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">模组名称 *</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-white focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">所属游戏 *</label>
          <select
            value={form.gameId}
            onChange={(e) => setForm({ ...form, gameId: e.target.value, categoryId: "" })}
            required
            className="w-full px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-white focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="">选择游戏</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">分类</label>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-white focus:outline-none focus:border-[var(--primary)]"
          >
            <option value="">无分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">简介 *</label>
          <textarea
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            required
            rows={2}
            className="w-full px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-white focus:outline-none focus:border-[var(--primary)] resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">详细描述</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-white focus:outline-none focus:border-[var(--primary)] resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">版本号</label>
            <input
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-white focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">模组文件（可选）</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-[var(--muted)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-[var(--primary)] file:text-white hover:file:bg-[var(--primary-hover)]"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "发布中..." : "发布模组"}
        </button>
      </form>
    </div>
  );
}
