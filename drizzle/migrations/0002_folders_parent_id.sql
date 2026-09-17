ALTER TABLE public.folders ADD COLUMN parent_id uuid REFERENCES public.folders(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS folders_parent_id_idx ON public.folders(parent_id);