import { CollaborativeEditor } from "@/components/Editor";
import { NoteTags } from "@/components/NoteTags";
import type { EditorState } from "@/hooks/useNoteStore";

type EditorProps = {
  noteId: string;
  state: EditorState;
  canEdit: boolean;
  onContentChange: (val: string) => void;
  onDirtyChange: (dirty: boolean) => void;
};

export default function EditorSection({
  noteId,
  state,
  canEdit,
  onContentChange,
  onDirtyChange,
}: EditorProps) {
  if (canEdit) {
    return (
      <div className="border-border/60 bg-card min-h-[70vh] rounded-xl border shadow-sm">
        <CollaborativeEditor
          noteId={noteId}
          initialMarkdown={state.markdown}
          onChange={onContentChange}
          onDirtyChange={onDirtyChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NoteTags tags={state.tags} />
      <div className="border-border/60 bg-card h-[70vh] overflow-auto rounded-xl border p-4 shadow-sm">
        <p className="text-muted-foreground text-sm">仅作者可编辑</p>
        <div className="mt-3 text-sm whitespace-pre-wrap">{state.markdown}</div>
      </div>
    </div>
  );
}
