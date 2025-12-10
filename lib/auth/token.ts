"use server";

import type { NextRequest } from "next/server";

import type { AnyRequest, AuthToken, BnUser } from "@/types";

const resolveAuthSecret = () =>
  process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
let warnedMissingSecret = false;

export async function getAuthToken(req: AnyRequest): Promise<AuthToken> {
  try {
    const secret = resolveAuthSecret();
    if (!secret && !warnedMissingSecret) {
      console.warn("[auth] NEXTAUTH_SECRET/AUTH_SECRET is not set");
      warnedMissingSecret = true;
    }
    const mod = await import("next-auth/jwt");
    type GetTokenFn = (args: {
      req: NextRequest;
      secret?: string;
    }) => Promise<unknown>;
    const getToken =
      (mod as { getToken?: GetTokenFn }).getToken ??
      (mod as { default?: { getToken?: GetTokenFn } }).default?.getToken;
    if (!getToken) {
      throw new Error("next-auth/jwt getToken not found");
    }
    const token = await getToken({
      req: req as unknown as NextRequest,
      secret,
    });
    return token as AuthToken;
  } catch (error) {
    console.error("[auth] getAuthToken failed", error);
    return null;
  }
}

export async function normalizeAuthToken(
  token: AuthToken,
): Promise<BnUser | null> {
  if (!token) return null;
  const id = token.id ?? (token as { sub?: string | null })?.sub ?? null;
  if (!id) return null;
  return {
    id,
    email: token.email ?? null,
    name: token.name ?? null,
    avatarUrl:
      token.avatarUrl ??
      (token as { picture?: string | null })?.picture ??
      null,
  };
}
