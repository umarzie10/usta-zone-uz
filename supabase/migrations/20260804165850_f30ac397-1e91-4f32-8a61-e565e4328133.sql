-- 1) Founding master badge configurable
CREATE OR REPLACE FUNCTION public.assign_founding_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n int; _limit int; _enabled boolean;
BEGIN
  SELECT COALESCE((value->>'limit')::int, 100), COALESCE((value->>'enabled')::boolean, true)
    INTO _limit, _enabled
  FROM public.platform_settings WHERE key = 'founding_master';

  _limit := COALESCE(_limit, 100);
  _enabled := COALESCE(_enabled, true);
  IF NOT _enabled THEN RETURN NEW; END IF;

  SELECT COALESCE(MAX(founding_number), 0) + 1 INTO _n FROM public.master_profiles;
  IF _n <= _limit THEN NEW.founding_number := _n; END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_resync_founding_numbers()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _limit int; _enabled boolean; _count int;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'admin only'; END IF;
  SELECT COALESCE((value->>'limit')::int, 100), COALESCE((value->>'enabled')::boolean, true)
    INTO _limit, _enabled FROM public.platform_settings WHERE key = 'founding_master';
  _limit := COALESCE(_limit, 100); _enabled := COALESCE(_enabled, true);

  UPDATE public.master_profiles SET founding_number = NULL WHERE founding_number IS NOT NULL;

  IF _enabled THEN
    WITH ranked AS (
      SELECT id, row_number() OVER (ORDER BY created_at ASC) rn FROM public.master_profiles
    )
    UPDATE public.master_profiles mp SET founding_number = r.rn
    FROM ranked r WHERE r.id = mp.id AND r.rn <= _limit;
    GET DIAGNOSTICS _count = ROW_COUNT;
  ELSE
    _count := 0;
  END IF;

  RETURN jsonb_build_object('ok', true, 'assigned', _count, 'limit', _limit, 'enabled', _enabled);
END; $$;

CREATE OR REPLACE FUNCTION public.get_founding_config()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT value FROM public.platform_settings WHERE key = 'founding_master'),
                  '{"enabled": true, "limit": 100}'::jsonb);
$$;

GRANT EXECUTE ON FUNCTION public.get_founding_config() TO anon, authenticated;

-- 2) Referral system
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code) WHERE referral_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE _c text; _i int := 0;
BEGIN
  LOOP
    _c := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 7));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = _c);
    _i := _i + 1; EXIT WHEN _i > 20;
  END LOOP;
  RETURN _c;
END; $$;

UPDATE public.profiles SET referral_code = public.gen_referral_code() WHERE referral_code IS NULL;

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid NOT NULL UNIQUE,
  code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  bonus_amount numeric NOT NULL DEFAULT 0,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view their own referrals" ON public.referrals;
CREATE POLICY "Users view their own referrals" ON public.referrals
FOR SELECT TO authenticated
USING (referrer_id = auth.uid() OR referred_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals (referrer_id);

-- link referral on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE _role app_role; _trial_days int; _code text; _ref_code text; _referrer uuid;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'client'::app_role);
  _code := public.gen_referral_code();
  _ref_code := NULLIF(upper(trim(COALESCE(NEW.raw_user_meta_data->>'referral_code',''))), '');

  IF _ref_code IS NOT NULL THEN
    SELECT user_id INTO _referrer FROM public.profiles WHERE referral_code = _ref_code;
  END IF;

  INSERT INTO public.profiles (user_id, full_name, phone, city, region, role, is_verified, is_blocked, referral_code, referred_by)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'city', 'Toshkent'),
    COALESCE(NEW.raw_user_meta_data->>'region', 'Toshkent shahri'),
    _role, false, false, _code, _referrer)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role) ON CONFLICT DO NOTHING;

  IF _referrer IS NOT NULL AND _referrer <> NEW.id THEN
    INSERT INTO public.referrals (referrer_id, referred_user_id, code)
    VALUES (_referrer, NEW.id, _ref_code) ON CONFLICT (referred_user_id) DO NOTHING;

    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (_referrer, 'Yangi taklif 🎉',
            'Sizning taklif kodingiz bo''yicha yangi foydalanuvchi ro''yxatdan o''tdi.', 'referral_new');
  END IF;

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
END; $$;

-- conversion + bonus when referred user's order completes
CREATE OR REPLACE FUNCTION public.trg_referral_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _ref public.referrals%ROWTYPE; _bonus numeric;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT * INTO _ref FROM public.referrals
      WHERE referred_user_id = NEW.client_id AND status = 'pending' FOR UPDATE;
    IF FOUND THEN
      _bonus := COALESCE((SELECT (value->>'referral_bonus')::numeric FROM public.platform_settings WHERE key = 'referral'), 10000);
      UPDATE public.referrals SET status = 'converted', converted_at = now(), bonus_amount = _bonus WHERE id = _ref.id;
      UPDATE public.profiles SET bonus_balance = COALESCE(bonus_balance,0) + _bonus WHERE user_id = _ref.referrer_id;
      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (_ref.referrer_id, 'Referral bonus 💰',
              'Taklif qilgan foydalanuvchingiz buyurtmani yakunladi. Sizga ' || _bonus || ' so''m bonus qo''shildi.', 'referral_bonus');
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_referral_conversion ON public.orders;
CREATE TRIGGER trg_referral_conversion
AFTER UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.trg_referral_conversion();

-- referral stats RPC
CREATE OR REPLACE FUNCTION public.get_my_referral_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _u uuid := auth.uid(); _code text; _total int; _conv int; _earned numeric; _pending numeric; _bonus numeric;
BEGIN
  IF _u IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  SELECT referral_code INTO _code FROM public.profiles WHERE user_id = _u;
  SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'converted'),
         COALESCE(SUM(bonus_amount) FILTER (WHERE status = 'converted'), 0)
    INTO _total, _conv, _earned FROM public.referrals WHERE referrer_id = _u;
  _bonus := COALESCE((SELECT (value->>'referral_bonus')::numeric FROM public.platform_settings WHERE key = 'referral'), 10000);
  _pending := (_total - _conv) * _bonus;
  RETURN jsonb_build_object(
    'ok', true, 'code', _code, 'total', _total, 'converted', _conv,
    'conversion_rate', CASE WHEN _total = 0 THEN 0 ELSE round(_conv::numeric * 100 / _total, 1) END,
    'earned', _earned, 'pending', _pending, 'bonus_per_referral', _bonus
  );
END; $$;

GRANT EXECUTE ON FUNCTION public.get_my_referral_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_referral_list()
RETURNS TABLE(id uuid, full_name text, status text, bonus_amount numeric, created_at timestamptz, converted_at timestamptz)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, COALESCE(p.full_name, 'Foydalanuvchi'), r.status, r.bonus_amount, r.created_at, r.converted_at
  FROM public.referrals r
  LEFT JOIN public.profiles p ON p.user_id = r.referred_user_id
  WHERE r.referrer_id = auth.uid()
  ORDER BY r.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_referral_list() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_referral_code()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT referral_code FROM public.profiles WHERE user_id = auth.uid(); $$;

GRANT EXECUTE ON FUNCTION public.get_my_referral_code() TO authenticated;