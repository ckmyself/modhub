"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateModListPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/mod-lists", {
      method: "POST",
      body: JSON.stringify({ name, summary, isPublic }),
    });
    const data = await res.json();

    if (res.ok) {
      router.push(`/mod-lists/${data.data.id}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">创建 Mod 合集</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">合集名称 *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-white focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">简介</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-white focus:outline-none focus:border-[var(--primary)] resize-none"
          />
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border)] bg-[var(--card)]"
          />
          <span className="text-sm">公开分享</span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "创建中..." : "创建合集"}
        </button>
      </form>
    </div>
  );
}
