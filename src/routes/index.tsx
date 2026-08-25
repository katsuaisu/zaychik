import { createFileRoute, Link } from "@tanstack/react-router";
import { Calculator, Layers, Sparkles } from "lucide-react";
import { GizmoLogo } from "@/components/GizmoLogo";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Gizmo Study — GWA Calculator & Flashcards" },
      {
        name: "description",
        content:
          "Compute your GWA quarter by quarter and study your subjects with playful flashcard decks — one study app for both.",
      },
      { property: "og:title", content: "Gizmo Study — GWA Calculator & Flashcards" },
      {
        property: "og:description",
        content: "Compute your GWA and study your subjects with playful flashcard decks.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { session, loading } = useAuth();
  const signedIn = !loading && !!session;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="h-2 w-full shrink-0 edge-gradient" />

      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <GizmoLogo />
        {signedIn ? (
          <Link
            to="/decks"
            className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60"
          >
            Open app
          </Link>
        ) : (
          <Link
            to="/auth"
            className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60"
          >
            Sign in
          </Link>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6">
        <section className="py-10 sm:py-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> Grades and flashcards in one place
          </span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Know your GWA.
            <br />
            <span className="text-brand">Master every card.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            Gizmo Study keeps your quarterly grades and your study decks side by side, so tracking
            your average and actually reviewing happen in the same app.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {signedIn ? (
              <>
                <Link
                  to="/gwa"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
                >
                  <Calculator className="h-5 w-5" /> Open GWA calculator
                </Link>
                <Link
                  to="/decks"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-[15px] font-bold press hover:bg-muted/60"
                >
                  <Layers className="h-5 w-5" /> My decks
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/auth"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-6 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
                >
                  Get started free
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-[15px] font-bold press hover:bg-muted/60"
                >
                  I already have an account
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="card-soft animate-card-in overflow-hidden">
            <div className="h-2 w-full edge-gradient" />
            <div className="p-6">
              <Calculator className="h-8 w-8 text-brand" />
              <h2 className="mt-3 text-xl font-extrabold tracking-tight">GWA calculator</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter final, previous and tentative grades per subject across Q1–Q4 and see your
                weighted average update instantly.
              </p>
              <Link
                to={signedIn ? "/gwa" : "/auth"}
                className="mt-5 inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-sm font-bold text-brand-foreground press hover:opacity-90"
              >
                {signedIn ? "Compute my GWA" : "Try the calculator"}
              </Link>
            </div>
          </div>

          <div className="card-soft animate-card-in overflow-hidden">
            <div className="h-2 w-full edge-gradient" />
            <div className="p-6">
              <Layers className="h-8 w-8 text-brand" />
              <h2 className="mt-3 text-xl font-extrabold tracking-tight">Flashcard decks</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Build colour-coded decks with classic, fill-in-the-blanks, matching and ordering
                cards, then quiz yourself and watch your mastery grow.
              </p>
              <Link
                to={signedIn ? "/decks" : "/auth"}
                className="mt-5 inline-flex min-h-11 items-center rounded-full bg-brand px-5 text-sm font-bold text-brand-foreground press hover:opacity-90"
              >
                {signedIn ? "Study a deck" : "Start studying"}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <div className="h-2 w-full shrink-0 edge-gradient" />
    </div>
  );
}
