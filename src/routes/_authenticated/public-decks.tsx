import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Globe, Loader2, Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { DeckCard, DeckGrid } from "@/components/DeckCard";
import { usePublicDecks, useCopyDeck } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/public-decks")({
  head: () => ({
    meta: [
      { title: "Public decks — Gizmo Study" },
      {
        name: "description",
        content:
          "Browse flashcard decks shared by other students and copy any of them into your own library.",
      },
      { property: "og:title", content: "Public decks — Gizmo Study" },
      {
        property: "og:description",
        content: "Browse shared flashcard decks and copy them into your library.",
      },
    ],
  }),
  component: PublicDecksPage,
});

function PublicDecksPage() {
  const { data: decks, isLoading } = usePublicDecks();
  const copyDeck = useCopyDeck();
  const navigate = useNavigate();
  const [copyingId, setCopyingId] = useState<string | null>(null);

  async function copy(deckId: string, name: string) {
    setCopyingId(deckId);
    try {
      await copyDeck.mutateAsync(deckId);
      toast.success(`"${name}" copied to your decks`, {
        action: { label: "View", onClick: () => navigate({ to: "/decks" }) },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not copy that deck");
    } finally {
      setCopyingId(null);
    }
  }

  const list = decks ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight">
          <Globe className="h-7 w-7 text-brand" /> Public decks
        </h1>
        <p className="text-sm text-muted-foreground">
          Decks shared by other students — copy any of them into your own library.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading public decks…</p>
      ) : list.length === 0 ? (
        <div className="card-soft p-10 text-center">
          <h2 className="text-xl font-extrabold">No public decks yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mark one of your own decks as public in the deck editor and it will show up here.
          </p>
          <Link
            to="/decks"
            className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
          >
            Go to my decks
          </Link>
        </div>
      ) : (
        <DeckGrid>
          {list.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              action={
                <>
                  <button
                    onClick={() => copy(deck.id, deck.name)}
                    disabled={copyingId === deck.id}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-sm font-bold text-brand-foreground press hover:opacity-90 disabled:opacity-60"
                  >
                    {copyingId === deck.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    Copy to my decks
                  </button>
                  <Link
                    to="/study/$deckId"
                    params={{ deckId: deck.id }}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60"
                  >
                    <Play className="h-4 w-4" /> Study
                  </Link>
                </>
              }
            />
          ))}
        </DeckGrid>
      )}
    </div>
  );
}
