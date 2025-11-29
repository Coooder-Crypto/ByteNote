"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { NAV_ITEMS } from "@/constants/nav";
import { useUserStore } from "@/hooks/useUserStore";
import { trpc } from "@/lib/trpc/client";

export function useSidebarData() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, setUser, clear } = useUserStore();

  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const meQuery = trpc.auth.me.useQuery();
  const foldersQuery = trpc.folder.list.useQuery(undefined, {
    enabled: Boolean(user),
  });
  const createFolderMutation = trpc.folder.create.useMutation({
    onSuccess: () => {
      setFolderDialogOpen(false);
      setNewFolderName("");
      foldersQuery.refetch();
    },
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser({
        id: meQuery.data.id,
        name: meQuery.data.name ?? meQuery.data.email ?? null,
        email: meQuery.data.email ?? null,
        avatarUrl: meQuery.data.avatarUrl,
      });
    } else if (meQuery.status === "success" && !meQuery.data) {
      clear();
    }
  }, [clear, meQuery.data, meQuery.status, setUser]);

  const currentPath = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  const authUrl = useMemo(
    () => `/auth?callbackUrl=${encodeURIComponent(currentPath || "/notes")}`,
    [currentPath],
  );

  const openCreateDialog = useCallback(() => {
    if (!user) {
      router.push(authUrl);
      return;
    }
    setCreateDialogOpen(true);
  }, [authUrl, router, user]);

  const handleLogout = useCallback(() => {
    void signOut({ callbackUrl: currentPath || "/notes" });
    clear();
  }, [clear, currentPath]);

  const handleFolderSelect = useCallback(
    (folderId: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
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
    createFolderMutation.mutate({ name });
  }, [createFolderMutation, newFolderName]);

  return {
    user,
    navItems: NAV_ITEMS,
    currentPath,
    authUrl,
    foldersQuery,
    createFolderMutation,
    folderDialogOpen,
    setFolderDialogOpen,
    newFolderName,
    setNewFolderName,
    createDialogOpen,
    setCreateDialogOpen,
    openCreateDialog,
    handleLogout,
    handleFolderSelect,
    handleLoginRedirect: () => router.push(authUrl),
    submitCreateFolder,
  };
}
