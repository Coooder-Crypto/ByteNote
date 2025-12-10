import { Suspense } from "react";

import { NotesPage } from "@/components/Notes";

export default function Notes() {
  return (
    <Suspense fallback={null}>
      <NotesPage />
    </Suspense>
  );
}
