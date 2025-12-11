"use client";

import { LayoutDashboard, Star, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui";
import { useSidebar } from "@/hooks";
import { cn } from "@/lib/utils";

import CreateFolderDialog from "./CreateFolderDialog";
import SideFolders from "./SideFolders";
import SideFooter from "./SideFooter";
import SideHeader from "./SideHeader";
import SideLibrary from "./SideLibrary";

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const {
    navItems,
    currentPath,
    foldersQuery,
    createFolderPending,
    folderDialogOpen,
    setFolderDialogOpen,
    newFolderName,
    setNewFolderName,
    handleLogout,
    handleFolderSelect,
    handleLoginRedirect,
    submitCreateFolder,
  } = useSidebar();

  const activeFolderId = useMemo(
    () => new URLSearchParams(currentPath.split("?")[1] ?? "").get("folderId"),
    [currentPath],
  );

  const handleFolderSelectClose = (folderId: string | null) => {
    handleFolderSelect(folderId);
    setMobileOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="bg-card fixed top-4 left-4 z-50 h-10 w-10 items-center justify-center rounded-full shadow-lg shadow-slate-900/5 md:hidden"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle sidebar"
      >
        <LayoutDashboard className="text-foreground size-5" />
      </Button>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden",
          mobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:static md:min-h-svh md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div
          className={cn(
            "border-border/60 bg-card/80 flex h-full flex-col overflow-hidden border-r shadow-[8px_0_24px_rgba(15,23,42,0.04)] transition-[width] duration-300 ease-in-out will-change-[width] md:h-svh",
            collapsed ? "w-20" : "w-60",
            mobileOpen ? "w-60" : "",
          )}
        >
          <SideHeader
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
            onCloseMobile={() => setMobileOpen(false)}
          />

          <div className="flex-1 overflow-y-auto px-4 py-3">
            <SideLibrary
              items={navItems.map((item) => {
                if (item.label === "协作笔记") {
                  return { ...item, icon: Users };
                }
                if (item.label.includes("收藏")) {
                  return { ...item, icon: Star };
                }
                if (item.label.includes("回收站")) {
                  return { ...item, icon: Trash2 };
                }
                return { ...item, icon: LayoutDashboard };
              })}
              currentPath={currentPath}
              collapsed={collapsed}
              onNavigate={() => setMobileOpen(false)}
            />

            <div className="mt-4">
              <SideFolders
                folders={foldersQuery.data?.folders ?? []}
                activeFolderId={activeFolderId}
                onSelectFolder={handleFolderSelectClose}
                onCreateFolder={() => setFolderDialogOpen(true)}
                loading={foldersQuery.isLoading || createFolderPending}
                collapsed={collapsed}
              />
            </div>
          </div>

          <SideFooter
            collapsed={collapsed}
            currentPath={currentPath}
            onLogin={() => {
              handleLoginRedirect();
              setMobileOpen(false);
            }}
            onLogout={() => {
              handleLogout();
              setMobileOpen(false);
            }}
            onProfileUpdated={() => foldersQuery.refetch()}
          />
        </div>
      </aside>

      <CreateFolderDialog
        open={folderDialogOpen}
        name={newFolderName}
        onNameChange={setNewFolderName}
        onClose={() => setFolderDialogOpen(false)}
        onSubmit={() => {
          submitCreateFolder();
          setMobileOpen(false);
        }}
        submitting={createFolderPending}
      />
    </>
  );
}
