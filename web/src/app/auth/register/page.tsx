"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "注册失败");
        setLoading(false);
        return;
      }

      setDone(true);
    } catch {
      setError("网络错误");
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center text-3xl text-green-400">✓</div>
        <h1 className="text-xl font-bold mb-2">注册成功！</h1>
        <p className="text-sm text-[var(--muted)] mb-6">
          注册成功！<br />
          现在可以直接登录了。
        </p>
        <Link href="/auth/login" className="inline-block px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors">
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <h1 className="text-2xl font-bold text-center mb-8">注册</h1>

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
          <label className="block text-sm text-[var(--muted)] mb-1">昵称（可选）</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            minLength={6}
            className="w-full px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-white focus:outline-none focus:border-[var(--primary)]"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {loading ? "注册中..." : "注册"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--muted)]">
        <Link href="/auth/login" className="text-[var(--primary)] hover:underline">
          已有账号？登录
        </Link>
      </div>
    </div>
  );
}
