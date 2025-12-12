"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ThemeContext } from "@/hooks/app/themeContext";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/constants/theme";
import type { Theme } from "@/types";

const applyThemeClass = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return stored ?? (prefersDark ? "dark" : DEFAULT_THEME);
};

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());
  const [ready] = useState(true);

  useEffect(() => {
    applyThemeClass(theme);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
      ready,
    }),
    [theme, setTheme, toggleTheme, ready],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
