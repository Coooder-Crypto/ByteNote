"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";

import { Button } from "@/components/ui/button";
import { createPusherClient } from "@/lib/pusher/client";

type UserInfo = {
  id: string;
  name: string;
  avatar?: string | null;
  color?: string;
};

type Props = {
  noteId: string;
  initialContent: string;
  user: UserInfo;
  version: number;
  onDirtyChange?: (dirty: boolean) => void;
  onRemoteUpdate?: () => void;
};

type CursorPayload = {
  from: number;
  to: number;
  user: UserInfo;
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
  const awareness = useMemo(() => new Awareness(doc), [doc]);
  const channelRef = useRef<ReturnType<typeof createPusherClient>["subscribe"] | null>(null);
  const pusherRef = useRef<ReturnType<typeof createPusherClient> | null>(null);
  const [currentVersion, setCurrentVersion] = useState(version);
  const dirtyRef = useRef(false);

  // Initialize Y.Doc with initial content
  useEffect(() => {
    const fragment = doc.getXmlFragment("content");
    doc.transact(() => {
      fragment.delete(0, fragment.length);
      const textNode = new Y.XmlText();
      textNode.insert(0, initialContent);
      fragment.insert(0, [textNode]);
    });
    awareness.setLocalState({
      user: {
        ...user,
        color: user.color ?? "#0ea5e9",
      },
    });
  }, [awareness, doc, initialContent, user]);

  // Setup Pusher channel
  useEffect(() => {
    const pusher = createPusherClient();
    if (!pusher) return;
    pusherRef.current = pusher;
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

    const handleCursor = (payload: CursorPayload) => {
      if (!payload?.user) return;
      awareness.setLocalStateField("remoteCursor", payload);
    };

    channel.bind("client-y-update", handleUpdate);
    channel.bind("client-cursor", handleCursor);

    return () => {
      channel.unbind("client-y-update", handleUpdate);
      channel.unbind("client-cursor", handleCursor);
      pusher.unsubscribe(`presence-note-${noteId}`);
      pusher.disconnect();
    };
  }, [doc, noteId, onRemoteUpdate, awareness]);

  // Broadcast local updates
  useEffect(() => {
    const handler = (update: Uint8Array, origin: unknown) => {
      if (origin === "remote") return;
      dirtyRef.current = true;
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

  // Broadcast cursor position
  useEffect(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const awarenessHandler = () => {
      const state = awareness.getLocalState();
      const cursor = state?.selection;
      if (!cursor) return;
      channel.trigger("client-cursor", {
        from: cursor.anchor,
        to: cursor.head,
        user,
      });
    };
    awareness.on("change", awarenessHandler);
    return () => {
      awareness.off("change", awarenessHandler);
    };
  }, [awareness, user]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: doc,
        field: "content",
      }),
      CollaborationCursor.configure({
        provider: { awareness },
        user: {
          name: user.name,
          color: user.color ?? "#0ea5e9",
        },
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
            if (!editor) return;
            dirtyRef.current = false;
            onDirtyChange?.(false);
          }}
        >
          已同步
        </Button>
      </div>
    </div>
  );
}
