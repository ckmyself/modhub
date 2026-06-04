import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "ModHub - 游戏模组管理平台",
  description: "发现、管理、分享你的游戏模组",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[var(--border)] py-6 text-center text-sm text-[var(--muted)]">
            <p>ModHub &copy; {new Date().getFullYear()} — 游戏模组管理平台</p>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
