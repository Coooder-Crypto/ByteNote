"use client";

import { create } from "zustand";

import type { BnUser } from "@/types/entities";

type UserState = {
  user: BnUser | null;
  setUser: (user: BnUser | null) => void;
  clear: () => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}));
