"use client";

export const isLocalId = (id: string | undefined | null) =>
  Boolean(id && id.startsWith("local-"));

export const createLocalId = () => {
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
  return `local-${rand}`;
};
