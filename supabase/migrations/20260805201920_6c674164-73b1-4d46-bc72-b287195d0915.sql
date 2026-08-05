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
  IF _code IS NULL OR _code = '' THEN
    _code := upper(substr(md5(_u::text), 1, 7));
  END IF;
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

-- self-heal: persist a referral code for any profile missing one
CREATE OR REPLACE FUNCTION public.ensure_my_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _u uuid := auth.uid(); _code text;
BEGIN
  IF _u IS NULL THEN RETURN NULL; END IF;
  SELECT referral_code INTO _code FROM public.profiles WHERE user_id = _u;
  IF _code IS NULL OR _code = '' THEN
    _code := upper(substr(md5(_u::text || clock_timestamp()::text), 1, 7));
    UPDATE public.profiles SET referral_code = _code WHERE user_id = _u;
  END IF;
  RETURN _code;
END; $$;

UPDATE public.profiles SET referral_code = upper(substr(md5(user_id::text), 1, 7))
WHERE referral_code IS NULL OR referral_code = '';

GRANT EXECUTE ON FUNCTION public.get_my_referral_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_my_referral_code() TO authenticated;