"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

const features = [
  "Markdown + 协作编辑，实时同步",
  "标签/分组/收藏/回收站一站式管理",
  "GitHub 登录，云端存储，自动保存",
];

export default function HomePage() {
  return (
    <section className="mx-auto flex min-h-full w-full max-w-6xl flex-col items-start gap-10 px-6 py-14">
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/80">
          Byte Note
        </p>
        <h1 className="text-3xl font-bold leading-tight md:text-4xl">
          你的知识空间，轻量但强大。
        </h1>
        <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
          支持协作、标签、分组和云端同步的笔记应用。随时随地记下想法，邀请伙伴一起编辑，或安全地把灵感归档在分组与收藏里。
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/notes">
            <Button size="lg">进入笔记</Button>
          </Link>
          <Link href="/auth">
            <Button variant="outline" size="lg">
              登录 / 注册
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid w-full gap-4 rounded-2xl border border-border/70 bg-card/70 p-6 shadow-sm md:grid-cols-3">
        {features.map((item) => (
          <div
            key={item}
            className="bg-muted/50 text-foreground/90 rounded-xl px-4 py-3 text-sm leading-relaxed"
          >
            {item}
          </div>
        ))}
      </div>

      <div className="grid w-full gap-4 md:grid-cols-3">
        <StatCard title="实时协作" value="Pusher + Yjs" desc="多人编辑，自动保存" />
        <StatCard title="数据存储" value="Postgres" desc="云端持久化，安全可靠" />
        <StatCard title="快速上手" value="GitHub 登录" desc="一键登录，立即记录" />
      </div>
    </section>
  );
}

function StatCard({
  title,
  value,
  desc,
}: {
  title: string;
  value: string;
  desc: string;
}) {
  return (
    <div className="border-border/70 bg-card/80 rounded-2xl border p-5 shadow-sm">
      <p className="text-muted-foreground text-sm">{title}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
      <p className="text-muted-foreground mt-1 text-sm">{desc}</p>
    </div>
  );
}
