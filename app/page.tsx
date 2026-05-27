import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Life Insurance Recommendation
      </h1>
      <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
        National life insurance lead generation site. Phase 1 scaffolding is in
        place — 301-page MVP build is up next.
      </p>
      <Button size="lg">Get started</Button>
    </main>
  );
}
