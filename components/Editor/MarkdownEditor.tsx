"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { useEffect, useMemo, useRef, useState } from "react";

type MarkdownEditorProps = {
  value: string;
  onChange: (next: string) => void;
  readOnly?: boolean;
  placeholder?: string;
};

export default function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = "开始记录你的想法...",
}: MarkdownEditorProps) {
  const applyingRef = useRef(false);
  const [isFocused, setFocused] = useState(false);
  const [markdown, setMarkdown] = useState(value);

  const toDoc = useMemo(
    () => (text: string) => {
      const paragraphs = text.split(/\n{2,}/);
      const content =
        paragraphs.length === 0
          ? [
              {
                type: "paragraph",
                content: [{ type: "text", text: " " }],
              },
            ]
          : paragraphs.map((paragraph) => {
              const lines = paragraph.split("\n");
              const nodes =
                lines.length === 0
                  ? [{ type: "text", text: " " }]
                  : lines.flatMap((line, idx) =>
                      idx === 0
                        ? [{ type: "text", text: line || " " }]
                        : [
                            { type: "hardBreak" },
                            { type: "text", text: line || " " },
                          ],
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: true,
      }),
    ],
    content: "",
    editable: !readOnly,
    onCreate: ({ editor }) => {
      editor.commands.setContent(toDoc(value || ""));
    },
    onUpdate: ({ editor }) => {
      if (applyingRef.current) return;
      const md = editor.getText({ blockSeparator: "\n\n" });
      setMarkdown(md);
      onChange(md);
    },
  });

  useEffect(() => {
    if (!editor) return;
    applyingRef.current = true;
    editor.commands.setContent(toDoc(value || ""));
    setMarkdown(value);
    applyingRef.current = false;
  }, [editor, toDoc, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  useEffect(() => {
    if (!editor) return;
    const handleFocus = () => setFocused(true);
    const handleBlur = () => setFocused(false);
    editor.on("focus", handleFocus);
    editor.on("blur", handleBlur);
    return () => {
      editor.off("focus", handleFocus);
      editor.off("blur", handleBlur);
    };
  }, [editor]);

  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  const toggle = (cmd?: () => boolean) => () => {
    if (!editor || !cmd) return;
    editor.chain().focus();
    cmd();
  };

  const toolbarButton = (
    label: string,
    active: boolean,
    onClick: () => void,
    disabled?: boolean,
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-2 py-1 text-xs font-medium transition ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted"
      } ${disabled ? "opacity-50" : ""}`}
    >
      {label}
    </button>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div
        className={`border-border/60 bg-card/80 rounded-xl border shadow-sm transition ${
          isFocused ? "ring-primary/30 ring-2" : ""
        }`}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          {toolbarButton(
            "B",
            Boolean(editor?.isActive("bold")),
            toggle(() => editor?.chain().focus().toggleBold().run() ?? false),
            readOnly,
          )}
          {toolbarButton(
            "I",
            Boolean(editor?.isActive("italic")),
            toggle(() => editor?.chain().focus().toggleItalic().run() ?? false),
            readOnly,
          )}
          {toolbarButton(
            "列表",
            Boolean(editor?.isActive("bulletList")),
            toggle(
              () => editor?.chain().focus().toggleBulletList().run() ?? false,
            ),
            readOnly,
          )}
          <span className="text-muted-foreground ml-auto text-[11px]">
            {readOnly ? "只读" : "Markdown 支持基础格式"}
          </span>
        </div>
        <div className="relative">
          {!markdown && !isFocused && (
            <p className="text-muted-foreground pointer-events-none absolute top-3 left-3 text-xs">
              {placeholder}
            </p>
          )}
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none px-3 py-3 focus:outline-none"
          />
        </div>
      </div>

      <div className="border-border/60 bg-card/50 rounded-xl border shadow-sm">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-muted-foreground text-xs">预览</span>
          <span className="text-muted-foreground text-[11px]">实时同步</span>
        </div>
        <div className="max-h-[520px] overflow-auto px-4 py-3">
          <MarkdownPreview
            className="prose prose-sm max-w-none text-sm"
            source={markdown || "（暂无内容）"}
          />
        </div>
      </div>
    </div>
  );
}
