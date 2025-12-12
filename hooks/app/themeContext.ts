"use client";

import { createContext } from "react";

import type { Theme } from "@/types";

export type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  ready: boolean;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);
