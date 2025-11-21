"use client";

import { Layout, Star, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

import { SideFolders } from "./SideFolders";
import { SideFooter } from "./SideFooter";
import { SideHeader } from "./SideHeader";
import { SideLibrary } from "./SideLibrary";

const NAV_ITEMS = [
  { icon: Layout, label: "所有笔记", path: "/notes" },
  { icon: Star, label: "收藏", path: "/notes?filter=favorite" },
  { icon: Trash2, label: "回收站", path: "/notes?filter=trash" },
];

const MOCK_FOLDERS = [
  { label: "个人", count: 3, color: "text-blue-500" },
  { label: "工作", count: 6, color: "text-emerald-500" },
  { label: "灵感", count: 2, color: "text-purple-500" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const meQuery = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      meQuery.refetch();
      router.push("/auth");
    },
  });

  const handleCreate = () => router.push(meQuery.data ? "/notes" : "/auth");

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-[#252525] border-r border-slate-100 dark:border-slate-800 
    transform transition-transform duration-300 ease-in-out
    ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0 md:static flex flex-col
  `;

  const content = (
    <aside className={sidebarClasses}>
      <SideHeader onCreate={handleCreate} />
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <SideLibrary
          items={NAV_ITEMS}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />
        <SideFolders folders={MOCK_FOLDERS} />
      </nav>
      <SideFooter
        user={meQuery.data ?? null}
        onLogin={() => router.push("/auth")}
        onLogout={() => logoutMutation.mutate()}
      />
    </aside>
  );

  return (
    <>
      <button
        className="bg-card fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full shadow-lg shadow-slate-900/5 md:hidden"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        <Layout className="text-foreground size-5" />
      </button>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {content}
      </div>
    </>
  );
}
