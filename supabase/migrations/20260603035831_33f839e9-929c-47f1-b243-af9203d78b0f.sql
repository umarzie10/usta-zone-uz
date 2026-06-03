CREATE TABLE public.favorite_masters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  master_profile_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, master_profile_id)
);

GRANT SELECT, INSERT, DELETE ON public.favorite_masters TO authenticated;
GRANT ALL ON public.favorite_masters TO service_role;
ALTER TABLE public.favorite_masters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites" ON public.favorite_masters FOR ALL
  USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);

CREATE TABLE public.saved_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL,
  address text NOT NULL,
  city text,
  region text,
  latitude double precision,
  longitude double precision,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_addresses TO authenticated;
GRANT ALL ON public.saved_addresses TO service_role;
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own addresses" ON public.saved_addresses FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_saved_addresses_updated
  BEFORE UPDATE ON public.saved_addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();