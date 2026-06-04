"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApproveButton({ modId }: { modId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    await fetch(`/api/mods/${modId}`, {
      method: "PATCH",
      body: JSON.stringify({ isApproved: true }),
    });
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
    >
      通过
    </button>
  );
}

export function DeleteButton({ modId, modName }: { modId: number; modName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!confirm(`确认删除"${modName}"？`)) return;
    setLoading(true);
    await fetch(`/api/mods/${modId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
    >
      删除
    </button>
  );
}
