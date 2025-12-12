"use client";

import {
  FilePenLine,
  Github,
  Sparkles,
  Users,
  WifiOff,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { Avatar, Button } from "@/components/ui";

export default function LandingPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {/* Navbar */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <img
              src="/favicon.svg"
              alt=""
              aria-hidden="true"
              className="h-8 w-8"
            />
            <span className="text-xl font-bold tracking-tight">ByteNote</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/notes">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                进入笔记
              </Button>
            </Link>
            {user ? (
              <Link href="/notes" className="flex items-center gap-2">
                <Avatar
                  src={user.avatarUrl ?? undefined}
                  alt={user.name ?? user.email ?? "用户头像"}
                  fallback={(user.name ?? user.email ?? "U").slice(0, 1)}
                  className="border border-slate-200 shadow-sm"
                  size={36}
                />
              </Link>
            ) : (
              <Link href="/auth">
                <Button className="gap-2">
                  <Github size={16} />
                  使用 GitHub 登录
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16">
        {/* Hero */}
        <header className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-24">
          <div className="bg-primary/10 absolute top-0 left-1/2 -z-10 h-[500px] w-[1000px] -translate-x-1/2 rounded-full blur-3xl" />
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
              <Zap size={12} /> 写作体验 · 轻协作 · 可自建
            </div>
            <h1 className="via-primary-800 dark:via-primary-300 bg-gradient-to-r from-slate-900 to-slate-900 bg-clip-text text-3xl font-bold tracking-tight whitespace-nowrap text-transparent sm:text-5xl md:text-6xl dark:from-white dark:to-white">
              ByteNote
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
              基于 Slate
              的结构化编辑器，支持离线编辑与自动同步；协作能力可按需启用，
              并支持通过 Docker 自建协作服务。内置 AI
              摘要与报告，帮助更快回顾内容。
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {user ? (
                <Link href="/notes">
                  <Button
                    size="lg"
                    className="shadow-primary/30 gap-2 shadow-lg"
                  >
                    进入笔记
                  </Button>
                </Link>
              ) : (
                <Link href="/auth">
                  <Button
                    size="lg"
                    className="shadow-primary/30 gap-2 shadow-lg"
                  >
                    <Github size={18} />
                    使用 GitHub 登录
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Features */}
        <section
          id="features"
          className="border-t border-slate-200/80 bg-white py-16 dark:border-slate-800/80 dark:bg-slate-950"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<FilePenLine className="text-blue-500" />}
                title="写作体验"
                desc="结构化编辑器（Slate），支持列表/引用/代码块等常用排版。"
              />
              <FeatureCard
                icon={<WifiOff className="text-green-500" />}
                title="离线与同步"
                desc="离线可完整编辑与管理笔记，联网后自动同步并尽量合并更新。"
              />
              <FeatureCard
                icon={<Users className="text-purple-500" />}
                title="轻协作（可自建）"
                desc="Yjs 实时协作，支持自定义/自建 WebSocket 协作服务。"
              />
              <FeatureCard
                icon={<Sparkles className="text-amber-500" />}
                title="AI 助手"
                desc="支持 AI 自动生成笔记摘要与统计报告（按权限/网络条件启用）。"
              />
            </div>
          </div>
        </section>
      </main>

      {/* CTA */}

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-10 text-center text-sm text-slate-500 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-400">
        © 2025 ByteNote. Crafted with Next.js & Tailwind.
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group hover:border-primary/30 hover:shadow-primary/10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{desc}</p>
    </div>
  );
}
