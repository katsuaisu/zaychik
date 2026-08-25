import { useEffect, useState } from "react";
import type { Card } from "@/lib/queries";
import { blankAnswers, normalize, splitBlanks } from "@/lib/card-data";
import { playSound } from "@/lib/sounds";

export function BlanksCard({
  card,
  accent,
  onResult,
}: {
  card: Card;
  accent: string;
  onResult: (correct: boolean) => void;
}) {
  const answers = blankAnswers(card);
  const chunks = splitBlanks(card.prompt);
  const blanks = Math.max(1, Math.min(answers.length || 1, chunks.length - 1 || 1));
  const [values, setValues] = useState<string[]>(() => Array(blanks).fill(""));
  const [checked, setChecked] = useState<boolean | null>(null);

  useEffect(() => {
    setValues(Array(blanks).fill(""));
    setChecked(null);
  }, [card.id, blanks]);

  function check() {
    const correct = values.every((v, i) => normalize(v) === normalize(answers[i] ?? ""));
    setChecked(correct);
    playSound(correct ? "correct" : "wrong");
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        className="card-soft px-6 py-8 animate-card-in"
        style={{ borderColor: checked === null ? undefined : accent }}
      >
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Fill in the blanks
        </p>
        <p className="mt-3 text-xl font-extrabold leading-relaxed sm:text-2xl">
          {chunks.map((chunk, i) => (
            <span key={i}>
              {chunk}
              {i < chunks.length - 1 && (
                <span className="mx-1 inline-block rounded-md bg-muted px-3 py-0.5 align-middle text-base font-black">
                  ?
                </span>
              )}
            </span>
          ))}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: blanks }).map((_, i) => (
            <input
              key={i}
              value={values[i] ?? ""}
              onChange={(e) =>
                setValues((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && checked === null) check();
              }}
              disabled={checked !== null}
              placeholder={blanks > 1 ? `Blank ${i + 1}` : "Your answer"}
              className="min-h-12 w-full rounded-2xl border border-border px-4 text-base font-semibold outline-none focus:border-brand"
            />
          ))}
        </div>

        {checked !== null && (
          <p
            className={`mt-4 text-sm font-bold ${checked ? "text-status-learning" : "text-destructive"}`}
          >
            {checked ? "Correct!" : `Answer: ${answers.join(", ")}`}
          </p>
        )}
      </div>

      {checked === null ? (
        <button
          onClick={check}
          className="min-h-12 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
        >
          Check answer
        </button>
      ) : (
        <button
          onClick={() => onResult(checked)}
          className="min-h-12 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
        >
          Continue
        </button>
      )}
    </div>
  );
}
