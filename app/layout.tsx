import "./globals.css";

import type { Metadata } from "next";

import { SyncBootstrap } from "@/components/Common";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import { cn } from "@/lib/utils";

import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Byte Note",
    template: "%s · Byte Note",
  },
  description:
    "Byte Note 是字节训练营前端课程的项目笔记平台，集成 Next.js + tRPC + Prisma，支持 Markdown 笔记管理。",
  openGraph: {
    title: "Byte Note · 字节训练营前端笔记",
    siteName: "Byte Note",
    locale: "zh_CN",
    type: "website",
  },
  keywords: [
    "Byte Note",
    "字节训练营",
    "前端",
    "Next.js",
    "tRPC",
    "Prisma",
    "Markdown",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
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
