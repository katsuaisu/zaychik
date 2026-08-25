import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DECK_COLORS, CARD_TYPES, type DeckColorKey } from "@/lib/deck-colors";
import { useCreateDeck, useSubjects } from "@/lib/queries";

export function NewDeckDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<DeckColorKey>("pink");
  const [subjectId, setSubjectId] = useState<string>("");
  const [type, setType] = useState<string>("classic");
  const { data: subjects } = useSubjects();
  const createDeck = useCreateDeck();
  const navigate = useNavigate();

  function reset() {
    setName("");
    setColor("pink");
    setSubjectId("");
    setType("classic");
  }

  async function save(thenEdit: boolean) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = await createDeck.mutateAsync({
      name: trimmed,
      color,
      subject_id: subjectId || null,
      default_type: type,
    });
    reset();
    onOpenChange(false);
    if (thenEdit) navigate({ to: "/decks/$deckId", params: { deckId: id } });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="card-soft max-w-md gap-5 border-border bg-card p-6 sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold tracking-tight">New deck</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <label htmlFor="deck-name" className="text-sm font-semibold text-muted-foreground">
            Deck name
          </label>
          <input
            id="deck-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Physics — Kinematics"
            className="min-h-12 rounded-2xl border border-border bg-background px-4 text-[15px] outline-none focus:border-brand"
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Tag color</span>
          <div className="flex flex-wrap gap-3">
            {DECK_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                aria-label={c.label}
                aria-pressed={color === c.key}
                onClick={() => setColor(c.key)}
                className={`h-10 w-10 rounded-full press ${
                  color === c.key ? "ring-2 ring-brand ring-offset-2" : ""
                }`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="deck-subject" className="text-sm font-semibold text-muted-foreground">
              Subject (optional)
            </label>
            <select
              id="deck-subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="min-h-12 rounded-2xl border border-border bg-background px-3 text-[15px] outline-none focus:border-brand"
            >
              <option value="">No subject</option>
              {(subjects ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="deck-type" className="text-sm font-semibold text-muted-foreground">
              Default card type
            </label>
            <select
              id="deck-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="min-h-12 rounded-2xl border border-border bg-background px-3 text-[15px] outline-none focus:border-brand"
            >
              {CARD_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => save(false)}
            disabled={!name.trim() || createDeck.isPending}
            className="min-h-12 rounded-full border border-border bg-card px-5 text-[15px] font-bold press hover:bg-muted/60 disabled:opacity-50"
          >
            Save empty
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={!name.trim() || createDeck.isPending}
            className="min-h-12 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90 disabled:opacity-50"
          >
            Save &amp; add cards
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
