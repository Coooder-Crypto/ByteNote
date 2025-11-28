"use client";

import { Layout, Star, Trash2 } from "lucide-react";
import { signOut } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { SideFolders } from "./SideFolders";
import { SideFooter } from "./SideFooter";
import { SideHeader } from "./SideHeader";
import { SideLibrary } from "./SideLibrary";

const NAV_ITEMS = [
  { icon: Layout, label: "所有笔记", path: "/" },
  { icon: Star, label: "收藏", path: "/?filter=favorite" },
  { icon: Trash2, label: "回收站", path: "/?filter=trash" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const meQuery = trpc.auth.me.useQuery();
  const foldersQuery = trpc.folder.list.useQuery(undefined, {
    enabled: Boolean(meQuery.data),
  });
  const createFolderMutation = trpc.folder.create.useMutation({
    onSuccess: () => {
      setFolderDialogOpen(false);
      setNewFolderName("");
      foldersQuery.refetch();
    },
  });
  useEffect(() => {
    if (!folderDialogOpen) {
      setNewFolderName("");
    }
  }, [folderDialogOpen]);
  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);
  const authUrl = useMemo(
    () => `/auth?callbackUrl=${encodeURIComponent(currentPath || "/")}`,
    [currentPath],
  );

  const handleCreate = () => router.push(meQuery.data ? "/" : authUrl);
  const handleLogout = useCallback(() => {
    void signOut({ callbackUrl: currentPath || "/" });
  }, [currentPath]);
  const handleLoginRedirect = useCallback(() => {
    router.push(authUrl);
  }, [authUrl, router]);

  const handleFolderSelect = useCallback(
    (folderId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (folderId) {
        params.set("folderId", folderId);
        params.delete("filter");
      } else {
        params.delete("folderId");
      }
      router.push(`/?${params.toString()}`.replace(/\?$/, ""));
      setMobileOpen(false);
    },
    [router, searchParams],
  );

  const handleCreateFolder = useCallback(() => {
    setFolderDialogOpen(true);
  }, []);

  const submitCreateFolder = useCallback(() => {
    const name = newFolderName.trim();
    if (!name) return;
    createFolderMutation.mutate({ name });
  }, [createFolderMutation, newFolderName]);

  const body = (
    <aside className="border-border/60 bg-card/80 flex h-full w-64 flex-col border-r shadow-[8px_0_24px_rgba(15,23,42,0.04)] md:min-h-svh">
      <SideHeader onCreate={handleCreate} />
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <SideLibrary
          items={NAV_ITEMS}
          currentPath={currentPath}
          onNavigate={() => setMobileOpen(false)}
        />
        <SideFolders
          folders={
            foldersQuery.data?.folders.map((folder) => ({
              id: folder.id,
              label: folder.name,
              count: folder.noteCount,
            })) ?? []
          }
          activeFolderId={searchParams.get("folderId")}
          onSelectFolder={handleFolderSelect}
          onCreateFolder={handleCreateFolder}
          loading={foldersQuery.isLoading || createFolderMutation.isPending}
        />
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
      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建分组</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="输入分组名称"
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFolderDialogOpen(false)}
              disabled={createFolderMutation.isPending}
            >
              取消
            </Button>
            <Button
              onClick={submitCreateFolder}
              disabled={
                createFolderMutation.isPending || newFolderName.trim().length === 0
              }
            >
              {createFolderMutation.isPending ? "创建中..." : "创建"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
