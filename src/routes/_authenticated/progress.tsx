import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Sparkles, Trophy } from "lucide-react";
import { useAllCardStatuses, useDecks, useResults } from "@/lib/queries";
import { colorHex } from "@/lib/deck-colors";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({
    meta: [
      { title: "Progress — Gizmo Study" },
      {
        name: "description",
        content:
          "Track mastered, learning and forgotten cards per deck, plus total XP and your study streak.",
      },
      { property: "og:title", content: "Progress — Gizmo Study" },
      { property: "og:description", content: "See how your decks and mastery are trending." },
    ],
  }),
  component: ProgressPage,
});

function dayKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/** Consecutive days (ending today or yesterday) with at least one session. */
function streakFrom(dates: string[]): number {
  const days = new Set(dates.map(dayKey));
  if (days.size === 0) return 0;
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  let cursor = new Date(today);
  if (!days.has(iso(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(iso(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(iso(cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return streak;
}

function ProgressPage() {
  const { data: decks, isLoading } = useDecks();
  const { data: results } = useResults();
  const { data: statuses } = useAllCardStatuses();

  const sessions = results ?? [];
  const totalXp = sessions.reduce((sum, r) => sum + (r.xp ?? 0), 0);
  const cardsStudied = sessions.reduce((sum, r) => sum + (r.total ?? 0), 0);
  const streak = streakFrom(sessions.map((r) => r.created_at));

  const perDeck = (decks ?? []).map((deck) => {
    const cards = (statuses ?? []).filter((c) => c.deck_id === deck.id);
    const count = (status: string) => cards.filter((c) => c.status === status).length;
    const deckSessions = sessions.filter((r) => r.deck_id === deck.id);
    const last = deckSessions[0]?.created_at ?? null;
    return {
      deck,
      mastered: count("mastered"),
      learning: count("learning") + count("new"),
      forgotten: count("forgotten"),
      total: cards.length,
      last,
      xp: deckSessions.reduce((sum, r) => sum + (r.xp ?? 0), 0),
    };
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">Progress</h1>
      <p className="text-sm text-muted-foreground">
        Your mastery across every deck, updated after each study session.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <SummaryTile icon={<Sparkles className="h-5 w-5" />} label="Total XP" value={totalXp} />
        <SummaryTile
          icon={<Trophy className="h-5 w-5" />}
          label="Cards studied"
          value={cardsStudied}
        />
        <SummaryTile
          icon={<Flame className="h-5 w-5" />}
          label="Day streak"
          value={streak}
        />
      </div>

      <h2 className="mt-9 text-xl font-extrabold tracking-tight">Per deck</h2>

      {isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading your progress…</p>
      ) : perDeck.length === 0 ? (
        <div className="card-soft mt-3 p-10 text-center">
          <h3 className="text-lg font-extrabold">Nothing to show yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a deck and finish a study session to start tracking progress.
          </p>
          <Link
            to="/decks"
            className="mt-5 inline-flex min-h-12 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
          >
            Go to my decks
          </Link>
        </div>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {perDeck.map((row) => {
            const hex = colorHex(row.deck.color);
            const pct = row.total === 0 ? 0 : Math.round((row.mastered / row.total) * 100);
            return (
              <article key={row.deck.id} className="card-soft p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-4 w-4 shrink-0 rounded-[5px]"
                      style={{ backgroundColor: hex }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-extrabold tracking-tight">
                        {row.deck.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {row.last
                          ? `Last studied ${new Date(row.last).toLocaleDateString()}`
                          : "Not studied yet"}
                        {row.xp > 0 && ` · +${row.xp} XP`}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/study/$deckId"
                    params={{ deckId: row.deck.id }}
                    className="inline-flex min-h-11 items-center rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60"
                  >
                    Study
                  </Link>
                </div>

                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: hex }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-sm font-bold">
                  <span className="text-status-mastered">🏆 {row.mastered} mastered</span>
                  <span className="text-status-learning">🌱 {row.learning} learning</span>
                  <span className="text-status-forgotten">❓ {row.forgotten} forgotten</span>
                  <span className="text-muted-foreground">{pct}% of {row.total} cards</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="card-soft flex items-center gap-4 p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-muted text-foreground">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-extrabold tracking-tight">{value}</p>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
