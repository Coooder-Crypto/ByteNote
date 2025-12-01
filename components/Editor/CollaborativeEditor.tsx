"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Y from "yjs";

import { useTheme } from "@/hooks";

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
  const initializedRef = useRef(false);
  const valueRef = useRef(initialMarkdown);
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

  // Sync external markdown changes (e.g., server-saved updates)
  useEffect(() => {
    if (!initializedRef.current) return;
    const current = yText.toString();
    const next = initialMarkdown ?? "";
    if (current === next) return;
    doc.transact(() => {
      yText.delete(0, yText.length);
      yText.insert(0, next, "remote");
    }, "remote");
  }, [doc, initialMarkdown, yText]);

  // Observe text and doc updates
  useEffect(() => {
    const handleText = () => {
      const text = yText.toString();
      if (text === valueRef.current) return;
      valueRef.current = text;
      setValue(text);
      onChange(text);
    };
    yText.observe(handleText);

    const handleDocUpdate = (update: Uint8Array, origin: unknown) => {
      if (origin === LOCAL) {
        onDirtyChange?.(true);
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
