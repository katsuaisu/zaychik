import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import type { Card } from "@/lib/queries";
import { orderItems, shuffle } from "@/lib/card-data";
import { playSound } from "@/lib/sounds";

export function OrderCard({
  card,
  accent,
  onResult,
}: {
  card: Card;
  accent: string;
  onResult: (correct: boolean) => void;
}) {
  const correctOrder = orderItems(card);
  const [items, setItems] = useState<string[]>(() => shuffle(correctOrder));
  const [checked, setChecked] = useState<boolean | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    setItems(shuffle(orderItems(card)));
    setChecked(null);
  }, [card.id]);

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length || checked !== null) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved!);
      return next;
    });
  }

  function check() {
    const correct = items.every((item, i) => item === correctOrder[i]);
    setChecked(correct);
    playSound(correct ? "correct" : "wrong");
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        className="card-soft px-5 py-6 animate-card-in sm:px-6 sm:py-8"
        style={{ borderColor: checked === null ? undefined : accent }}
      >
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Order the events
        </p>
        <p className="mt-3 text-lg font-extrabold leading-snug sm:text-xl">
          {card.prompt || "Put these in the correct order"}
        </p>

        <ol className="mt-5 flex flex-col gap-2">
          {items.map((item, i) => (
            <li
              key={item + i}
              draggable={checked === null}
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
              className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5"
              style={
                checked === false && item !== correctOrder[i]
                  ? { borderColor: "var(--destructive)" }
                  : undefined
              }
            >
              <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-black">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-semibold">{item}</span>
              <div className="flex shrink-0 gap-1">
                <button
                  aria-label="Move up"
                  onClick={() => move(i, i - 1)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border press hover:bg-muted/60"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  aria-label="Move down"
                  onClick={() => move(i, i + 1)}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-border press hover:bg-muted/60"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>

        {checked === false && (
          <p className="mt-4 text-sm font-bold text-destructive">
            Correct order: {correctOrder.join(" → ")}
          </p>
        )}
        {checked === true && (
          <p className="mt-4 text-sm font-bold text-status-learning">Perfect sequence!</p>
        )}
      </div>

      {checked === null ? (
        <button
          onClick={check}
          className="min-h-12 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
        >
          Check order
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
