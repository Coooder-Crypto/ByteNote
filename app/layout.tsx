import "./globals.css";

import type { Metadata } from "next";

import { ServiceWorkerRegister, SyncBootstrap } from "@/components/common";
import { cn } from "@/lib/utils";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "ByteNote",
    template: "%s · ByteNote",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    shortcut: ["/favicon-32x32.png"],
    apple: [{ url: "/apple-touch-icon.png", type: "image/png" }],
  },
  description:
    "ByteNote 是一个面向个人与团队的现代化 Web 笔记应用，主打“写作体验 + 轻协作 + 可自建”。支持结构化编辑、离线编辑与自动同步、多人实时协作，以及 AI 摘要与报告。",
  openGraph: {
    title: "ByteNote · 写作体验 + 轻协作 + 可自建",
    description:
      "结构化编辑、离线编辑与自动同步、多人实时协作，以及 AI 摘要与报告。",
    siteName: "ByteNote",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ByteNote",
    description:
      "结构化编辑、离线编辑与自动同步、多人实时协作，以及 AI 摘要与报告。",
  },
  keywords: [
    "Next.js",
    "React",
    "tRPC",
    "Prisma",
    "PostgreSQL",
    "PWA",
    "Slate",
    "Yjs",
    "协作",
    "离线",
    "笔记",
    "AI",
    "DeepSeek",
    "ByteNote",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={cn("bg-background min-h-svh font-sans antialiased")}>
        <ServiceWorkerRegister />
        <Providers>
          <SyncBootstrap />
          {children}
        </Providers>
      </body>
    </html>
  );
}
