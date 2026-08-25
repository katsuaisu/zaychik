import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Heart,
  KeyRound,
  Share2,
  SkipBack,
  SkipForward,
  Settings,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCards, useDeck, useSaveResult, useSetCardStatus, type Card } from "@/lib/queries";
import { CARD_STATUS, colorHex } from "@/lib/deck-colors";
import { playSound, setSoundEnabled, soundEnabled } from "@/lib/sounds";
import { ClassicCard } from "@/components/study/ClassicCard";
import { BlanksCard } from "@/components/study/BlanksCard";
import { OrderCard } from "@/components/study/OrderCard";
import { MatchingCard } from "@/components/study/MatchingCard";

export const Route = createFileRoute("/_authenticated/study/$deckId")({
  head: () => ({
    meta: [
      { title: "Study session — Gizmo Study" },
      {
        name: "description",
        content:
          "Run a flashcard study session: flip cards, fill blanks, order events and match pairs.",
      },
      { property: "og:title", content: "Study session — Gizmo Study" },
      { property: "og:description", content: "Practice a deck and track your mastery and XP." },
    ],
  }),
  component: StudyRunner,
});

const XP_PER_CORRECT = 10;
const START_LIVES = 3;
const START_HINTS = 3;

function StudyRunner() {
  const { deckId } = Route.useParams();
  const navigate = useNavigate();
  const { data: deck } = useDeck(deckId);
  const { data: cards, isLoading } = useCards(deckId);
  const setStatus = useSetCardStatus();
  const saveResult = useSaveResult();

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [xp, setXp] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [hints, setHints] = useState(START_HINTS);
  const [mastered, setMastered] = useState<string[]>([]);
  const [forgotten, setForgotten] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => setMuted(!soundEnabled()), []);

  const list = useMemo(() => cards ?? [], [cards]);
  const total = list.length;
  const current: Card | undefined = list[index];
  const accent = colorHex(deck?.color);
  const progress = total === 0 ? 0 : (done ? total : index) / total;

  function finish(finalScore: number, finalXp: number) {
    setDone(true);
    playSound("complete");
    if (!saved) {
      setSaved(true);
      saveResult.mutate({ deck_id: deckId, score: finalScore, total, xp: finalXp });
    }
  }

  function handleResult(correct: boolean) {
    if (!current) return;
    const nextScore = correct ? score + 1 : score;
    const nextXp = correct ? xp + XP_PER_CORRECT : xp;
    setScore(nextScore);
    setXp(nextXp);
    if (correct) {
      setMastered((prev) => (prev.includes(current.id) ? prev : [...prev, current.id]));
      setForgotten((prev) => prev.filter((id) => id !== current.id));
    } else {
      setForgotten((prev) => (prev.includes(current.id) ? prev : [...prev, current.id]));
      setLives((l) => Math.max(0, l - 1));
    }
    setStatus.mutate({ id: current.id, status: correct ? "mastered" : "forgotten" });

    if (index + 1 >= total) finish(nextScore, nextXp);
    else setIndex(index + 1);
  }

  function restart() {
    setIndex(0);
    setScore(0);
    setXp(0);
    setLives(START_LIVES);
    setHints(START_HINTS);
    setMastered([]);
    setForgotten([]);
    setDone(false);
    setSaved(false);
    setRound((r) => r + 1);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setSoundEnabled(!next);
  }

  if (isLoading || !deck) {
    return <p className="p-8 text-sm font-semibold text-muted-foreground">Loading session…</p>;
  }

  if (total === 0) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">This deck has no cards yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a few cards to {deck.name} and come back to study.
        </p>
        <Link
          to="/decks/$deckId"
          params={{ deckId }}
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
        >
          Add cards
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="edge-gradient h-1.5 w-full shrink-0" />

      {/* Top bar */}
      <header className="flex items-center gap-3 px-4 pt-4 sm:px-6">
        <button
          aria-label="Close session"
          onClick={() => navigate({ to: "/decks" })}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border press hover:bg-muted/60"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <span
            className="h-3.5 w-3.5 shrink-0 rounded-full"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          />
          <span className="truncate text-[15px] font-extrabold">{deck.name}</span>
          <span className="text-sm font-semibold text-muted-foreground">
            {Math.min(index + 1, total)}/{total}
          </span>
        </div>

        <button
          aria-label="Session settings"
          onClick={() => setShowSettings((v) => !v)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border press hover:bg-muted/60"
        >
          <Settings className="h-5 w-5" />
        </button>
        <button
          aria-label="Share deck"
          onClick={() => {
            const url = `${window.location.origin}/study/${deckId}`;
            void navigator.clipboard?.writeText(url);
          }}
          className="hidden h-10 w-10 shrink-0 place-items-center rounded-full border border-border press hover:bg-muted/60 sm:grid"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </header>

      {showSettings && (
        <div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:mx-6">
          <span className="text-sm font-semibold">Sound effects</span>
          <button
            onClick={toggleMute}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            {muted ? "Muted" : "On"}
          </button>
        </div>
      )}

      {/* Progress bar */}
      <div className="mt-4 h-1.5 w-full bg-muted">
        <div
          className="h-full rounded-r-full transition-[width] duration-300"
          style={{ width: `${progress * 100}%`, backgroundColor: accent }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-center gap-3 px-4 py-4 sm:px-6">
        <button
          aria-label="Previous card"
          disabled={index === 0 || done}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          className="hidden h-11 w-11 place-items-center rounded-full border border-border press hover:bg-muted/60 disabled:opacity-40 sm:grid"
        >
          <SkipBack className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-bold">
            <KeyRound className="h-4 w-4 text-status-mastered" /> {hints}
          </span>
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-bold">
            <Heart className="h-4 w-4 text-destructive" /> {lives}
          </span>
          <span
            className="inline-flex min-h-9 items-center rounded-full px-3 text-sm font-extrabold"
            style={{ backgroundColor: `${accent}33` }}
          >
            +{xp} XP
          </span>
        </div>

        <button
          aria-label="Skip card"
          disabled={done}
          onClick={() => {
            if (index + 1 >= total) finish(score, xp);
            else setIndex(index + 1);
          }}
          className="hidden h-11 w-11 place-items-center rounded-full border border-border press hover:bg-muted/60 disabled:opacity-40 sm:grid"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-28 sm:px-6 sm:pb-10">
        {done ? (
          <ResultsSummary
            accent={accent}
            score={score}
            total={total}
            xp={xp}
            mastered={mastered.length}
            forgotten={forgotten.length}
            onRestart={restart}
          />
        ) : (
          current && (
            <div className="flex flex-col gap-4">
              <StatusLabel status={current.status} />
              <CardBody key={`${current.id}-${round}`} card={current} accent={accent} onResult={handleResult} />
              {hints > 0 && (
                <button
                  onClick={() => setHints((h) => Math.max(0, h - 1))}
                  className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60"
                >
                  🔑 Use a hint ({hints} left)
                </button>
              )}
            </div>
          )
        )}
      </main>

      {/* Mobile skip pill */}
      {!done && (
        <div className="fixed inset-x-0 bottom-4 z-10 mx-auto flex w-fit overflow-hidden rounded-full border border-border bg-card shadow-lg sm:hidden">
          <button
            aria-label="Previous card"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className="grid h-12 w-16 place-items-center press disabled:opacity-40"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <span className="w-px bg-border" aria-hidden="true" />
          <button
            aria-label="Skip card"
            onClick={() => {
              if (index + 1 >= total) finish(score, xp);
              else setIndex(index + 1);
            }}
            className="grid h-12 w-16 place-items-center press"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="edge-gradient h-1.5 w-full shrink-0" />
    </div>
  );
}

function StatusLabel({ status }: { status: string }) {
  const info = CARD_STATUS[(status as keyof typeof CARD_STATUS) ?? "new"] ?? CARD_STATUS.new;
  return (
    <p className={`text-sm font-bold ${info.className}`}>
      {info.icon} {info.label}
    </p>
  );
}

function CardBody({
  card,
  accent,
  onResult,
}: {
  card: Card;
  accent: string;
  onResult: (correct: boolean) => void;
}) {
  if (card.card_type === "blanks") return <BlanksCard card={card} accent={accent} onResult={onResult} />;
  if (card.card_type === "order") return <OrderCard card={card} accent={accent} onResult={onResult} />;
  if (card.card_type === "matching")
    return <MatchingCard card={card} accent={accent} onResult={onResult} />;
  return <ClassicCard card={card} accent={accent} onResult={onResult} />;
}

function ResultsSummary({
  accent,
  score,
  total,
  xp,
  mastered,
  forgotten,
  onRestart,
}: {
  accent: string;
  score: number;
  total: number;
  xp: number;
  mastered: number;
  forgotten: number;
  onRestart: () => void;
}) {
  return (
    <section className="card-soft mt-4 p-8 text-center animate-card-in" style={{ borderColor: accent }}>
      <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
        Deck complete
      </p>
      <p className="mt-3 text-6xl font-extrabold tracking-tight" style={{ color: accent }}>
        {score}/{total}
      </p>
      <p className="mt-1 text-sm font-semibold text-muted-foreground">
        {total === 0 ? 0 : Math.round((score / total) * 100)}% correct
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-2xl font-extrabold text-status-mastered">{mastered}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            🏆 Mastered
          </p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-2xl font-extrabold text-status-forgotten">{forgotten}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            ❓ Forgotten
          </p>
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="text-2xl font-extrabold">+{xp}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">XP</p>
        </div>
      </div>

      <div className="mt-7 flex flex-col-reverse justify-center gap-2 sm:flex-row">
        <Link
          to="/decks"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-border px-5 text-[15px] font-bold press hover:bg-muted/60"
        >
          Back to decks
        </Link>
        <button
          onClick={onRestart}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
        >
          Study again
        </button>
      </div>
    </section>
  );
}
