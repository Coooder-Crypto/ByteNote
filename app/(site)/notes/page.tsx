import { Suspense } from "react";

import { NotesHome } from "@/components/Notes";

export default function NotesPage() {
  return (
    <Suspense fallback={null}>
      <NotesHome />
    </Suspense>
  );
}
