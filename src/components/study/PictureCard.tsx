import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import type { Card } from "@/lib/queries";
import { pictureImage, pictureMasks } from "@/lib/card-data";
import { CardImage } from "@/components/CardImage";
import { playSound } from "@/lib/sounds";

export function PictureCard({
  card,
  accent,
  onResult,
}: {
  card: Card;
  accent: string;
  onResult: (correct: boolean) => void;
}) {
  const image = pictureImage(card);
  const masks = pictureMasks(card);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setRevealed([]);
    setFlipped(false);
  }, [card.id]);

  const allRevealed = masks.length > 0 && revealed.length === masks.length;
  const showAnswer = masks.length > 0 ? allRevealed : flipped;

  return (
    <div className="flex flex-col gap-5">
      <div className="card-soft p-4 animate-card-in" style={{ borderColor: showAnswer ? accent : undefined }}>
        {card.prompt && (
          <p className="mb-3 text-lg font-extrabold leading-snug sm:text-xl">{card.prompt}</p>
        )}

        <div className="relative w-full overflow-hidden rounded-2xl">
          <CardImage path={image} alt={card.prompt || "Flashcard picture"} className="block w-full" />
          {masks.map((m, i) =>
            revealed.includes(i) ? null : (
              <button
                key={i}
                aria-label={`Reveal covered area ${i + 1}`}
                onClick={() => {
                  playSound("flip");
                  setRevealed((prev) => [...prev, i]);
                }}
                className="absolute grid place-items-center rounded-md border-2 press"
                style={{
                  left: `${m.x * 100}%`,
                  top: `${m.y * 100}%`,
                  width: `${m.w * 100}%`,
                  height: `${m.h * 100}%`,
                  backgroundColor: accent,
                  borderColor: accent,
                }}
              >
                <Eye className="h-4 w-4 text-white/90" />
              </button>
            ),
          )}
        </div>

        {masks.length > 0 ? (
          <p className="mt-3 text-sm font-semibold text-muted-foreground">
            {allRevealed
              ? "All covered parts revealed"
              : `Tap a covered part to reveal it (${revealed.length}/${masks.length})`}
          </p>
        ) : (
          <button
            onClick={() => {
              playSound("flip");
              setFlipped((v) => !v);
            }}
            className="mt-3 min-h-11 rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60"
          >
            {flipped ? "Hide answer" : "Show answer"}
          </button>
        )}

        {showAnswer && card.answer && (
          <p className="mt-3 text-[15px] font-extrabold leading-snug">{card.answer}</p>
        )}
      </div>

      {showAnswer ? (
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
          Recall what is hidden before you reveal it
        </p>
      )}
    </div>
  );
}
