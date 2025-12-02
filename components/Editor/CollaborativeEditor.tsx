"use client";

import { EditorContent,useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useMemo, useRef } from "react";

type Props = {
  noteId: string;
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
};

/**
 * Tiptap-based markdown editor.
 * - Emits markdown/plaintext via onChange
 * - Marks dirty only when user input differs from initial content
 */
export default function CollaborativeEditor({
  noteId,
  initialMarkdown,
  onChange,
  onDirtyChange,
}: Props) {
  const initialRef = useRef(initialMarkdown ?? "");
  const applyingRef = useRef(false);

  const markdownToDoc = useMemo(
    () => (text: string) => {
      const paragraphs = text.split(/\n{2,}/);
      const content =
        paragraphs.length === 0
          ? [{ type: "paragraph" }]
          : paragraphs.map((paragraph) => {
              const lines = paragraph.split("\n");
              const nodes =
                lines.length === 0
                  ? [{ type: "text", text: "" }]
                  : lines.flatMap((line, idx) =>
                      idx === 0
                        ? [{ type: "text", text: line }]
                        : [{ type: "hardBreak" }, { type: "text", text: line }],
                    );
              return {
                type: "paragraph",
                content: nodes,
              };
            });
      return { type: "doc", content };
    },
    [],
  );

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        history: true,
      }),
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: markdownToDoc(initialMarkdown || ""),
    onUpdate: ({ editor }) => {
      if (applyingRef.current) return;
      const markdown = editor.getText({ blockSeparator: "\n\n" });
      onChange(markdown);
      onDirtyChange?.(markdown !== initialRef.current);
    },
  });

  // When switching noteId or receiving new initial content, reset editor without marking dirty
  useEffect(() => {
    if (!editor) return;
    applyingRef.current = true;
    const next = initialMarkdown || "";
    initialRef.current = next;
    editor.commands.setContent(markdownToDoc(next));
    onDirtyChange?.(false);
    applyingRef.current = false;
  }, [editor, initialMarkdown, markdownToDoc, noteId, onDirtyChange]);

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  return (
    <div className="border-border/60 bg-background/80 rounded-xl border p-3">
      <EditorContent editor={editor} className="prose prose-sm max-w-none" />
    </div>
  );
}
