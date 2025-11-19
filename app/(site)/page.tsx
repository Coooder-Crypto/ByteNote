import { CreateNoteButton } from "@/components/create-note-button";

export default function HomePage() {
  return (
    <section className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-6 py-12 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4">
          <CreateNoteButton />
        </div>
      </div>
    </section>
  );
}
