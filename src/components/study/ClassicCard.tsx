import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
import type { Card } from "@/lib/queries";
import { playSound } from "@/lib/sounds";

export function ClassicCard({
  card,
  accent,
  onResult,
}: {
  card: Card;
  accent: string;
  onResult: (correct: boolean) => void;
}) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => setFlipped(false), [card.id]);

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={() => {
          playSound("flip");
          setFlipped((v) => !v);
        }}
        className="card-soft min-h-40 w-full px-6 py-8 text-left press animate-card-in"
        style={{ borderColor: flipped ? accent : undefined }}
      >
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {flipped ? "Answer" : "Question"}
        </p>
        <p className="mt-3 text-xl font-extrabold leading-snug sm:text-2xl">
          {flipped ? card.answer : card.prompt}
        </p>
        <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <RotateCw className="h-4 w-4" /> Tap to flip
        </p>
      </button>

      {flipped ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => {
              playSound("correct");
              onResult(true);
            }}
            className="min-h-12 flex-1 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
          >
            🏆 Got it
          </button>
          <button
            onClick={() => {
              playSound("wrong");
              onResult(false);
            }}
            className="min-h-12 flex-1 rounded-full border border-border bg-card px-5 text-[15px] font-bold press hover:bg-muted/60"
          >
            ❓ Review again
          </button>
        </div>
      ) : (
        <p className="text-center text-sm font-medium text-muted-foreground">
          Think of the answer first to do active recall
        </p>
      )}
    </div>
  );
}
