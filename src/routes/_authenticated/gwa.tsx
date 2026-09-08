import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, Trophy } from "lucide-react";
import {
  BAND_CLASS,
  GRADE_SCALE,
  GRADE_VALUES,
  fmt,
  gradeBand,
  honorFor,
  quarterGrade,
  weightedGwa,
} from "@/lib/gwa";
import {
  useAddSubject,
  useDeleteSubject,
  useGrades,
  useSaveGrade,
  useSubjects,
  useUpdateSubject,
  type QuarterGrade,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/gwa")({
  head: () => ({
    meta: [
      { title: "GWA Calculator — Zaychik" },
      {
        name: "description",
        content:
          "Compute your quarterly GWA with unit weights, fixed grade choices and automatic transmutation.",
      },
      { property: "og:title", content: "GWA Calculator — Zaychik" },
      {
        property: "og:description",
        content: "Quarterly GWA with unit weights and automatic grade computation.",
      },
    ],
  }),
  component: GwaPage,
});

const QUARTERS = [1, 2, 3, 4] as const;

function key(subjectId: string, quarter: number) {
  return `${subjectId}:${quarter}`;
}

function GwaPage() {
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(1);
  const { data: subjects } = useSubjects();
  const { data: grades } = useGrades();
  const saveGrade = useSaveGrade();
  const addSubject = useAddSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();
  const [newName, setNewName] = useState("");

  const byKey = useMemo(() => {
    const map = new Map<string, QuarterGrade>();
    for (const g of grades ?? []) map.set(key(g.subject_id, g.quarter), g);
    return map;
  }, [grades]);

  /** Q1 grade is entered directly; later quarters chain off the previous quarter grade. */
  const gradeFor = useMemo(() => {
    const cache = new Map<string, number | null>();
    function compute(subjectId: string, q: number): number | null {
      const k = key(subjectId, q);
      if (cache.has(k)) return cache.get(k) ?? null;
      const record = byKey.get(k);
      let value: number | null;
      if (q === 1) {
        value = record?.previous_grade ?? null;
      } else {
        value = quarterGrade(compute(subjectId, q - 1), record?.tentative_grade ?? null);
      }
      cache.set(k, value);
      return value;
    }
    return compute;
  }, [byKey]);

  const rows = (subjects ?? []).map((subject) => ({
    subject,
    record: byKey.get(key(subject.id, quarter)),
    previous: quarter === 1 ? null : gradeFor(subject.id, quarter - 1),
    grade: gradeFor(subject.id, quarter),
  }));

  const quarterGwaValue = weightedGwa(
    rows.map((r) => ({ grade: r.grade, units: r.subject.units })),
  );
  const honor = honorFor(quarterGwaValue);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">GWA Calculator</h1>
      <p className="text-sm text-muted-foreground">
        Q1 uses your grade directly. Q2–Q4 = ((Tentative × 2) + Previous quarter) ÷ 3, transmuted
        automatically. GWA is weighted by units.
      </p>

      <div className="mt-5 flex gap-2 overflow-x-auto rounded-full bg-muted p-1">
        {QUARTERS.map((q) => (
          <button
            key={q}
            onClick={() => setQuarter(q)}
            className={`min-h-11 flex-1 rounded-full px-4 text-sm font-bold press ${
              quarter === q ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Q{q}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[20rem_1fr]">
        <aside className="flex flex-col gap-4">
          <div className="card-soft p-5">
            <p className="text-sm font-semibold text-muted-foreground">Q{quarter} GWA</p>
            <p className="text-5xl font-extrabold tracking-tight">{fmt(quarterGwaValue)}</p>
            {quarterGwaValue != null && (
              <span
                className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                  BAND_CLASS[gradeBand(quarterGwaValue)]
                }`}
              >
                {gradeBand(quarterGwaValue).toUpperCase()}
              </span>
            )}
            {honor && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-status-mastered/15 px-3 py-1 text-xs font-bold text-status-mastered">
                <Trophy className="h-4 w-4" /> {honor}
              </p>
            )}
          </div>

          <div className="card-soft p-5">
            <p className="mb-2 text-sm font-semibold text-muted-foreground">Grade scale</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-medium">
              {GRADE_SCALE.map((row) => (
                <li key={row.grade} className="flex justify-between">
                  <span className="text-muted-foreground">{row.range}</span>
                  <span className="font-bold">{row.grade}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="card-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] text-sm">
              <thead className="bg-muted/60 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Units</th>
                  {quarter === 1 ? (
                    <th className="px-4 py-3">Grade</th>
                  ) : (
                    <>
                      <th className="px-4 py-3">Previous (Q{quarter - 1})</th>
                      <th className="px-4 py-3">Tentative</th>
                    </>
                  )}
                  <th className="px-4 py-3">Quarter grade</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ subject, record, previous, grade }) => (
                  <tr key={subject.id} className="border-t border-border">
                    <td className="px-4 py-2">
                      <input
                        defaultValue={subject.name}
                        onBlur={(e) => {
                          const name = e.target.value.trim();
                          if (name && name !== subject.name)
                            updateSubject.mutate({ id: subject.id, name });
                        }}
                        className="min-h-10 w-40 rounded-xl border border-transparent px-2 font-semibold outline-none hover:border-border focus:border-brand"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        defaultValue={subject.units}
                        onBlur={(e) => {
                          const units = Number(e.target.value);
                          if (units > 0 && units !== subject.units)
                            updateSubject.mutate({ id: subject.id, units });
                        }}
                        className="min-h-10 w-20 rounded-xl border border-border px-2 outline-none focus:border-brand"
                      />
                    </td>

                    {quarter === 1 ? (
                      <td className="px-4 py-2">
                        <GradeSelect
                          value={record?.previous_grade ?? null}
                          onChange={(value) =>
                            saveGrade.mutate({
                              subject_id: subject.id,
                              quarter,
                              previous_grade: value,
                            })
                          }
                        />
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-2">
                          <span className="text-sm font-bold text-muted-foreground">
                            {fmt(previous)}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <GradeSelect
                            value={record?.tentative_grade ?? null}
                            onChange={(value) =>
                              saveGrade.mutate({
                                subject_id: subject.id,
                                quarter,
                                tentative_grade: value,
                              })
                            }
                          />
                        </td>
                      </>
                    )}

                    <td className="px-4 py-2">
                      {grade == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                            BAND_CLASS[gradeBand(grade)]
                          }`}
                        >
                          {grade.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        aria-label={`Delete ${subject.name}`}
                        onClick={() => deleteSubject.mutate(subject.id)}
                        className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground press hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border p-4">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Add a subject…"
              className="min-h-11 flex-1 rounded-2xl border border-border px-3 text-sm outline-none focus:border-brand"
            />
            <button
              onClick={() => {
                const name = newName.trim();
                if (!name) return;
                addSubject.mutate({ name, position: subjects?.length ?? 0 });
                setNewName("");
              }}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-bold text-brand-foreground press hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add subject
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function GradeSelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className="min-h-10 w-28 rounded-xl border border-border px-2 font-semibold outline-none focus:border-brand"
    >
      <option value="">—</option>
      {GRADE_VALUES.map((g) => (
        <option key={g} value={g}>
          {g.toFixed(2)}
        </option>
      ))}
    </select>
  );
}
