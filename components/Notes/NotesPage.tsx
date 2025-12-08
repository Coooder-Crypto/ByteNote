"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { NotesBoard } from "@/components/Notes";

import { NoteEditor } from "../Editor";

export default function NotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedNoteId = searchParams?.get("noteId");

  const setSelectedNote = (id: string | null) => {
    const params = new URLSearchParams(searchParams ?? undefined);
    if (id) {
      params.set("noteId", id);
    } else {
      params.delete("noteId");
    }
    router.replace(`/notes${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const isEditor = Boolean(selectedNoteId);

  return (
    <section
      className={
        isEditor
          ? "flex w-full flex-1 flex-col px-4 pb-12 md:px-6"
          : "mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-12"
      }
    >
      {isEditor ? (
        <NoteEditor noteId={selectedNoteId as string} />
      ) : (
        <NotesBoard onSelectNote={setSelectedNote} />
      )}
    </section>
  );
}
