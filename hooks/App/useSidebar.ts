"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";

import { NAV_ITEMS } from "@/lib/constants/nav";

import useFolderActions from "../note/useFolderActions";
import useUserActions from "../user/useUserActions";

export default function useSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, logout: clearUser, isLoading: userLoading } = useUserActions();
  const {
    folders,
    isLoading: foldersLoading,
    refetch: refetchFolders,
    createFolder,
    createPending,
  } = useFolderActions(Boolean(user));

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const currentPath = useMemo(() => {
    const query = searchParams?.toString() ?? "";
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const handleLogout = useCallback(() => {
    void signOut({ callbackUrl: currentPath || "/notes" });
    clearUser();
  }, [clearUser, currentPath]);

  const handleFolderSelect = useCallback(
    (folderId: string | null) => {
      const params = new URLSearchParams(searchParams?.toString() ?? undefined);
      if (folderId) {
        params.set("folderId", folderId);
        params.delete("filter");
      } else {
        params.delete("folderId");
      }
      router.push(`/notes?${params.toString()}`.replace(/\?$/, ""));
    },
    [router, searchParams],
  );

  const submitCreateFolder = useCallback(() => {
    const name = newFolderName.trim();
    if (!name) return;
    createFolder(name);
    setFolderDialogOpen(false);
    setNewFolderName("");
  }, [createFolder, newFolderName]);

  return {
    user,
    navItems: NAV_ITEMS,
    currentPath,
    foldersQuery: {
      data: { folders },
      isLoading: foldersLoading || userLoading,
      refetch: refetchFolders,
    },
    createFolderPending: createPending,
    folderDialogOpen,
    setFolderDialogOpen,
    newFolderName,
    setNewFolderName,
    handleLogout,
    handleFolderSelect,
    handleLoginRedirect: () => router.push("/auth"),
    submitCreateFolder,
  };
}
