import Link from "next/link";

import { CreateNoteButton } from "@/components/create-note-button";

export default function HomePage() {
  return (
    <section className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-6 py-12 lg:grid-cols-[1.2fr,0.8fr]">
      <div className="space-y-6">
        <p className="text-primary text-sm tracking-wide uppercase">
          ByteDance Frontend Camp · 训练营课题
        </p>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold">Byte Note</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            这是字节训练营前端课程的实践项目，用 Next.js + tRPC + Prisma
            搭建一个 Markdown 笔记平台。当前版本正在持续更新，
            很多笔记功能（离线编辑、AI 助手等）还在打磨中，敬请期待。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CreateNoteButton />
          <Link
            href="/notes"
            className="border-border/60 hover:border-border rounded-full border px-5 py-2 text-sm transition"
          >
            查看公开笔记
          </Link>
        </div>
      </div>
      <div className="border-border/60 bg-card/80 rounded-2xl border p-6 shadow-sm">
        <p className="text-muted-foreground text-sm tracking-wide uppercase">
          项目进度 <span className="text-primary text-xs">(更新中)</span>
        </p>
        <ul className="text-muted-foreground mt-4 space-y-3 text-sm">
          <li>✅ 完成账号系统（注册/登录/会话）</li>
          <li>✅ 支持 Markdown 编辑 + tRPC CRUD</li>
          <li>✅ Tag 和搜索系统</li>
          <li>🚧 完整 ui 和移动端适配</li>
          <li>🚧 离线编辑与本地缓存支持</li>
          <li>🚧 多端协同编辑</li>
          <li>🚧 AI 检索</li>
          <li>🚧 AI 摘要</li>
        </ul>
      </div>
    </section>
  );
}
