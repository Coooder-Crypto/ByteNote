"use client";

import { create } from "zustand";

type UserInfo = {
  id: string;
  name: string | null;
  email: string | null;
  avatarUrl?: string | null;
};

type UserState = {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
  clear: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}));
