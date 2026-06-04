"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/mods?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
        <Link href="/" className="text-xl font-bold text-white shrink-0">
          ModHub
        </Link>

        <div className="hidden md:flex items-center gap-5 text-sm">
          <Link href="/games" className="text-[var(--muted)] hover:text-white transition-colors">
            游戏
          </Link>
          <Link href="/mods" className="text-[var(--muted)] hover:text-white transition-colors">
            模组
          </Link>
          <Link href="/local" className="text-[var(--muted)] hover:text-white transition-colors">
            本地管理
          </Link>
          <Link href="/mod-lists" className="text-[var(--muted)] hover:text-white transition-colors">
            合集
          </Link>
          {session?.user && (
            <Link href="/mods/new" className="text-[var(--muted)] hover:text-white transition-colors">
              发布
            </Link>
          )}
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索模组..."
            className="w-full px-4 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm text-white placeholder-[var(--muted)] focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
        </form>

        {/* 用户区域 — 顶部右侧 */}
        <div className="relative shrink-0" ref={menuRef}>
          {session?.user ? (
            <>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--card-hover)] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-sm font-medium text-white">
                  {(session.user.name || session.user.email || "U").charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm text-[var(--muted)]">
                  {session.user.name || session.user.email}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--border)]">
                    <p className="text-sm font-medium truncate">{session.user.name || "用户"}</p>
                    <p className="text-xs text-[var(--muted)] truncate">{session.user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition-colors"
                    >
                      个人中心
                    </Link>
                    <Link
                      href="/mods/new"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition-colors"
                    >
                      发布模组
                    </Link>
                    <Link
                      href="/mod-lists"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition-colors"
                    >
                      我的合集
                    </Link>
                    <Link
                      href="/local"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm hover:bg-[var(--card-hover)] transition-colors"
                    >
                      本地管理
                    </Link>
                    {session.user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--card-hover)] transition-colors"
                      >
                        管理面板
                      </Link>
                    )}
                  </div>
                  <div className="border-t border-[var(--border)] py-1">
                    <button
                      onClick={() => signOut()}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[var(--card-hover)] transition-colors"
                    >
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
