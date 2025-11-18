import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="bg-background text-foreground flex min-h-svh flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <Button size="lg">go go go</Button>
      <Button variant="outline" size="lg">
        bytedance
      </Button>
    </main>
  );
}
