import type { Card } from "./queries";

/** Answers accepted for a fill-in-the-blanks card, in blank order. */
export function blankAnswers(card: Pick<Card, "answer" | "data">): string[] {
  const raw = (card.data as { answers?: unknown })?.answers;
  if (Array.isArray(raw)) return raw.map((a) => String(a));
  return card.answer
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
}

/** Correct sequence for an "order the events" card. */
export function orderItems(card: Pick<Card, "data">): string[] {
  const raw = (card.data as { items?: unknown })?.items;
  return Array.isArray(raw) ? raw.map((i) => String(i)) : [];
}

export type Pair = { left: string; right: string };

/** Term/definition pairs for a matching card. */
export function matchingPairs(card: Pick<Card, "data">): Pair[] {
  const raw = (card.data as { pairs?: unknown })?.pairs;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      const o = p as { left?: unknown; right?: unknown };
      return { left: String(o?.left ?? ""), right: String(o?.right ?? "") };
    })
    .filter((p) => p.left && p.right);
}

export function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/** Splits a blanks sentence into text chunks around each "___" blank. */
export function splitBlanks(prompt: string): string[] {
  return prompt.split(/_{2,}/g);
}
