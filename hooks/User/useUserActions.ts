"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

import { trpc } from "@/lib/trpc/client";

import useUserStore from "./useUserStore";

export default function useUserActions() {
  const { user, setUser, clear } = useUserStore();
  const meQuery = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      void utils.auth.me.invalidate();
    },
  });

  useEffect(() => {
    if (meQuery.status !== "success") return;
    if (meQuery.data) {
      const next = {
        id: meQuery.data.id,
        name: meQuery.data.name ?? meQuery.data.email ?? null,
        email: meQuery.data.email ?? null,
        avatarUrl: meQuery.data.avatarUrl,
      };
      if (
        !user ||
        user.id !== next.id ||
        user.name !== next.name ||
        user.email !== next.email ||
        user.avatarUrl !== next.avatarUrl
      ) {
        setUser(next);
      }
    } else {
      clear();
    }
  }, [clear, meQuery.data, meQuery.status, setUser, user]);

  const logout = () => {
    void signOut({ callbackUrl: "/notes" });
    clear();
  };

  const updateProfile = (
    payload: Parameters<typeof updateProfileMutation.mutate>[0],
    onSuccess?: () => void,
  ) => {
    updateProfileMutation.mutate(payload, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return {
    user,
    isLoading: meQuery.isLoading,
    status: meQuery.status,
    refetch: meQuery.refetch,
    logout,
    updateProfile,
    updateProfilePending: updateProfileMutation.isPending,
    updateProfileError: updateProfileMutation.error,
  };
}
