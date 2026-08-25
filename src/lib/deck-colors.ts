export const DECK_COLORS = [
  { key: "pink", label: "Pink", hex: "#F472B6" },
  { key: "orange", label: "Orange", hex: "#F97316" },
  { key: "coral", label: "Coral", hex: "#F0555A" },
  { key: "purple", label: "Purple", hex: "#B794F6" },
  { key: "teal", label: "Mint", hex: "#5EEAD4" },
  { key: "periwinkle", label: "Periwinkle", hex: "#818CF8" },
] as const;

export type DeckColorKey = (typeof DECK_COLORS)[number]["key"];

export function colorHex(key: string | null | undefined): string {
  return DECK_COLORS.find((c) => c.key === key)?.hex ?? "#F472B6";
}

export function colorForIndex(i: number): DeckColorKey {
  return (DECK_COLORS[i % DECK_COLORS.length]?.key ?? "pink") as DeckColorKey;
}

export const CARD_TYPES = [
  { key: "classic", label: "Classic flashcard" },
  { key: "blanks", label: "Fill in the blanks" },
  { key: "order", label: "Order the events" },
  { key: "matching", label: "Matching type" },
] as const;

export type CardType = (typeof CARD_TYPES)[number]["key"];

export const CARD_STATUS = {
  new: { label: "New", icon: "🔵", className: "text-status-new" },
  learning: { label: "Learning", icon: "🌱", className: "text-status-learning" },
  forgotten: { label: "Forgotten", icon: "❓", className: "text-status-forgotten" },
  mastered: { label: "Mastered", icon: "🏆", className: "text-status-mastered" },
} as const;

export type CardStatus = keyof typeof CARD_STATUS;
