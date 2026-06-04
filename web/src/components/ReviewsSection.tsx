"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Review {
  id: number;
  rating: number | null;
  content: string | null;
  createdAt: string;
  user: { name: string | null; image: string | null };
}

export default function ReviewsSection({ modId }: { modId: number }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const loadReviews = useCallback(async () => {
    const res = await fetch(`/api/reviews?modId=${modId}`);
    const data = await res.json();
    setReviews(data.data);
  }, [modId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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
    loadReviews();
    router.refresh();
  };

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-4">评价 ({reviews.length})</h2>

      {/* Review Form */}
      {session && (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] mb-4">
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
      )}

      {/* Review List */}
      {reviews.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">暂无评价，来写第一条吧</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {review.user.name || "匿名用户"}
                </span>
                <div className="flex items-center gap-2">
                  {review.rating && (
                    <span className="text-[var(--accent)] text-sm">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                  )}
                  <span className="text-xs text-[var(--muted)]">
                    {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>
              {review.content && (
                <p className="text-sm text-[var(--muted)] mt-2">{review.content}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
