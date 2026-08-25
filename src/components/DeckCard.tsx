import { Link } from "@tanstack/react-router";
import { Layers, Play } from "lucide-react";
import { colorHex, CARD_TYPES } from "@/lib/deck-colors";
import type { Deck } from "@/lib/queries";

export type DeckWithCount = Deck & { count: number };

function typeLabel(key: string) {
  return CARD_TYPES.find((t) => t.key === key)?.label ?? "Classic flashcard";
}

export function DeckCard({
  deck,
  action,
}: {
  deck: DeckWithCount;
  /** Optional footer action, e.g. "Copy to my decks" on public decks. */
  action?: React.ReactNode;
}) {
  const hex = colorHex(deck.color);

  return (
    <div className="card-soft flex flex-col overflow-hidden animate-card-in">
      <div className="h-2 w-full" style={{ backgroundColor: hex }} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 h-4 w-4 shrink-0 rounded-[5px]"
            style={{ backgroundColor: hex }}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-extrabold tracking-tight">{deck.name}</h3>
            <p className="text-sm text-muted-foreground">{typeLabel(deck.default_type)}</p>
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
          <Layers className="h-4 w-4" />
          {deck.count} {deck.count === 1 ? "card" : "cards"}
          {deck.is_public && (
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-bold">Public</span>
          )}
        </p>

        <div className="mt-auto flex flex-wrap gap-2 pt-2">
          {action ?? (
            <>
              <Link
                to="/study/$deckId"
                params={{ deckId: deck.id }}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-sm font-bold text-brand-foreground press hover:opacity-90"
              >
                <Play className="h-4 w-4" /> Study
              </Link>
              <Link
                to="/decks/$deckId"
                params={{ deckId: deck.id }}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60"
              >
                Edit
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function DeckGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
  );
}
