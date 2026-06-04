"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SetRoleButton({ userId, currentRole }: { userId: number; currentRole: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const newRole = currentRole === "admin" ? "user" : "admin";
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role: newRole }),
    });
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg text-xs bg-[var(--card)] border border-[var(--border)] hover:border-[var(--primary)] transition-colors disabled:opacity-50"
    >
      {currentRole === "admin" ? "取消管理员" : "设为管理员"}
    </button>
  );
}
