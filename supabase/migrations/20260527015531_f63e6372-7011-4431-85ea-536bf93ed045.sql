-- Platform settings table for admin-configurable values
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.platform_settings TO anon;
GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settings viewable by everyone"
  ON public.platform_settings FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings"
  ON public.platform_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default commission (10%)
INSERT INTO public.platform_settings (key, value)
VALUES ('commission_percent', '10'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Helper function to read commission percent
CREATE OR REPLACE FUNCTION public.get_commission_percent()
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((value)::text::numeric, 10)
  FROM public.platform_settings
  WHERE key = 'commission_percent'
  LIMIT 1;
$$;