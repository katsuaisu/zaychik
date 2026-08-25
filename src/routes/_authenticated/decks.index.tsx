import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { DeckCard, DeckGrid } from "@/components/DeckCard";
import { NewDeckDialog } from "@/components/NewDeckDialog";
import { useDecks } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/decks/")({
  head: () => ({
    meta: [
      { title: "My decks — Gizmo Study" },
      {
        name: "description",
        content: "Your flashcard library: create decks, edit cards and start a study session.",
      },
      { property: "og:title", content: "My decks — Gizmo Study" },
      { property: "og:description", content: "Your flashcard library in Gizmo Study." },
    ],
  }),
  component: DecksPage,
});

function DecksPage() {
  const { data: decks, isLoading } = useDecks();
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My decks</h1>
          <p className="text-sm text-muted-foreground">
            {decks?.length ?? 0} {decks?.length === 1 ? "deck" : "decks"} in your library
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
        >
          <Plus className="h-5 w-5" /> New deck
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your decks…</p>
      ) : (decks ?? []).length === 0 ? (
        <div className="card-soft p-10 text-center">
          <h2 className="text-xl font-extrabold">No decks yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first deck and start adding cards.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
          >
            <Plus className="h-5 w-5" /> New deck
          </button>
        </div>
      ) : (
        <DeckGrid>
          {(decks ?? []).map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </DeckGrid>
      )}

      <NewDeckDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
