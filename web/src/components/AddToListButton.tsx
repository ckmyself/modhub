"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ModList {
  id: number;
  name: string;
  _count?: { entries: number };
}

export default function AddToListButton({ modId }: { modId: number }) {
  const { data: session } = useSession();
  const [lists, setLists] = useState<ModList[]>([]);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (session && open) {
      fetch("/api/mod-lists")
        .then((r) => r.json())
        .then((d) => setLists(d.data || []));
    }
  }, [session, open]);

  const handleAdd = async (listId: number) => {
    const res = await fetch(`/api/mod-lists/${listId}/entries`, {
      method: "POST",
      body: JSON.stringify({ modId }),
    });
    if (res.ok) {
      setMessage("已添加到合集！");
      setOpen(false);
      setTimeout(() => setMessage(""), 2000);
    }
  };

  if (!session) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:border-[var(--primary)] transition-colors"
      >
        📦 添加到合集
      </button>

      {message && (
        <p className="text-xs text-green-400 mt-1">{message}</p>
      )}

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xl z-10">
          {lists.length === 0 ? (
            <div className="p-4 text-sm text-[var(--muted)]">
              还没有合集，
              <button
                onClick={() => router.push("/mod-lists/new")}
                className="text-[var(--primary)] hover:underline"
              >
                创建
              </button>
            </div>
          ) : (
            <div className="py-2">
              {lists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => handleAdd(list.id)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition-colors"
                >
                  {list.name}
                  {list._count && (
                    <span className="text-[var(--muted)] ml-2">({list._count.entries})</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
