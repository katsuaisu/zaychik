import { useMemo, useState } from "react";
import type { Card } from "@/lib/queries";
import { normalize, shuffle } from "@/lib/card-data";
import { playSound } from "@/lib/sounds";
import { AnswerText } from "./AnswerText";

/**
 * Multiple-choice view for classic and single-blank cards. Wrong options are
 * pulled from the other answers in the deck and reshuffled on every card.
 */
export function ChoiceCard({
  card,
  accent,
  answer,
  question,
  pool,
  onResult,
}: {
  card: Card;
  accent: string;
  /** The correct answer for this card. */
  answer: string;
  /** Text shown above the options. */
  question: string;
  /** Every answer in the deck, used as distractors. */
  pool: string[];
  onResult: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<string | null>(null);

  const options = useMemo(() => {
    const seen = new Set([normalize(answer)]);
    const distractors: string[] = [];
    for (const candidate of shuffle(pool)) {
      const key = normalize(candidate);
      if (!candidate.trim() || seen.has(key)) continue;
      seen.add(key);
      distractors.push(candidate);
      if (distractors.length === 3) break;
    }
    return shuffle([answer, ...distractors]);
    // Reshuffle whenever the card changes.
  }, [card.id, answer, pool]);

  const correct = picked !== null && normalize(picked) === normalize(answer);

  function pick(option: string) {
    if (picked !== null) return;
    setPicked(option);
    playSound(normalize(option) === normalize(answer) ? "correct" : "wrong");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card-soft px-6 py-8 animate-card-in" style={{ borderColor: accent }}>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Choose the answer
        </p>
        <p className="mt-3 text-xl font-extrabold leading-snug sm:text-2xl">{question}</p>

        <div className="mt-6 flex flex-col gap-3">
          {options.map((option, i) => {
            const isAnswer = normalize(option) === normalize(answer);
            const isPicked = picked !== null && option === picked;
            const state =
              picked === null
                ? "border-border hover:bg-muted/60"
                : isAnswer
                  ? "border-status-learning bg-status-learning/10"
                  : isPicked
                    ? "border-destructive bg-destructive/10"
                    : "border-border opacity-60";
            return (
              <button
                key={`${i}-${option}`}
                onClick={() => pick(option)}
                disabled={picked !== null}
                className={`min-h-12 rounded-2xl border px-4 py-3 text-left text-[15px] font-semibold press ${state}`}
              >
                <AnswerText text={option} />
              </button>
            );
          })}
        </div>

        {picked !== null && (
          <p
            className={`mt-4 text-sm font-bold ${correct ? "text-status-learning" : "text-destructive"}`}
          >
            {correct ? "Correct!" : `Answer: ${answer}`}
          </p>
        )}
      </div>

      {picked !== null && (
        <button
          onClick={() => onResult(correct)}
          className="min-h-12 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
        >
          Continue
        </button>
      )}
    </div>
  );
}
