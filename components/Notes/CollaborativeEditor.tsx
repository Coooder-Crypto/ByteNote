"use client";

import { useEffect, useMemo, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type Pusher from "pusher-js";

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
  onChange: (value: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onRemoteUpdate?: () => void;
};

type UpdatePayload = {
  markdown: string;
  version?: number;
  userId: string;
};

export function CollaborativeEditor({
  noteId,
  initialContent,
  user,
  version,
  onChange,
  onDirtyChange,
  onRemoteUpdate,
}: Props) {
  const channelRef = useRef<Pusher.Channel | null>(null);
  const currentVersion = useRef(version);
  const isDirtyRef = useRef(false);
  const initialHtml = useMemo(
    () => `<p>${(initialContent ?? "").replace(/\n/g, "<br>") || "<br>"}</p>`,
    [initialContent],
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialHtml,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      isDirtyRef.current = true;
      onDirtyChange?.(true);
      onChange(text);
      const channel = channelRef.current;
      if (channel) {
        channel.trigger("client-note-update", {
          markdown: text,
          version: currentVersion.current,
          userId: user.id,
        } satisfies UpdatePayload);
      }
    },
  });

  // Setup Pusher
  useEffect(() => {
    const pusher = createPusherClient();
    if (!pusher) return;
    const channel = pusher.subscribe(`presence-note-${noteId}`);
    channelRef.current = channel;

    const handleUpdate = (payload: UpdatePayload) => {
      if (!payload?.markdown) return;
      // Only apply if本地未改动
      if (isDirtyRef.current) {
        onRemoteUpdate?.();
        return;
      }
      editor?.commands.setContent(
        `<p>${payload.markdown.replace(/\n/g, "<br>") || "<br>"}</p>`,
        false,
      );
      if (typeof payload.version === "number") {
        currentVersion.current = payload.version;
      }
      onChange(payload.markdown);
    };

    channel.bind("client-note-update", handleUpdate);

    return () => {
      channel.unbind("client-note-update", handleUpdate);
      pusher.unsubscribe(`presence-note-${noteId}`);
      pusher.disconnect();
    };
  }, [editor, noteId, onChange, onRemoteUpdate]);

  useEffect(() => {
    currentVersion.current = version;
  }, [version]);

  return (
    <div className="border-border/60 bg-card h-[70vh] rounded-xl border p-2 shadow-sm">
      {editor ? (
        <EditorContent editor={editor} className="prose max-w-none h-full overflow-auto" />
      ) : (
        <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
          正在加载编辑器…
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>版本 {currentVersion.current}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            isDirtyRef.current = false;
            onDirtyChange?.(false);
          }}
        >
          已同步
        </Button>
      </div>
    </div>
  );
}
