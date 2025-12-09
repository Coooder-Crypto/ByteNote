"use client";

import { Github, Globe, Lock, Users, Zap } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function ByteNoteLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M6 3C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V9L14 3H6Z"
        className="fill-primary/10 stroke-primary"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M14 3V9H20"
        className="fill-primary/20 stroke-primary"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle
        cx="9.5"
        cy="13.5"
        r="1.5"
        className="fill-slate-800 dark:fill-slate-100"
      />
      <circle
        cx="14.5"
        cy="13.5"
        r="1.5"
        className="fill-slate-800 dark:fill-slate-100"
      />
      <path
        d="M10.5 16.5C10.5 16.5 11.5 17.5 13.5 16.5"
        className="stroke-slate-800 dark:stroke-slate-100"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="8" cy="14.5" r="1.5" className="fill-pink-400/40" />
      <circle cx="16" cy="14.5" r="1.5" className="fill-pink-400/40" />
      <path
        d="M19 8L22 6L21 11L23 12"
        className="stroke-yellow-500 dark:stroke-yellow-400"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function LandingPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {/* Navbar */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <ByteNoteLogo className="h-8 w-8" />
            <span className="text-xl font-bold tracking-tight">ByteNote</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#features"
              className="hover:text-primary hidden text-sm font-medium text-slate-500 transition sm:block"
            >
              功能
            </a>
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

      {/* Hero */}
      <header className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-24">
        <div className="bg-primary/10 absolute top-0 left-1/2 -z-10 h-[500px] w-[1000px] -translate-x-1/2 rounded-full blur-3xl" />
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase">
            <Zap size={12} /> 协作 · 云同步 · 离线安全
          </div>
          <h1 className="via-primary-800 dark:via-primary-300 bg-gradient-to-r from-slate-900 to-slate-900 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl md:text-6xl dark:from-white dark:to-white">
            ByteNote · 团队一起写作的空间
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            轻量的 Markdown
            协作笔记，实时同步、自动保存。支持标签、分组、收藏、回收站， GitHub
            登录即可开始。
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {user ? (
              <Link href="/notes">
                <Button size="lg" className="shadow-primary/30 gap-2 shadow-lg">
                  进入笔记
                </Button>
              </Link>
            ) : (
              <Link href="/auth">
                <Button size="lg" className="shadow-primary/30 gap-2 shadow-lg">
                  <Github size={18} />
                  使用 GitHub 登录
                </Button>
              </Link>
            )}
            <a href="#features">
              <Button size="lg" variant="outline">
                查看功能
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Features */}
      <section
        id="features"
        className="border-t border-slate-200/80 bg-white py-16 dark:border-slate-800/80 dark:bg-slate-950"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Users className="text-blue-500" />}
              title="实时协作"
              desc="多端同时编辑，光标可见，Yjs 自动合并冲突。"
            />
            <FeatureCard
              icon={<Globe className="text-green-500" />}
              title="离线可写"
              desc="离线也能编辑，恢复网络后自动同步到云端。"
            />
            <FeatureCard
              icon={<Lock className="text-purple-500" />}
              title="安全存储"
              desc="云端持久化，GitHub 登录，权限与协作者可控。"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-50 py-16 dark:bg-slate-900">
        <div className="shadow-primary/5 mx-auto max-w-4xl space-y-6 rounded-3xl border border-slate-200/80 bg-white px-6 py-10 text-center shadow-xl dark:border-slate-800/80 dark:bg-slate-950">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            现在就开始协作
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            一键 GitHub
            登录，邀请同事加入协作。支持标签、分组、收藏、回收站，自动保存与云端同步。
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/auth">
              <Button size="lg" className="gap-2">
                <Github size={18} />
                GitHub 登录
              </Button>
            </Link>
            <Link href="/notes">
              <Button size="lg" variant="outline">
                进入笔记
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-10 text-center text-sm text-slate-500 dark:border-slate-800/80 dark:bg-slate-950 dark:text-slate-400">
        © 2024 ByteNote. Crafted with Next.js & Tailwind. 使用 GitHub
        登录，安全存储。
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
