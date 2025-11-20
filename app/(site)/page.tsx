import { CreateNoteButton } from "@/components/create-note-button";

export default function HomePage() {
  return (
    <section className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-6 py-12 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-4">
        <h2 className="text-3xl font-semibold">欢迎来到 Byte Note</h2>
        <div className="flex flex-wrap gap-3">
          <CreateNoteButton />
        </div>
      </div>
    </section>
  );
}
