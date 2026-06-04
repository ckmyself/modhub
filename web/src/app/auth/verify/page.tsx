"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [msg, setMsg] = useState("正在验证...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMsg("缺少验证令牌");
      return;
    }

    fetch("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.data) {
          setStatus("success");
          setMsg("邮箱验证成功！");
        } else {
          setStatus("error");
          setMsg(data.error || "验证失败");
        }
      })
      .catch(() => {
        setStatus("error");
        setMsg("网络错误");
      });
  }, [token]);

  return (
    <div className="max-w-sm mx-auto px-4 py-20 text-center">
      {status === "verifying" && (
        <div>
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
          <p className="text-[var(--muted)]">{msg}</p>
        </div>
      )}

      {status === "success" && (
        <div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center text-3xl text-green-400">
            ✓
          </div>
          <h1 className="text-xl font-bold mb-2">验证成功</h1>
          <p className="text-sm text-[var(--muted)] mb-6">{msg}</p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
          >
            去登录
          </Link>
        </div>
      )}

      {status === "error" && (
        <div>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center text-3xl text-red-400">
            ✕
          </div>
          <h1 className="text-xl font-bold mb-2">验证失败</h1>
          <p className="text-sm text-red-400 mb-6">{msg}</p>
          <Link
            href="/auth/register"
            className="inline-block px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
          >
            重新注册
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
        <p className="text-[var(--muted)]">加载中...</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
