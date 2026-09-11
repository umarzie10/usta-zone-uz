ALTER TABLE public.master_profiles
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT false;

ALTER TABLE public.master_profiles REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.master_profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;