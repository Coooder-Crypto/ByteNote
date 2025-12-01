"use server";

import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

type AnyRequest = Request | NextRequest;

/**
 * Unified helper to read JWT token (NextAuth) with consistent secret + logging.
 */
export async function getAuthToken(req: AnyRequest) {
  try {
    const token = await getToken({
      req: req as unknown as NextRequest,
      secret: process.env.NEXTAUTH_SECRET,
    });
    return token;
  } catch (error) {
    console.error("[auth] getAuthToken failed", error);
    return null;
  }
}
