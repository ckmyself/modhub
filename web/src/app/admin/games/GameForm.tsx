"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GameForm() {
  const router = useRouter();
  const [form, setForm] = useState({ slug: "", name: "", developer: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/games", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setForm({ slug: "", name: "", developer: "" });
    router.refresh();
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
      <h3 className="font-medium mb-3">添加游戏</h3>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="slug (如 elden-ring)" required
          className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)]" />
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="游戏名称" required
          className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)]" />
        <input value={form.developer} onChange={(e) => setForm({ ...form, developer: e.target.value })} placeholder="开发商"
          className="px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-white focus:outline-none focus:border-[var(--primary)]" />
      </div>
      <button type="submit" disabled={loading}
        className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg text-sm transition-colors disabled:opacity-50">
        {loading ? "添加中..." : "添加游戏"}
      </button>
    </form>
  );
}
