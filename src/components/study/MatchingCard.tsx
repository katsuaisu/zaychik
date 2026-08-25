import { useEffect, useMemo, useState } from "react";
import type { Card } from "@/lib/queries";
import { matchingPairs, shuffle } from "@/lib/card-data";
import { playSound } from "@/lib/sounds";

export function MatchingCard({
  card,
  accent,
  onResult,
}: {
  card: Card;
  accent: string;
  onResult: (correct: boolean) => void;
}) {
  const pairs = useMemo(() => matchingPairs(card), [card]);
  const [left, setLeft] = useState<string[]>([]);
  const [right, setRight] = useState<string[]>([]);
  const [pickedLeft, setPickedLeft] = useState<string | null>(null);
  const [solved, setSolved] = useState<string[]>([]);
  const [misses, setMisses] = useState(0);
  const [shake, setShake] = useState<string | null>(null);

  useEffect(() => {
    setLeft(shuffle(pairs.map((p) => p.left)));
    setRight(shuffle(pairs.map((p) => p.right)));
    setPickedLeft(null);
    setSolved([]);
    setMisses(0);
  }, [card.id, pairs]);

  const done = pairs.length > 0 && solved.length === pairs.length;

  function pickRight(value: string) {
    if (!pickedLeft || done) return;
    const match = pairs.find((p) => p.left === pickedLeft);
    if (match && match.right === value) {
      setSolved((prev) => [...prev, pickedLeft]);
      setPickedLeft(null);
      playSound("correct");
    } else {
      setMisses((m) => m + 1);
      setShake(value);
      playSound("wrong");
      window.setTimeout(() => setShake(null), 400);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        className="card-soft px-5 py-6 animate-card-in sm:px-6 sm:py-8"
        style={{ borderColor: done ? accent : undefined }}
      >
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Matching type
        </p>
        <p className="mt-3 text-lg font-extrabold leading-snug sm:text-xl">
          {card.prompt || "Match each item with its pair"}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            {left.map((item) => {
              const isSolved = solved.includes(item);
              return (
                <button
                  key={item}
                  disabled={isSolved}
                  onClick={() => setPickedLeft(item)}
                  className={`min-h-12 rounded-2xl border px-3 text-sm font-bold press ${
                    isSolved
                      ? "border-transparent bg-muted text-muted-foreground line-through"
                      : "border-border bg-card hover:bg-muted/60"
                  }`}
                  style={pickedLeft === item ? { borderColor: accent, borderWidth: 2 } : undefined}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2">
            {right.map((item) => {
              const isSolved = pairs.some((p) => p.right === item && solved.includes(p.left));
              return (
                <button
                  key={item}
                  disabled={isSolved}
                  onClick={() => pickRight(item)}
                  className={`min-h-12 rounded-2xl border px-3 text-sm font-bold press ${
                    isSolved
                      ? "border-transparent bg-muted text-muted-foreground line-through"
                      : "border-border bg-card hover:bg-muted/60"
                  } ${shake === item ? "animate-wiggle border-destructive" : ""}`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {done && (
          <p className="mt-4 text-sm font-bold text-status-learning">
            All matched with {misses} {misses === 1 ? "miss" : "misses"}.
          </p>
        )}
      </div>

      <button
        disabled={!done}
        onClick={() => onResult(misses === 0)}
        className="min-h-12 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90 disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  );
}
