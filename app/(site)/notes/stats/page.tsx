import { Suspense } from "react";

import StatsPageClient from "./pageClient";

export const dynamic = "force-dynamic";

export default function NotesStatsPage() {
  return (
    <Suspense fallback={null}>
      <StatsPageClient />
    </Suspense>
  );
}
