import { Suspense } from "react";

import StatsPageClient from "./pageClient";

export default function NotesStatsPage() {
  return (
    <Suspense fallback={null}>
      <StatsPageClient />
    </Suspense>
  );
}
