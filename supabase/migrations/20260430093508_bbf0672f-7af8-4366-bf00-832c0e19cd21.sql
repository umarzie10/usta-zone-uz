ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_seen_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen_at);

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;