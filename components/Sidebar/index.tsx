"use client";

import { Layout, Star, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const meQuery = trpc.auth.me.useQuery();
  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);
  const authUrl = useMemo(
    () => `/auth?callbackUrl=${encodeURIComponent(currentPath || "/")}`,
    [currentPath],
  );

  const handleCreate = () => router.push(meQuery.data ? "/notes" : authUrl);
  const handleLogout = useCallback(() => {
    void signOut({ callbackUrl: currentPath || "/" });
  }, [currentPath]);
  const handleLoginRedirect = useCallback(() => {
    router.push(authUrl);
  }, [authUrl, router]);

  const body = (
    <aside className="border-border/60 bg-card/80 flex h-full w-64 flex-col border-r shadow-[8px_0_24px_rgba(15,23,42,0.04)] md:min-h-svh">
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
        onLogin={handleLoginRedirect}
        onLogout={handleLogout}
        onProfileUpdated={() => meQuery.refetch()}
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
          "fixed inset-y-0 left-0 z-50 md:static md:min-h-svh md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {body}
      </div>
    </>
  );
}
