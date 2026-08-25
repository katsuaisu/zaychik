import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, Pencil, Play, Plus, Trash2 } from "lucide-react";
import {
  useCards,
  useDeck,
  useDeleteCard,
  useDeleteDeck,
  useMoveCard,
  useSaveCard,
  useSubjects,
  useUpdateDeck,
  type Card as DeckCardRow,
} from "@/lib/queries";
import { CARD_STATUS, CARD_TYPES, DECK_COLORS, colorHex } from "@/lib/deck-colors";
import { blankAnswers, matchingPairs, orderItems } from "@/lib/card-data";
import { CardEditorDialog } from "@/components/CardEditorDialog";

export const Route = createFileRoute("/_authenticated/decks/$deckId")({
  head: () => ({
    meta: [
      { title: "Edit deck — Gizmo Study" },
      {
        name: "description",
        content: "Add, edit, reorder and delete flashcards, and tune your deck settings.",
      },
      { property: "og:title", content: "Edit deck — Gizmo Study" },
      { property: "og:description", content: "Manage the cards inside your study deck." },
    ],
  }),
  component: DeckEditor,
});

function cardSummary(card: DeckCardRow): string {
  if (card.card_type === "order") return orderItems(card).join(" → ");
  if (card.card_type === "matching")
    return matchingPairs(card)
      .map((p) => `${p.left} = ${p.right}`)
      .join(" · ");
  if (card.card_type === "blanks") return blankAnswers(card).join(", ");
  return card.answer;
}

function DeckEditor() {
  const { deckId } = Route.useParams();
  const { data: deck, isLoading } = useDeck(deckId);
  const { data: cards } = useCards(deckId);
  const { data: subjects } = useSubjects();
  const updateDeck = useUpdateDeck();
  const deleteDeck = useDeleteDeck();
  const deleteCard = useDeleteCard(deckId);
  const moveCard = useMoveCard(deckId);
  const saveCard = useSaveCard(deckId);

  const [editing, setEditing] = useState<DeckCardRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const list = cards ?? [];
  const accent = colorHex(deck?.color);

  function reorder(from: number, to: number) {
    if (to < 0 || to >= list.length || from === to) return;
    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    moveCard.mutate(next.map((c, i) => ({ id: c.id, position: i })));
  }

  if (isLoading || !deck) {
    return <p className="p-8 text-sm text-muted-foreground">Loading deck…</p>;
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        to="/decks"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground press hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to my decks
      </Link>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="h-6 w-6 shrink-0 rounded-lg"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-extrabold tracking-tight">{deck.name}</h1>
            <p className="text-sm text-muted-foreground">
              {list.length} {list.length === 1 ? "card" : "cards"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/study/$deckId"
            params={{ deckId }}
            className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
          >
            <Play className="h-4 w-4" /> Study
          </Link>
          <button
            onClick={() => setAdding(true)}
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border px-5 text-[15px] font-bold press hover:bg-muted/60"
          >
            <Plus className="h-5 w-5" /> Add card
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Deck settings */}
        <section className="card-soft h-fit p-5">
          <h2 className="text-lg font-extrabold tracking-tight">Deck settings</h2>

          <label className="mt-4 block text-sm font-semibold text-muted-foreground">Name</label>
          <input
            defaultValue={deck.name}
            onBlur={(e) => {
              const value = e.target.value.trim();
              if (value && value !== deck.name) updateDeck.mutate({ id: deckId, name: value });
            }}
            className="mt-1 min-h-11 w-full rounded-2xl border border-border px-3 text-[15px] font-semibold outline-none focus:border-brand"
          />

          <p className="mt-4 text-sm font-semibold text-muted-foreground">Tag color</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DECK_COLORS.map((c) => (
              <button
                key={c.key}
                aria-label={c.label}
                onClick={() => updateDeck.mutate({ id: deckId, color: c.key })}
                className="h-10 w-10 rounded-xl press"
                style={{
                  backgroundColor: c.hex,
                  outline: deck.color === c.key ? "3px solid var(--brand)" : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>

          <label className="mt-4 block text-sm font-semibold text-muted-foreground">Subject</label>
          <select
            value={deck.subject_id ?? ""}
            onChange={(e) => updateDeck.mutate({ id: deckId, subject_id: e.target.value || null })}
            className="mt-1 min-h-11 w-full rounded-2xl border border-border bg-card px-3 text-[15px] font-semibold outline-none focus:border-brand"
          >
            <option value="">No subject</option>
            {(subjects ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <label className="mt-4 block text-sm font-semibold text-muted-foreground">
            Default card type
          </label>
          <select
            value={deck.default_type}
            onChange={(e) => updateDeck.mutate({ id: deckId, default_type: e.target.value })}
            className="mt-1 min-h-11 w-full rounded-2xl border border-border bg-card px-3 text-[15px] font-semibold outline-none focus:border-brand"
          >
            {CARD_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>

          <label className="mt-4 flex min-h-11 items-center justify-between gap-3 text-sm font-semibold">
            <span>Public deck</span>
            <input
              type="checkbox"
              checked={deck.is_public}
              onChange={(e) => updateDeck.mutate({ id: deckId, is_public: e.target.checked })}
              className="h-5 w-5 accent-[var(--brand)]"
            />
          </label>

          <button
            onClick={() => {
              if (confirm(`Delete "${deck.name}" and all of its cards?`)) {
                deleteDeck.mutate(deckId, {
                  onSuccess: () => {
                    window.location.href = "/decks";
                  },
                });
              }
            }}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-destructive px-4 text-sm font-bold text-destructive press hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Delete deck
          </button>
        </section>

        {/* Cards */}
        <section className="flex flex-col gap-3">
          {list.length === 0 && (
            <div className="card-soft p-10 text-center">
              <h2 className="text-xl font-extrabold">No cards yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your first card to start studying this deck.
              </p>
              <button
                onClick={() => setAdding(true)}
                className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90"
              >
                <Plus className="h-5 w-5" /> Add card
              </button>
            </div>
          )}

          {list.map((card, i) => {
            const status = CARD_STATUS[(card.status as keyof typeof CARD_STATUS) ?? "new"] ?? CARD_STATUS.new;
            return (
              <article
                key={card.id}
                draggable
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null) reorder(dragIndex, i);
                  setDragIndex(null);
                }}
                className="card-soft flex items-start gap-3 p-4"
              >
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    aria-label="Move card up"
                    onClick={() => reorder(i, i - 1)}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border press hover:bg-muted/60"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Move card down"
                    onClick={() => reorder(i, i + 1)}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border press hover:bg-muted/60"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                      style={{ backgroundColor: `${accent}33` }}
                    >
                      {CARD_TYPES.find((t) => t.key === card.card_type)?.label ?? card.card_type}
                    </span>
                    <span className={`text-xs font-bold ${status.className}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  <p className="mt-2 text-[15px] font-extrabold leading-snug">{card.prompt}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {cardSummary(card)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-1">
                  <button
                    aria-label="Edit card"
                    onClick={() => setEditing(card)}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-border press hover:bg-muted/60"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Delete card"
                    onClick={() => {
                      if (confirm("Delete this card?")) deleteCard.mutate(card.id);
                    }}
                    className="grid h-10 w-10 place-items-center rounded-xl border border-border text-destructive press hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      </div>

      <CardEditorDialog
        open={adding || editing !== null}
        onOpenChange={(v) => {
          if (!v) {
            setAdding(false);
            setEditing(null);
          }
        }}
        card={editing}
        defaultType={deck.default_type}
        position={list.length}
        onSave={async (input) => {
          await saveCard.mutateAsync(input);
          setAdding(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
