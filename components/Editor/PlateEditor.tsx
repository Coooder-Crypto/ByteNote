"use client";

import { useEffect, useMemo } from "react";
import type { Descendant } from "slate";
import { createEditor, Editor } from "slate";
import { withHistory } from "slate-history";
import { Editable, Slate, withReact } from "slate-react";
import { type SharedType, toSlateDoc, withYjs } from "slate-yjs";

import { DEFAULT_VALUE, normalizeDescendants } from "./slate/normalize";
import { renderElement, renderLeaf } from "./slate/renderers";
import { SlateToolbar } from "./slate/Toolbar";
import { useEditorShortcuts } from "./slate/useEditorShortcuts";

type PlateEditorProps = {
  valueKey: string;
  value: Descendant[];
  onChange: (val: Descendant[]) => void;
  readOnly?: boolean;
  placeholder?: string;
  sharedType?: SharedType | null;
};

function ensureEditableRoot(editor: Editor) {
  if ((editor as any).__collab) return;
  if (!editor.children || editor.children.length === 0) {
    try {
      Editor.withoutNormalizing(editor, () => {
        editor.children = DEFAULT_VALUE as any;
      });
    } catch {
      // ignore
    }
  }
}

export default function PlateEditor({
  valueKey,
  value,
  onChange,
  readOnly = false,
  placeholder = "开始输入…",
  sharedType,
}: PlateEditorProps) {
  const baseEditor = useMemo(() => withReact(createEditor()), []);

  const yjsEditor = useMemo(() => {
    if (sharedType) {
      const ed = withYjs(baseEditor, sharedType, { synchronizeValue: true });
      (ed as any).__collab = true;
      return withHistory(ed);
    }
    return withHistory(baseEditor);
  }, [baseEditor, sharedType]);

  const editor = yjsEditor as Editor;

  useEffect(() => {
    ensureEditableRoot(editor);
  }, [editor]);

  const normalizedProp = useMemo(() => normalizeDescendants(value), [value]);

  const displayValue = useMemo(() => {
    if (sharedType) {
      const raw = toSlateDoc(sharedType) as any;
      const doc = Array.isArray(raw) ? raw : [];
      const norm = normalizeDescendants(doc);
      return norm.length > 0 ? norm : DEFAULT_VALUE;
    }
    return normalizedProp.length > 0 ? normalizedProp : DEFAULT_VALUE;
  }, [normalizedProp, sharedType]);

  const {
    handleKeyDown,
    isMarkActive,
    isBlockActive,
    toggleMark,
    toggleBlock,
  } = useEditorShortcuts(editor);

  return (
    <div className="space-y-2">
      <SlateToolbar
        visible={!readOnly}
        actions={{
          bold: { active: isMarkActive("bold"), onClick: () => toggleMark("bold") },
          italic: { active: isMarkActive("italic"), onClick: () => toggleMark("italic") },
          underline: { active: isMarkActive("underline"), onClick: () => toggleMark("underline") },
          code: { active: isMarkActive("code"), onClick: () => toggleMark("code") },
          h1: { active: isBlockActive("heading-one"), onClick: () => toggleBlock("heading-one") },
          h2: { active: isBlockActive("heading-two"), onClick: () => toggleBlock("heading-two") },
          bullet: { active: isBlockActive("bulleted-list"), onClick: () => toggleBlock("bulleted-list") },
          ordered: { active: isBlockActive("numbered-list"), onClick: () => toggleBlock("numbered-list") },
          quote: { active: isBlockActive("block-quote"), onClick: () => toggleBlock("block-quote") },
          codeBlock: { active: isBlockActive("code-block"), onClick: () => toggleBlock("code-block") },
        }}
      />

      <Slate
        key={`${sharedType ? "collab" : "local"}-${valueKey}`}
        editor={editor as any}
        initialValue={displayValue}
        onChange={(val) => {
          if (sharedType) return;
          const normalized = normalizeDescendants(val);
          onChange(normalized);
        }}
      >
        <Editable
          readOnly={readOnly}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="prose prose-sm bg-card/80 min-h-[200px] max-w-none rounded-md border p-3 focus:outline-none"
        />
      </Slate>
    </div>
  );
}
