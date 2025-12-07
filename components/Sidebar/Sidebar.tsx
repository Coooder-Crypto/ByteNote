"use client";

import { Layout } from "lucide-react";
import { useState } from "react";

import { useSidebar } from "@/hooks";
import { cn } from "@/lib/utils";

import CreateFolderDialog from "./CreateFolderDialog";
import SideFolders from "./SideFolders";
import SideFooter from "./SideFooter";
import SideHeader from "./SideHeader";
import SideLibrary from "./SideLibrary";

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const handleFolderSelectClose = (folderId: string | null) => {
    handleFolderSelect(folderId);
    setMobileOpen(false);
  };

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
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:static md:min-h-svh md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <aside className="border-border/60 bg-card/80 flex h-full w-50 flex-col border-r shadow-[8px_0_24px_rgba(15,23,42,0.04)] md:h-svh">
          <SideHeader />
          <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
            <SideLibrary
              items={navItems}
              currentPath={currentPath}
              onNavigate={() => setMobileOpen(false)}
            />
            <SideFolders
              folders={foldersQuery.data?.folders ?? []}
              activeFolderId={new URLSearchParams(
                currentPath.split("?")[1] ?? "",
              ).get("folderId")}
              onSelectFolder={handleFolderSelectClose}
              onCreateFolder={() => setFolderDialogOpen(true)}
              loading={foldersQuery.isLoading || createFolderPending}
            />
          </nav>
          <SideFooter
            onLogin={handleLoginRedirect}
            onLogout={() => {
              handleLogout();
              setMobileOpen(false);
            }}
            onProfileUpdated={() => foldersQuery.refetch()}
          />
        </aside>
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
