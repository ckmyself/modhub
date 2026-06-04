"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function FavoriteButton({ modId }: { modId: number }) {
  const { data: session } = useSession();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    if (!session) {
      router.push("/auth/login");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/favorites", {
      method: "POST",
      body: JSON.stringify({ modId }),
    });
    const data = await res.json();
    setFavorited(data.data.favorited);
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
        favorited
          ? "bg-red-500/20 border-red-500 text-red-400"
          : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]"
      }`}
    >
      {favorited ? "♥ 已收藏" : "♡ 收藏"}
    </button>
  );
}

export function ReviewForm({ modId, onSubmitted }: { modId: number; onSubmitted: () => void }) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      router.push("/auth/login");
      return;
    }
    setLoading(true);
    await fetch("/api/reviews", {
      method: "POST",
      body: JSON.stringify({ modId, rating, content }),
    });
    setContent("");
    setLoading(false);
    onSubmitted();
  };

  if (!session) return null;

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-[var(--muted)]">评分:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-lg ${star <= rating ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写下你的评价..."
        rows={3}
        className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)] resize-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="mt-3 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg text-sm transition-colors disabled:opacity-50"
      >
        {loading ? "提交中..." : "提交评价"}
      </button>
    </form>
  );
}
