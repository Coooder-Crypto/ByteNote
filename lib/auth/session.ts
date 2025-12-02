"use server";

import type { NextRequest } from "next/server";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";

import { authOptions } from "@/server/auth-options";
import type { BnUser } from "@/types/entities";

import { getAuthToken, normalizeAuthToken } from "./token";

const normalizeSessionUser = (
  user: Session["user"] | null | undefined,
): BnUser | null => {
  if (!user?.id) return null;
  return {
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    avatarUrl:
      (user as Session["user"] & { avatarUrl?: string | null }).avatarUrl ??
      user.image ??
      null,
  };
};

export async function getServerAuthSession() {
  return getServerSession(authOptions);
}

/**
 * Try to resolve the authenticated user for server routes.
 * Prefers NextAuth session, falls back to JWT token decoding.
 */
export async function getSessionUser(
  req?: NextRequest | Request,
): Promise<BnUser | null> {
  const session = await getServerAuthSession();
  const sessionUser = normalizeSessionUser(session?.user);
  if (sessionUser) return sessionUser;

  if (req) {
    const tokenUser = await normalizeAuthToken(await getAuthToken(req));
    if (tokenUser) return tokenUser;
  }

  return null;
}
