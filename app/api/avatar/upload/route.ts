import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseSessionToken } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!filename) {
    return NextResponse.json(
      { error: "filename query param is required" },
      { status: 400 },
    );
  }

  if (!request.body) {
    return NextResponse.json(
      { error: "request body is empty" },
      { status: 400 },
    );
  }

  const sessionToken = parseSessionToken(request.headers.get("cookie"));
  if (!sessionToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blob = await put(`avatars/${filename}`, request.body, {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: true,
  });

  await prisma.user.update({
    where: { id: session.userId },
    data: { avatarUrl: blob.url },
  });

  return NextResponse.json(blob);
}
