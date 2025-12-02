"use server";

import type { NextRequest } from "next/server";

type AnyRequest = Request | NextRequest;

export type AuthToken = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  picture?: string | null;
  avatarUrl?: string | null;
} | null;

/**
 * Unified helper to read JWT token (NextAuth) with consistent secret + logging.
 */
export async function getAuthToken(req: AnyRequest): Promise<AuthToken> {
  try {
    const mod = await import("next-auth/jwt");
    // next-auth + bundler 可能将 getToken 放在 default 导出
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
      secret: process.env.NEXTAUTH_SECRET,
    });
    return token as AuthToken;
  } catch (error) {
    console.error("[auth] getAuthToken failed", error);
    return null;
  }
}
