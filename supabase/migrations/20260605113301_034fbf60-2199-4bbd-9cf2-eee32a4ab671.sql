
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_period TEXT,
  ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'master';

UPDATE public.subscriptions s
SET audience = COALESCE(p.role::text, 'master')
FROM public.profiles p
WHERE p.user_id = s.user_id AND s.audience IS DISTINCT FROM p.role::text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _role app_role; _trial_days int;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'client'::app_role);

  INSERT INTO public.profiles (user_id, full_name, phone, city, region, role, is_verified, is_blocked)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'city', 'Toshkent'),
    COALESCE(NEW.raw_user_meta_data->>'region', 'Toshkent shahri'),
    _role, false, false)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role) ON CONFLICT DO NOTHING;

  IF _role = 'master' THEN _trial_days := 30;
  ELSIF _role = 'client' THEN _trial_days := 7;
  ELSE _trial_days := 0; END IF;

  IF _trial_days > 0 THEN
    INSERT INTO public.subscriptions (user_id, tier, is_trial, trial_ends_at, expires_at, audience)
    VALUES (NEW.id, 'pro', true, now() + (_trial_days || ' days')::interval, now() + (_trial_days || ' days')::interval, _role::text)
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    INSERT INTO public.subscriptions (user_id, tier, audience)
    VALUES (NEW.id, 'free', _role::text) ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END; $function$;

-- Backfill trial for existing users without subscription
INSERT INTO public.subscriptions (user_id, tier, is_trial, trial_ends_at, expires_at, audience)
SELECT p.user_id, 'pro', true,
       p.created_at + CASE WHEN p.role='master' THEN interval '30 days' ELSE interval '7 days' END,
       p.created_at + CASE WHEN p.role='master' THEN interval '30 days' ELSE interval '7 days' END,
       p.role::text
FROM public.profiles p
WHERE p.role IN ('master','client')
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_my_subscription_status()
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _u uuid := auth.uid(); _s public.subscriptions%ROWTYPE; _active boolean; _days int;
BEGIN
  IF _u IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  SELECT * INTO _s FROM public.subscriptions WHERE user_id = _u LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('tier','free','is_trial',false,'active',true,'days_left',null,'expires_at',null,'expired',false);
  END IF;
  _active := (_s.tier = 'free') OR (_s.expires_at IS NULL) OR (_s.expires_at > now());
  _days := CASE WHEN _s.expires_at IS NULL THEN NULL ELSE GREATEST(0, CEIL(EXTRACT(EPOCH FROM (_s.expires_at - now()))/86400)::int) END;
  RETURN jsonb_build_object(
    'tier', _s.tier,
    'is_trial', (_s.is_trial AND _s.trial_ends_at IS NOT NULL AND _s.trial_ends_at > now()),
    'trial_ends_at', _s.trial_ends_at,
    'expires_at', _s.expires_at,
    'days_left', _days,
    'active', _active,
    'audience', _s.audience,
    'expired', (_s.tier <> 'free' AND _s.expires_at IS NOT NULL AND _s.expires_at <= now())
  );
END; $$;

CREATE OR REPLACE FUNCTION public.master_can_accept_orders(_user_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions s
    WHERE s.user_id = _user_id
      AND s.tier::text IN ('basic','pro','premium','vip','standard')
      AND (s.expires_at IS NULL OR s.expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.activate_subscription(_tier subscription_tier, _months int DEFAULT 1)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _u uuid := auth.uid(); _role text; _exp timestamptz;
BEGIN
  IF _u IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT role::text INTO _role FROM public.profiles WHERE user_id = _u;

  IF _tier::text = 'free' THEN _exp := NULL;
  ELSE _exp := now() + (_months || ' months')::interval; END IF;

  INSERT INTO public.subscriptions (user_id, tier, expires_at, billing_period, audience, is_trial, trial_ends_at)
  VALUES (_u, _tier, _exp, _months || 'm', COALESCE(_role,'client'), false, NULL)
  ON CONFLICT (user_id) DO UPDATE SET
    tier = EXCLUDED.tier,
    expires_at = EXCLUDED.expires_at,
    billing_period = EXCLUDED.billing_period,
    is_trial = false,
    trial_ends_at = NULL,
    updated_at = now();

  RETURN jsonb_build_object('ok', true, 'tier', _tier, 'expires_at', _exp);
END; $$;
