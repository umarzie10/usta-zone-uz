-- Bonus balance for users (cashback)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bonus_balance numeric NOT NULL DEFAULT 0;

-- Promo codes
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percent', -- 'percent' | 'fixed'
  discount_value numeric NOT NULL,
  max_uses int,
  used_count int NOT NULL DEFAULT 0,
  min_order_amount numeric DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_codes TO authenticated;
GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Promo codes viewable" ON public.promo_codes FOR SELECT USING (true);
CREATE POLICY "Admins manage promo codes" ON public.promo_codes FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Promo redemptions (one user can redeem each code once)
CREATE TABLE public.promo_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  order_id uuid,
  discount_applied numeric NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(promo_code_id, user_id)
);

GRANT SELECT, INSERT ON public.promo_redemptions TO authenticated;
GRANT ALL ON public.promo_redemptions TO service_role;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own redemptions" ON public.promo_redemptions FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Apply promo code
CREATE OR REPLACE FUNCTION public.apply_promo_code(_code text, _order_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _user uuid := auth.uid();
  _pc public.promo_codes%ROWTYPE;
  _discount numeric := 0;
  _existing uuid;
BEGIN
  IF _user IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;

  SELECT * INTO _pc FROM public.promo_codes WHERE upper(code) = upper(_code) AND is_active = true FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','invalid_code'); END IF;
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
END; $$;

-- Confirm redemption (called when order is created)
CREATE OR REPLACE FUNCTION public.redeem_promo_code(_promo_code_id uuid, _order_id uuid, _discount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _user uuid := auth.uid();
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  INSERT INTO public.promo_redemptions (promo_code_id, user_id, order_id, discount_applied)
    VALUES (_promo_code_id, _user, _order_id, _discount);
  UPDATE public.promo_codes SET used_count = used_count + 1 WHERE id = _promo_code_id;
END; $$;

-- Award cashback (1% of completed order to client)
CREATE OR REPLACE FUNCTION public.award_cashback(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _client uuid; _amount numeric; _bonus numeric;
BEGIN
  SELECT client_id, amount INTO _client, _amount FROM public.orders WHERE id = _order_id;
  IF _client IS NULL OR _amount IS NULL THEN RETURN; END IF;
  _bonus := round(_amount * 0.01);
  UPDATE public.profiles SET bonus_balance = COALESCE(bonus_balance,0) + _bonus WHERE user_id = _client;
END; $$;

-- Use bonus balance (deduct from profile when client pays with bonus)
CREATE OR REPLACE FUNCTION public.use_bonus_balance(_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _user uuid := auth.uid(); _balance numeric;
BEGIN
  IF _user IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  SELECT bonus_balance INTO _balance FROM public.profiles WHERE user_id = _user FOR UPDATE;
  IF COALESCE(_balance,0) < _amount THEN RETURN jsonb_build_object('ok',false,'error','insufficient'); END IF;
  UPDATE public.profiles SET bonus_balance = bonus_balance - _amount WHERE user_id = _user;
  RETURN jsonb_build_object('ok',true,'new_balance', _balance - _amount);
END; $$;