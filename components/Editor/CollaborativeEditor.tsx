"use client";

import dynamic from "next/dynamic";
import type { Channel } from "pusher-js";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";

import { useTheme } from "@/hooks";
import { createPusherClient } from "@/lib/pusher/client";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Props = {
  noteId: string;
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

const FIELD = "md-text-v2";
const LOCAL = "local";

export default function CollaborativeEditor({
  noteId,
  initialMarkdown,
  onChange,
  onDirtyChange,
}: Props) {
  const { theme } = useTheme();
  const doc = useMemo(() => new Y.Doc(), [noteId]);
  const yText = useMemo(() => doc.getText(FIELD), [doc]);
  const channelRef = useRef<Channel | null>(null);
  const initializedRef = useRef(false);
  const [value, setValue] = useState(initialMarkdown);

  // Init Y.Text once per note
  useEffect(() => {
    if (initializedRef.current) return;
    yText.delete(0, yText.length);
    if (initialMarkdown) {
      yText.insert(0, initialMarkdown, LOCAL);
    }
    initializedRef.current = true;
  }, [initialMarkdown, yText]);

  // Pusher sync
  useEffect(() => {
    const pusher = createPusherClient();
    if (!pusher) return;
    const channel = pusher.subscribe(`presence-note-${noteId}`);
    channelRef.current = channel;

    const handleUpdate = (payload: { data: number[] }) => {
      if (!payload?.data) return;
      try {
        Y.applyUpdate(doc, Uint8Array.from(payload.data), "remote");
      } catch (error) {
        console.warn("[collab] applyUpdate failed", error);
      }
    };

    channel.bind("client-y-update", handleUpdate);

    return () => {
      channel.unbind("client-y-update", handleUpdate);
      pusher.unsubscribe(`presence-note-${noteId}`);
      channelRef.current = null;
    };
  }, [doc, noteId]);

  // Observe text and doc updates
  useEffect(() => {
    const handleText = () => {
      const text = yText.toString();
      if (text !== value) {
        setValue(text);
      }
      onChange(text);
    };
    yText.observe(handleText);

    const handleDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === LOCAL) {
        onDirtyChange?.(true);
        const channel = channelRef.current;
        if (channel) {
          channel.trigger("client-y-update", { data: Array.from(update) });
        }
      }
    };
    doc.on("update", handleDocUpdate);

    return () => {
      yText.unobserve(handleText);
      doc.off("update", handleDocUpdate);
    };
  }, [doc, onChange, onDirtyChange, yText]);

  return (
    <MDEditor
      value={value}
      onChange={(val) => {
        const next = val ?? "";
        doc.transact(() => {
          yText.delete(0, yText.length);
          yText.insert(0, next, LOCAL);
        }, LOCAL);
      }}
      height={520}
      hideToolbar={false}
      data-color-mode={theme}
      previewOptions={{
        className: theme === "dark" ? "bg-neutral-900" : "bg-white",
      }}
    />
  );
}
