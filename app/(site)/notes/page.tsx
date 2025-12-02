import { Suspense } from "react";

import { NotesPage } from "@/components/Notes";

export const dynamic = "force-static";

export default function Notes() {
  return (
    <Suspense fallback={null}>
      <NotesPage />
    </Suspense>
  );
}
