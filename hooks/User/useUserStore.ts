"use client";

import { create } from "zustand";

import type { BnUser } from "@/types";

type UserState = {
  user: BnUser | null;
  setUser: (user: BnUser | null) => void;
  clear: () => void;
};

const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
}));

export default useUserStore;
