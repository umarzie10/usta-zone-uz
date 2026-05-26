-- SERVICES
CREATE TABLE IF NOT EXISTS public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  master_id UUID NOT NULL,
  category_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  pricing_type TEXT NOT NULL DEFAULT 'fixed' CHECK (pricing_type IN ('fixed','from','hourly')),
  price NUMERIC NOT NULL DEFAULT 0,
  price_max NUMERIC,
  estimated_hours NUMERIC,
  market_avg_price NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_services_master ON public.services(master_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category_id);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Services viewable by everyone" ON public.services;
CREATE POLICY "Services viewable by everyone" ON public.services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Masters manage own services" ON public.services;
CREATE POLICY "Masters manage own services" ON public.services FOR ALL
  USING (EXISTS (SELECT 1 FROM public.master_profiles mp WHERE mp.id = services.master_id AND mp.user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins manage all services" ON public.services;
CREATE POLICY "Admins manage all services" ON public.services FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

DROP TRIGGER IF EXISTS trg_services_updated_at ON public.services;
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BADGES VIEW
CREATE OR REPLACE VIEW public.master_badges AS
SELECT
  mp.id AS master_id, mp.user_id, mp.jobs_completed, mp.rating, mp.reviews_count,
  COALESCE(s.tier::text,'free') AS tier, p.is_verified,
  CASE
    WHEN COALESCE(s.tier::text,'free') = 'premium' AND mp.rating >= 4.7 AND mp.jobs_completed >= 50 THEN 'elite'
    WHEN mp.rating >= 4.7 AND mp.jobs_completed >= 30 THEN 'top_rated'
    WHEN mp.jobs_completed >= 20 AND mp.rating >= 4.5 THEN 'trusted'
    WHEN p.is_verified AND COALESCE(s.tier::text,'free') IN ('pro','premium') THEN 'verified'
    ELSE 'new_master'
  END AS badge
FROM public.master_profiles mp
JOIN public.profiles p ON p.user_id = mp.user_id
LEFT JOIN public.subscriptions s ON s.user_id = mp.user_id;
GRANT SELECT ON public.master_badges TO anon, authenticated;

-- LIMITS
CREATE OR REPLACE FUNCTION public.master_can_add_service(_master_user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _tier text; _count int;
BEGIN
  SELECT COALESCE(tier::text,'free') INTO _tier FROM public.subscriptions WHERE user_id = _master_user_id;
  IF _tier IN ('pro','premium') THEN RETURN true; END IF;
  SELECT COUNT(*) INTO _count FROM public.services s
    JOIN public.master_profiles mp ON mp.id = s.master_id
    WHERE mp.user_id = _master_user_id;
  RETURN _count < 3;
END; $$;

-- MIGRATE OLD TIERS
UPDATE public.subscriptions SET tier = 'pro' WHERE tier::text = 'standard';
UPDATE public.subscriptions SET tier = 'premium' WHERE tier::text = 'vip';

-- SMART MATCHING
CREATE OR REPLACE FUNCTION public.master_match_score(
  _master_id uuid, _client_lat double precision DEFAULT NULL, _client_lng double precision DEFAULT NULL
) RETURNS numeric LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _rating numeric:=0; _jobs int:=0; _tier text:='free'; _tier_boost numeric:=0; _dist_score numeric:=50;
        _lat double precision; _lng double precision;
BEGIN
  SELECT mp.rating, mp.jobs_completed, COALESCE(s.tier::text,'free'), p.latitude, p.longitude
    INTO _rating, _jobs, _tier, _lat, _lng
  FROM public.master_profiles mp
  JOIN public.profiles p ON p.user_id = mp.user_id
  LEFT JOIN public.subscriptions s ON s.user_id = mp.user_id
  WHERE mp.id = _master_id;
  _tier_boost := CASE _tier WHEN 'premium' THEN 30 WHEN 'pro' THEN 15 ELSE 0 END;
  IF _client_lat IS NOT NULL AND _lat IS NOT NULL THEN
    _dist_score := GREATEST(0, 50 - (111.0 * sqrt(power(_lat - _client_lat, 2) + power((_lng - _client_lng) * cos(radians(_client_lat)), 2))));
  END IF;
  RETURN (_rating * 10) + LEAST(_jobs, 100) * 0.3 + _tier_boost + _dist_score;
END; $$;