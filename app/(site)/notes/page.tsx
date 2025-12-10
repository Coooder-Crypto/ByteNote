import { Suspense } from "react";

import { NotesPage } from "@/components/note";

export default function Notes() {
  return (
    <Suspense fallback={null}>
      <NotesPage />
    </Suspense>
  );
}
