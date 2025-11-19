import type { PrismaClient } from "@prisma/client";
import { parse, serialize } from "cookie";
import { randomBytes } from "crypto";

export const SESSION_COOKIE_NAME = "byte_note_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function generateSessionToken() {
  return randomBytes(32).toString("hex");
}

export function parseSessionToken(cookieHeader: string | null) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = parse(cookieHeader);
  return cookies[SESSION_COOKIE_NAME] ?? null;
}

export function createSessionCookie(token: string, expiresAt: Date) {
  return serialize(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie() {
  return serialize(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });
}

export async function createSession(prisma: PrismaClient, userId: string) {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expiresAt,
    },
  });

  return { sessionToken, expiresAt };
}

export async function deleteSession(prisma: PrismaClient, sessionToken: string) {
  await prisma.session.deleteMany({
    where: { sessionToken },
  });
}

export async function touchSession(prisma: PrismaClient, sessionToken: string) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await prisma.session.updateMany({
    where: { sessionToken },
    data: { expiresAt },
  });
  return expiresAt;
}
