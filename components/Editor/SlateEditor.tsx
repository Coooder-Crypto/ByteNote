"use client";

import { useMemo } from "react";
import type { Descendant } from "slate";
import { createEditor, Editor } from "slate";
import { withHistory } from "slate-history";
import { Editable, Slate, withReact } from "slate-react";
import { type SharedType, withYjs } from "slate-yjs";

import { DEFAULT_VALUE, normalizeDescendants } from "./slate/normalize";
import { renderElement, renderLeaf } from "./slate/renderers";
import { SlateToolbar } from "./slate/Toolbar";
import { useEditorShortcuts } from "./slate/useEditorShortcuts";

type SlateEditorProps = {
  valueKey: string;
  value: Descendant[];
  onChange: (val: Descendant[]) => void;
  readOnly?: boolean;
  placeholder?: string;
  sharedType?: SharedType | null;
};

export default function SlateEditor({
  valueKey,
  value,
  onChange,
  readOnly = false,
  placeholder = "开始输入…",
  sharedType,
}: SlateEditorProps) {
  const baseEditor = useMemo(() => withReact(createEditor()), []);
  const localEditor = useMemo(() => withHistory(baseEditor), [baseEditor]);

  const collabEditor = useMemo(() => {
    if (!sharedType) return null;
    const ed = withYjs(withReact(createEditor()), sharedType);
    (ed as any).__collab = true;
    return withHistory(ed);
  }, [sharedType]);

  const editor = (sharedType ? collabEditor : localEditor) as Editor;

  const normalizedProp = useMemo(() => normalizeDescendants(value), [value]);

  const displayValue = useMemo(
    () => (normalizedProp.length > 0 ? normalizedProp : DEFAULT_VALUE),
    [normalizedProp],
  );
  const collabInitialValue = DEFAULT_VALUE;

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
          bold: {
            active: isMarkActive("bold"),
            onClick: () => toggleMark("bold"),
          },
          italic: {
            active: isMarkActive("italic"),
            onClick: () => toggleMark("italic"),
          },
          underline: {
            active: isMarkActive("underline"),
            onClick: () => toggleMark("underline"),
          },
          code: {
            active: isMarkActive("code"),
            onClick: () => toggleMark("code"),
          },
          h1: {
            active: isBlockActive("heading-one"),
            onClick: () => toggleBlock("heading-one"),
          },
          h2: {
            active: isBlockActive("heading-two"),
            onClick: () => toggleBlock("heading-two"),
          },
          bullet: {
            active: isBlockActive("bulleted-list"),
            onClick: () => toggleBlock("bulleted-list"),
          },
          ordered: {
            active: isBlockActive("numbered-list"),
            onClick: () => toggleBlock("numbered-list"),
          },
          quote: {
            active: isBlockActive("block-quote"),
            onClick: () => toggleBlock("block-quote"),
          },
          codeBlock: {
            active: isBlockActive("code-block"),
            onClick: () => toggleBlock("code-block"),
          },
        }}
      />

      {sharedType ? (
        <Slate
          key={`collab-${valueKey}`}
          editor={editor as any}
          initialValue={collabInitialValue}
          onChange={() => {}}
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
      ) : (
        <Slate
          key={`local-${valueKey}`}
          editor={editor as any}
          initialValue={displayValue}
          value={displayValue}
          onChange={(val) => {
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
      )}
    </div>
  );
}
