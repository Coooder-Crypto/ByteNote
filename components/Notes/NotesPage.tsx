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

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-12">
      {selectedNoteId ? (
        <NoteEditor noteId={selectedNoteId} />
      ) : (
        <NotesBoard onSelectNote={setSelectedNote} />
      )}
    </section>
  );
}
