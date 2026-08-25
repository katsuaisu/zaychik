export const GRADE_VALUES = [
  1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75, 3.0, 4.0, 5.0,
] as const;

export type GradeValue = (typeof GRADE_VALUES)[number];

/** Single editable honor-roll config — add higher tiers here later. */
export const HONOR_TIERS = [{ name: "Director's Lister", maxGwa: 1.5 }] as const;

/** Default: simple average of Q1–Q4. Flip to weighted by editing QUARTER_WEIGHTS. */
export const QUARTER_WEIGHTS: Record<1 | 2 | 3 | 4, number> = { 1: 1, 2: 1, 3: 1, 4: 1 };

export const GRADE_SCALE: { range: string; grade: string }[] = [
  { range: "96+", grade: "1.00" },
  { range: "90–95", grade: "1.25" },
  { range: "84–89", grade: "1.50" },
  { range: "78–83", grade: "1.75" },
  { range: "72–77", grade: "2.00" },
  { range: "66–71", grade: "2.25" },
  { range: "60–65", grade: "2.50" },
  { range: "55–59", grade: "2.75" },
  { range: "50–54", grade: "3.00" },
  { range: "40–49", grade: "4.00" },
  { range: "Below 40", grade: "5.00" },
];

export const DEFAULT_SUBJECTS = [
  "Math",
  "Research",
  "Physics",
  "Chemistry",
  "Biology",
  "CS",
  "English",
  "Filipino",
  "SocSci",
  "Full Stack",
];

export function defaultUnitsFor(name: string): number {
  return name.trim().toLowerCase() === "math" ? 1.3 : 1.0;
}

/** Round a raw computed grade to the nearest valid grade (ties → better/lower grade). */
export function transmute(raw: number): number {
  if (raw <= 1) return 1;
  if (raw >= 4.5) return 5;
  if (raw > 3) return raw < 3.5 ? 3 : 4;
  let best = GRADE_VALUES[0] as number;
  let bestDist = Infinity;
  for (const g of GRADE_VALUES) {
    if (g > 3) continue;
    const d = Math.abs(g - raw);
    if (d < bestDist - 1e-9) {
      bestDist = d;
      best = g;
    }
  }
  return best;
}

/** Quarter Grade = ((Tentative × 2) + Previous) ÷ 3, then transmuted. */
export function quarterGrade(previous: number | null, tentative: number | null): number | null {
  if (previous == null || tentative == null) return null;
  return transmute((tentative * 2 + previous) / 3);
}

export function weightedGwa(rows: { grade: number | null; units: number }[]): number | null {
  let num = 0;
  let den = 0;
  for (const r of rows) {
    if (r.grade == null) continue;
    num += r.grade * r.units;
    den += r.units;
  }
  if (den === 0) return null;
  return num / den;
}

export function honorFor(gwa: number | null): string | null {
  if (gwa == null) return null;
  for (const tier of HONOR_TIERS) {
    if (gwa <= tier.maxGwa) return tier.name;
  }
  return null;
}

export type GradeBand = "excellent" | "good" | "average" | "poor";

export function gradeBand(grade: number): GradeBand {
  if (grade <= 1.25) return "excellent";
  if (grade <= 1.75) return "good";
  if (grade <= 2.75) return "average";
  return "poor";
}

export const BAND_CLASS: Record<GradeBand, string> = {
  excellent: "bg-band-excellent/15 text-band-excellent",
  good: "bg-band-good/15 text-band-good",
  average: "bg-band-average/15 text-band-average",
  poor: "bg-band-poor/15 text-band-poor",
};

export function fmt(grade: number | null | undefined, dash = "—"): string {
  if (grade == null) return dash;
  return grade.toFixed(2);
}
