import dynamic from "next/dynamic";

const StatsPageClient = dynamic(() => import("./pageClient"), {
  loading: () => (
    <div className="text-muted-foreground px-4 py-6 text-sm">Loading…</div>
  ),
});

export default function NotesStatsPage() {
  return <StatsPageClient />;
}
