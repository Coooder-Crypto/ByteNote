"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import type Pusher from "pusher-js";

import { Button } from "@/components/ui/button";
import { createPusherClient } from "@/lib/pusher/client";

type UserInfo = {
  id: string;
  name: string;
  avatar?: string | null;
  color?: string;
};

const FIELD = "note";

type Props = {
  noteId: string;
  initialContent: string;
  user: UserInfo;
  version: number;
  onDirtyChange?: (dirty: boolean) => void;
  onRemoteUpdate?: () => void;
};

export function CollaborativeEditor({
  noteId,
  initialContent,
  user,
  version,
  onDirtyChange,
  onRemoteUpdate,
}: Props) {
  const doc = useMemo(() => new Y.Doc(), []);
  const channelRef = useRef<Pusher.Channel | null>(null);
  const [currentVersion, setCurrentVersion] = useState(version);

  // Initialize Y.Doc once (avoid type conflicts by using distinct field name)
  useEffect(() => {
    const fragment = doc.getXmlFragment(FIELD);
    if (fragment.length === 0 && initialContent) {
      // As we don't have PM JSON here, we just leave empty; loading initial content will be handled by server state
    }
  }, [doc, initialContent]);

  // Setup Pusher channel
  useEffect(() => {
    const pusher = createPusherClient();
    if (!pusher) return;
    const channel = pusher.subscribe(`presence-note-${noteId}`);
    channelRef.current = channel;

    const handleUpdate = (payload: { data: number[]; version?: number }) => {
      if (!payload?.data) return;
      const update = Uint8Array.from(payload.data);
      Y.applyUpdate(doc, update, "remote");
      if (typeof payload.version === "number") {
        setCurrentVersion(payload.version);
      }
      onRemoteUpdate?.();
    };

    channel.bind("client-y-update", handleUpdate);

    return () => {
      channel.unbind("client-y-update", handleUpdate);
      pusher.unsubscribe(`presence-note-${noteId}`);
      pusher.disconnect();
    };
  }, [doc, noteId, onRemoteUpdate]);

  // Broadcast local updates
  useEffect(() => {
    const handler = (update: Uint8Array, origin: unknown) => {
      if (origin === "remote") return;
      onDirtyChange?.(true);
      const channel = channelRef.current;
      if (!channel) return;
      channel.trigger("client-y-update", { data: Array.from(update), version: currentVersion });
    };
    doc.on("update", handler);
    return () => {
      doc.off("update", handler);
    };
  }, [currentVersion, doc, onDirtyChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: doc,
        field: FIELD,
      }),
    ],
    autofocus: true,
  });

  return (
    <div className="border-border/60 bg-card h-[70vh] rounded-xl border p-2 shadow-sm">
      {editor ? (
        <EditorContent editor={editor} className="prose max-w-none h-full overflow-auto" />
      ) : (
        <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
          正在加载协作编辑器…
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>版本 {currentVersion}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onDirtyChange?.(false);
          }}
        >
          已同步
        </Button>
      </div>
    </div>
  );
}
