"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNeedsVerification(false);

    // Check if email is verified first
    try {
      const checkRes = await fetch(`/api/users/check?email=${encodeURIComponent(email)}`);
      const checkData = await checkRes.json();
      if (checkData.data && !checkData.data.verified) {
        setNeedsVerification(true);
        setLoading(false);
        return;
      }
    } catch {}

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("邮箱或密码错误");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <h1 className="text-2xl font-bold text-center mb-8">登录</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">邮箱</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-white focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-white focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {needsVerification && (
          <div className="p-3 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30">
            <p className="text-sm text-[var(--accent)]">该邮箱还未验证，请先验证后再登录</p>
            <Link href="/auth/register" className="text-xs text-[var(--primary)] hover:underline mt-1 inline-block">
              重新注册
            </Link>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "登录中..." : "登录"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--muted)]">
        <Link href="/auth/register" className="text-[var(--primary)] hover:underline">
          还没有账号？注册
        </Link>
      </div>
    </div>
  );
}
