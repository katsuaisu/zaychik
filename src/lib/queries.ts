import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { defaultUnitsFor } from "./gwa";

export type Subject = {
  id: string;
  name: string;
  units: number;
  position: number;
};

export type QuarterGrade = {
  id: string;
  subject_id: string;
  quarter: number;
  final_grade: number | null;
  previous_grade: number | null;
  tentative_grade: number | null;
};

export type Deck = {
  id: string;
  name: string;
  color: string;
  subject_id: string | null;
  default_type: string;
  is_public: boolean;
  created_at: string;
};

export type Card = {
  id: string;
  deck_id: string;
  card_type: string;
  prompt: string;
  answer: string;
  data: Record<string, unknown>;
  position: number;
  status: string;
};

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not signed in");
  return data.user.id;
}

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async (): Promise<Subject[]> => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id,name,units,position")
        .order("position");
      if (error) throw error;
      return (data ?? []).map((s) => ({ ...s, units: Number(s.units) }));
    },
  });
}

export function useGrades() {
  return useQuery({
    queryKey: ["quarter_grades"],
    queryFn: async (): Promise<QuarterGrade[]> => {
      const { data, error } = await supabase
        .from("quarter_grades")
        .select("id,subject_id,quarter,final_grade,previous_grade,tentative_grade");
      if (error) throw error;
      return (data ?? []).map((g) => ({
        ...g,
        final_grade: g.final_grade == null ? null : Number(g.final_grade),
        previous_grade: g.previous_grade == null ? null : Number(g.previous_grade),
        tentative_grade: g.tentative_grade == null ? null : Number(g.tentative_grade),
      }));
    },
  });
}

export function useSaveGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      subject_id: string;
      quarter: number;
      final_grade?: number | null;
      previous_grade?: number | null;
      tentative_grade?: number | null;
    }) => {
      const user_id = await uid();
      const { error } = await supabase
        .from("quarter_grades")
        .upsert({ ...input, user_id }, { onConflict: "subject_id,quarter" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quarter_grades"] }),
  });
}

export function useAddSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; units?: number; position: number }) => {
      const user_id = await uid();
      const { error } = await supabase.from("subjects").insert({
        user_id,
        name: input.name,
        units: input.units ?? defaultUnitsFor(input.name),
        position: input.position,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useUpdateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name?: string; units?: number }) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from("subjects").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["quarter_grades"] });
    },
  });
}

export function useDecks() {
  return useQuery({
    queryKey: ["decks"],
    queryFn: async (): Promise<(Deck & { count: number })[]> => {
      const { data, error } = await supabase
        .from("decks")
        .select("id,name,color,subject_id,default_type,is_public,created_at,cards(count)")
        .order("created_at");
      if (error) throw error;
      return (data ?? []).map((d) => {
        const { cards, ...deck } = d as typeof d & { cards: { count: number }[] };
        return { ...(deck as Deck), count: cards?.[0]?.count ?? 0 };
      });
    },
  });
}

export function usePublicDecks() {
  return useQuery({
    queryKey: ["public_decks"],
    queryFn: async (): Promise<(Deck & { count: number })[]> => {
      const { data, error } = await supabase
        .from("decks")
        .select("id,name,color,subject_id,default_type,is_public,created_at,cards(count)")
        .eq("is_public", true)
        .order("created_at");
      if (error) throw error;
      return (data ?? []).map((d) => {
        const { cards, ...deck } = d as typeof d & { cards: { count: number }[] };
        return { ...(deck as Deck), count: cards?.[0]?.count ?? 0 };
      });
    },
  });
}

export function useDeck(deckId: string) {
  return useQuery({
    queryKey: ["deck", deckId],
    queryFn: async (): Promise<Deck> => {
      const { data, error } = await supabase
        .from("decks")
        .select("id,name,color,subject_id,default_type,is_public,created_at")
        .eq("id", deckId)
        .single();
      if (error) throw error;
      return data as Deck;
    },
  });
}

export function useCards(deckId: string) {
  return useQuery({
    queryKey: ["cards", deckId],
    queryFn: async (): Promise<Card[]> => {
      const { data, error } = await supabase
        .from("cards")
        .select("id,deck_id,card_type,prompt,answer,data,position,status")
        .eq("deck_id", deckId)
        .order("position");
      if (error) throw error;
      return (data ?? []) as Card[];
    },
  });
}

export function useCreateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      name: string;
      color: string;
      subject_id?: string | null;
      default_type?: string;
    }) => {
      const user_id = await uid();
      const { data, error } = await supabase
        .from("decks")
        .insert({
          user_id,
          name: input.name,
          color: input.color,
          subject_id: input.subject_id ?? null,
          default_type: input.default_type ?? "classic",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
  });
}

export function useUpdateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string } & Partial<Omit<Deck, "id" | "created_at">>) => {
      const { id, ...rest } = input;
      const { error } = await supabase.from("decks").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["decks"] });
      qc.invalidateQueries({ queryKey: ["deck", v.id] });
    },
  });
}

export function useDeleteDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("decks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decks"] }),
  });
}

export function useSaveCard(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      card_type: string;
      prompt: string;
      answer: string;
      data?: Json;
      position?: number;
    }) => {
      const user_id = await uid();
      if (input.id) {
        const { id, ...rest } = input;
        const { error } = await supabase.from("cards").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cards").insert({
          user_id,
          deck_id: deckId,
          card_type: input.card_type,
          prompt: input.prompt,
          answer: input.answer,
          data: input.data ?? {},
          position: input.position ?? 0,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards", deckId] });
      qc.invalidateQueries({ queryKey: ["decks"] });
    },
  });
}

export function useDeleteCard(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cards", deckId] });
      qc.invalidateQueries({ queryKey: ["decks"] });
    },
  });
}

export function useMoveCard(deckId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; position: number }[]) => {
      for (const u of updates) {
        const { error } = await supabase
          .from("cards")
          .update({ position: u.position })
          .eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cards", deckId] }),
  });
}

export function useSetCardStatus() {
  return useMutation({
    mutationFn: async (input: { id: string; status: string }) => {
      const { error } = await supabase
        .from("cards")
        .update({ status: input.status })
        .eq("id", input.id);
      if (error) throw error;
    },
  });
}

export function useSaveResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { deck_id: string; score: number; total: number; xp: number }) => {
      const user_id = await uid();
      const { error } = await supabase.from("study_results").insert({ ...input, user_id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["results"] }),
  });
}

export function useResults() {
  return useQuery({
    queryKey: ["results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("study_results")
        .select("id,deck_id,score,total,xp,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllCardStatuses() {
  return useQuery({
    queryKey: ["card_statuses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cards").select("id,deck_id,status");
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Duplicates a public deck (and its cards) into the signed-in user's library. */
export function useCopyDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deckId: string) => {
      const user_id = await uid();
      const { data: source, error: deckError } = await supabase
        .from("decks")
        .select("name,color,default_type")
        .eq("id", deckId)
        .single();
      if (deckError) throw deckError;

      const { data: created, error: createError } = await supabase
        .from("decks")
        .insert({
          user_id,
          name: `${source.name} (copy)`,
          color: source.color,
          default_type: source.default_type,
          is_public: false,
        })
        .select("id")
        .single();
      if (createError) throw createError;

      const { data: sourceCards, error: cardsError } = await supabase
        .from("cards")
        .select("card_type,prompt,answer,data,position")
        .eq("deck_id", deckId)
        .order("position");
      if (cardsError) throw cardsError;

      if (sourceCards && sourceCards.length > 0) {
        const { error: insertError } = await supabase.from("cards").insert(
          sourceCards.map((c, i) => ({
            user_id,
            deck_id: created.id,
            card_type: c.card_type,
            prompt: c.prompt,
            answer: c.answer,
            data: c.data,
            position: c.position ?? i,
            status: "new",
          })),
        );
        if (insertError) throw insertError;
      }
      return created.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decks"] });
      qc.invalidateQueries({ queryKey: ["card_statuses"] });
    },
  });
}
