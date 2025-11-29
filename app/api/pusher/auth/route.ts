import { NextResponse } from "next/server";

import { pusherServer } from "@/lib/pusher/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!pusherServer) {
    return NextResponse.json({ error: "Pusher not configured" }, { status: 500 });
  }

  const formData = await req.formData();
  const socketId = formData.get("socket_id")?.toString();
  const channelName = formData.get("channel_name")?.toString();
  const noteId = channelName?.replace("presence-note-", "") ?? "";

  if (!socketId || !channelName || !noteId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const note = await prisma.note.findFirst({
    where: { id: noteId, userId: token.id as string },
    select: { id: true, title: true },
  });

  if (!note) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userInfo = {
    id: token.id as string,
    name: token.name ?? token.email ?? "匿名用户",
    avatar: token.picture ?? null,
    color: pickColor(token.id as string),
  };

  const auth = pusherServer.authorizeChannel(socketId, channelName, {
    user_id: userInfo.id,
    user_info: userInfo,
  });

  return NextResponse.json(auth);
}

const COLORS = [
  "#f97316",
  "#0ea5e9",
  "#a855f7",
  "#22c55e",
  "#e11d48",
  "#06b6d4",
  "#f59e0b",
];

function pickColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % COLORS.length;
  return COLORS[idx];
}
