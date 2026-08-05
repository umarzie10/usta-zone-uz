CREATE OR REPLACE FUNCTION public.apply_promo_code(_code text, _order_amount numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _user uuid := auth.uid();
  _pc public.promo_codes%ROWTYPE;
  _discount numeric := 0;
  _existing uuid;
  _any_row public.promo_codes%ROWTYPE;
BEGIN
  IF _user IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;

  SELECT * INTO _pc FROM public.promo_codes WHERE upper(code) = upper(_code) AND is_active = true FOR UPDATE;
  IF NOT FOUND THEN
    SELECT * INTO _any_row FROM public.promo_codes WHERE upper(code) = upper(_code);
    IF FOUND THEN RETURN jsonb_build_object('ok',false,'error','inactive'); END IF;
    IF EXISTS (SELECT 1 FROM public.profiles WHERE upper(referral_code) = upper(_code)) THEN
      RETURN jsonb_build_object('ok',false,'error','is_referral');
    END IF;
    RETURN jsonb_build_object('ok',false,'error','invalid_code');
  END IF;
  IF _pc.expires_at IS NOT NULL AND _pc.expires_at < now() THEN
    RETURN jsonb_build_object('ok',false,'error','expired'); END IF;
  IF _pc.max_uses IS NOT NULL AND _pc.used_count >= _pc.max_uses THEN
    RETURN jsonb_build_object('ok',false,'error','limit_reached'); END IF;
  IF _order_amount < COALESCE(_pc.min_order_amount, 0) THEN
    RETURN jsonb_build_object('ok',false,'error','min_amount','required',_pc.min_order_amount); END IF;

  SELECT id INTO _existing FROM public.promo_redemptions
    WHERE promo_code_id = _pc.id AND user_id = _user;
  IF FOUND THEN RETURN jsonb_build_object('ok',false,'error','already_used'); END IF;

  IF _pc.discount_type = 'percent' THEN
    _discount := round(_order_amount * _pc.discount_value / 100);
  ELSE
    _discount := LEAST(_pc.discount_value, _order_amount);
  END IF;

  RETURN jsonb_build_object('ok', true, 'discount', _discount, 'promo_code_id', _pc.id, 'final_amount', _order_amount - _discount);
END; $function$;