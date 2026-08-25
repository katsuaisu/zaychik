import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CARD_TYPES } from "@/lib/deck-colors";
import { blankAnswers, matchingPairs, orderItems, type Pair } from "@/lib/card-data";
import type { Card } from "@/lib/queries";
import type { Json } from "@/integrations/supabase/types";

export type CardEditorInput = {
  id?: string;
  card_type: string;
  prompt: string;
  answer: string;
  data?: Json;
  position?: number;
};

const inputClass =
  "min-h-12 w-full rounded-2xl border border-border bg-background px-4 text-[15px] outline-none focus:border-brand";
const areaClass =
  "min-h-24 w-full rounded-2xl border border-border bg-background px-4 py-3 text-[15px] outline-none focus:border-brand";
const labelClass = "text-sm font-semibold text-muted-foreground";

export function CardEditorDialog({
  open,
  onOpenChange,
  card,
  defaultType,
  position,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** null when adding a new card. */
  card: Card | null;
  defaultType: string;
  position: number;
  onSave: (input: CardEditorInput) => Promise<void> | void;
}) {
  const [type, setType] = useState(defaultType);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<string[]>([""]);
  const [items, setItems] = useState<string[]>(["", ""]);
  const [pairs, setPairs] = useState<Pair[]>([
    { left: "", right: "" },
    { left: "", right: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the card being edited (or reset for a fresh card) each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    if (card) {
      setType(card.card_type);
      setPrompt(card.prompt);
      setAnswer(card.answer);
      const a = blankAnswers(card);
      setAnswers(a.length ? a : [""]);
      const o = orderItems(card);
      setItems(o.length ? o : ["", ""]);
      const p = matchingPairs(card);
      setPairs(p.length ? p : [{ left: "", right: "" }, { left: "", right: "" }]);
    } else {
      setType(defaultType);
      setPrompt("");
      setAnswer("");
      setAnswers([""]);
      setItems(["", ""]);
      setPairs([
        { left: "", right: "" },
        { left: "", right: "" },
      ]);
    }
  }, [open, card, defaultType]);

  function validate(): string | null {
    if (type === "classic") {
      if (!prompt.trim()) return "Add the question shown on the front of the card.";
      if (!answer.trim()) return "Add the answer shown on the back of the card.";
      return null;
    }
    if (type === "blanks") {
      if (!prompt.trim()) return "Write the sentence and mark each blank with ___.";
      const filled = answers.map((a) => a.trim()).filter(Boolean);
      if (filled.length === 0) return "Add at least one accepted answer.";
      const blanks = prompt.split(/_{2,}/g).length - 1;
      if (blanks === 0) return "Mark at least one blank in the sentence using ___.";
      if (blanks !== filled.length)
        return `The sentence has ${blanks} blank(s) but ${filled.length} answer(s).`;
      return null;
    }
    if (type === "order") {
      if (!prompt.trim()) return "Add the instruction shown above the steps.";
      if (items.map((i) => i.trim()).filter(Boolean).length < 2)
        return "Add at least two steps in their correct order.";
      return null;
    }
    if (!prompt.trim()) return "Add the instruction shown above the columns.";
    if (pairs.filter((p) => p.left.trim() && p.right.trim()).length < 2)
      return "Add at least two complete pairs.";
    return null;
  }

  async function submit() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    let data: Json = {};
    let finalAnswer = answer.trim();

    if (type === "blanks") {
      const filled = answers.map((a) => a.trim()).filter(Boolean);
      data = { answers: filled };
      finalAnswer = filled.join(", ");
    } else if (type === "order") {
      const filled = items.map((i) => i.trim()).filter(Boolean);
      data = { items: filled };
      finalAnswer = filled.join(" → ");
    } else if (type === "matching") {
      const filled = pairs
        .map((p) => ({ left: p.left.trim(), right: p.right.trim() }))
        .filter((p) => p.left && p.right);
      data = { pairs: filled };
      finalAnswer = filled.map((p) => `${p.left} = ${p.right}`).join(" · ");
    }

    setSaving(true);
    try {
      await onSave({
        ...(card ? { id: card.id } : {}),
        card_type: type,
        prompt: prompt.trim(),
        answer: finalAnswer,
        data,
        ...(card ? {} : { position }),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this card.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-soft max-h-[90vh] max-w-lg gap-5 overflow-y-auto border-border bg-card p-6 sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold tracking-tight">
            {card ? "Edit card" : "New card"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <label htmlFor="card-type" className={labelClass}>
            Study type
          </label>
          <select
            id="card-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputClass}
          >
            {CARD_TYPES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="card-prompt" className={labelClass}>
            {type === "classic"
              ? "Front (question)"
              : type === "blanks"
                ? "Sentence — write ___ for each blank"
                : type === "order"
                  ? "Instruction"
                  : "Instruction"}
          </label>
          <textarea
            id="card-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              type === "blanks"
                ? "Mitosis produces ___ identical cells."
                : type === "order"
                  ? "Put the stages of mitosis in order."
                  : type === "matching"
                    ? "Match each term with its definition."
                    : "What is Newton's second law?"
            }
            className={areaClass}
          />
        </div>

        {type === "classic" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="card-answer" className={labelClass}>
              Back (answer)
            </label>
            <textarea
              id="card-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Force equals mass times acceleration."
              className={areaClass}
            />
          </div>
        )}

        {type === "blanks" && (
          <div className="flex flex-col gap-2">
            <span className={labelClass}>Accepted answers (one per blank, in order)</span>
            {answers.map((value, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={value}
                  onChange={(e) =>
                    setAnswers((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
                  }
                  placeholder={`Answer for blank ${i + 1}`}
                  className={inputClass}
                />
                {answers.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Remove answer ${i + 1}`}
                    onClick={() => setAnswers((prev) => prev.filter((_, j) => j !== i))}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-destructive press hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAnswers((prev) => [...prev, ""])}
              className="mt-1 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60"
            >
              <Plus className="h-4 w-4" /> Add blank
            </button>
            <p className="text-xs text-muted-foreground">
              Answers are checked case-insensitively and ignore extra spaces.
            </p>
          </div>
        )}

        {type === "order" && (
          <div className="flex flex-col gap-2">
            <span className={labelClass}>Steps in their correct order</span>
            {items.map((value, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-sm font-bold text-muted-foreground">
                  {i + 1}.
                </span>
                <input
                  value={value}
                  onChange={(e) =>
                    setItems((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
                  }
                  placeholder={`Step ${i + 1}`}
                  className={inputClass}
                />
                {items.length > 2 && (
                  <button
                    type="button"
                    aria-label={`Remove step ${i + 1}`}
                    onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-destructive press hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setItems((prev) => [...prev, ""])}
              className="mt-1 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60"
            >
              <Plus className="h-4 w-4" /> Add step
            </button>
          </div>
        )}

        {type === "matching" && (
          <div className="flex flex-col gap-2">
            <span className={labelClass}>Pairs</span>
            {pairs.map((pair, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={pair.left}
                  onChange={(e) =>
                    setPairs((prev) =>
                      prev.map((p, j) => (j === i ? { ...p, left: e.target.value } : p)),
                    )
                  }
                  placeholder="Term"
                  className={inputClass}
                />
                <input
                  value={pair.right}
                  onChange={(e) =>
                    setPairs((prev) =>
                      prev.map((p, j) => (j === i ? { ...p, right: e.target.value } : p)),
                    )
                  }
                  placeholder="Match"
                  className={inputClass}
                />
                {pairs.length > 2 && (
                  <button
                    type="button"
                    aria-label={`Remove pair ${i + 1}`}
                    onClick={() => setPairs((prev) => prev.filter((_, j) => j !== i))}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border text-destructive press hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPairs((prev) => [...prev, { left: "", right: "" }])}
              className="mt-1 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60"
            >
              <Plus className="h-4 w-4" /> Add pair
            </button>
          </div>
        )}

        {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="min-h-12 rounded-full border border-border bg-card px-5 text-[15px] font-bold press hover:bg-muted/60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="min-h-12 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving…" : card ? "Save changes" : "Add card"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
