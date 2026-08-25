import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
  "min-h-20 w-full rounded-2xl border border-border bg-background px-4 py-3 text-[15px] outline-none focus:border-brand";
const labelClass = "text-sm font-semibold text-muted-foreground";

/**
 * Inline card editor. Remount with a `key` (e.g. the card id) to reset the fields.
 */
export function CardEditorForm({
  card,
  defaultType,
  position,
  onSave,
  onCancel,
  autoFocus,
}: {
  /** null when adding a new card. */
  card: Card | null;
  defaultType: string;
  position: number;
  onSave: (input: CardEditorInput) => Promise<void> | void;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [type, setType] = useState(card?.card_type ?? defaultType);
  const [prompt, setPrompt] = useState(card?.prompt ?? "");
  const [answer, setAnswer] = useState(card?.answer ?? "");
  const [answers, setAnswers] = useState<string[]>(() => {
    const a = card ? blankAnswers(card) : [];
    return a.length ? a : [""];
  });
  const [items, setItems] = useState<string[]>(() => {
    const o = card ? orderItems(card) : [];
    return o.length ? o : ["", ""];
  });
  const [pairs, setPairs] = useState<Pair[]>(() => {
    const p = card ? matchingPairs(card) : [];
    return p.length ? p : [{ left: "", right: "" }, { left: "", right: "" }];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setType(defaultType);
    setPrompt("");
    setAnswer("");
    setAnswers([""]);
    setItems(["", ""]);
    setPairs([
      { left: "", right: "" },
      { left: "", right: "" },
    ]);
    setError(null);
  }

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
      if (!card) reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this card.");
    } finally {
      setSaving(false);
    }
  }

  /** Cmd/Ctrl+Enter saves from any field. */
  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <div className="flex flex-col gap-3" onKeyDown={onKeyDown}>
      <div className="flex flex-wrap gap-2">
        {CARD_TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setType(t.key);
              setError(null);
            }}
            className={`min-h-10 rounded-full px-4 text-sm font-bold press ${
              type === t.key
                ? "bg-brand text-brand-foreground"
                : "border border-border text-muted-foreground hover:bg-muted/60"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <textarea
        autoFocus={autoFocus}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={
          type === "blanks"
            ? "Mitosis produces ___ identical cells."
            : type === "order"
              ? "Put the stages of mitosis in order."
              : type === "matching"
                ? "Match each term with its definition."
                : "Front — What is Newton's second law?"
        }
        className={areaClass}
      />

      {type === "classic" && (
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Back — Force equals mass times acceleration."
          className={areaClass}
        />
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
            className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60"
          >
            <Plus className="h-4 w-4" /> Add blank
          </button>
        </div>
      )}

      {type === "order" && (
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Steps in their correct order</span>
          {items.map((value, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-sm font-bold text-muted-foreground">{i + 1}.</span>
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
            className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60"
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
            className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-border px-4 text-sm font-bold press hover:bg-muted/60"
          >
            <Plus className="h-4 w-4" /> Add pair
          </button>
        </div>
      )}

      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-brand px-5 text-[15px] font-bold text-brand-foreground press hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : card ? "Save changes" : "Add card"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-full border border-border bg-card px-5 text-[15px] font-bold press hover:bg-muted/60"
          >
            Cancel
          </button>
        )}
        <span className="text-xs text-muted-foreground">⌘/Ctrl + Enter to save</span>
      </div>
    </div>
  );
}
