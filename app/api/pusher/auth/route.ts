import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher/server";
import { hashStringToColor } from "@/lib/utils/color";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!pusherServer) {
    return NextResponse.json(
      { error: "Pusher not configured" },
      { status: 500 },
    );
  }

  const formData = await req.formData();
  const socketId = formData.get("socket_id")?.toString();
  const channelName = formData.get("channel_name")?.toString();
  const noteId = channelName?.replace("presence-note-", "") ?? "";

  if (!socketId || !channelName || !noteId) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const user = await getSessionUser(req);
  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const note = await prisma.note.findFirst({
    where: {
      id: noteId,
      OR: [
        { userId: user.id },
        {
          collaborators: {
            some: {
              userId: user.id,
              role: { in: ["editor", "viewer", "owner"] },
            },
          },
        },
      ],
    },
    select: { id: true, title: true },
  });

  if (!note) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userInfo = {
    id: user.id,
    name: user.name ?? user.email ?? "匿名用户",
    avatar: user.avatarUrl ?? null,
    color: hashStringToColor(user.id, COLORS),
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
