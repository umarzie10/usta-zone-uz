
-- ENUMS
DO $$ BEGIN CREATE TYPE public.wallet_tx_type AS ENUM ('deposit','withdrawal','payment','refund','bonus','earning','commission'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.wallet_tx_status AS ENUM ('pending','success','cancelled','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.withdrawal_status AS ENUM ('pending','approved','completed','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  frozen_balance numeric NOT NULL DEFAULT 0 CHECK (frozen_balance >= 0),
  total_deposited numeric NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  total_withdrawn numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'UZS',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallets TO authenticated;
GRANT ALL ON public.wallets TO service_role;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wallet select" ON public.wallets FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin wallet select" ON public.wallets FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_wallets_updated BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- BANK CARDS
CREATE TABLE IF NOT EXISTS public.bank_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_holder text NOT NULL,
  card_last4 text NOT NULL,
  card_masked text NOT NULL,
  brand text NOT NULL DEFAULT 'uzcard',
  expiry text,
  is_default boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bank_cards TO authenticated;
GRANT ALL ON public.bank_cards TO service_role;
ALTER TABLE public.bank_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cards" ON public.bank_cards FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin read cards" ON public.bank_cards FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_bank_cards_updated BEFORE UPDATE ON public.bank_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WALLET TRANSACTIONS
CREATE SEQUENCE IF NOT EXISTS public.wallet_tx_seq START 100000;
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text NOT NULL DEFAULT ('TX-' || nextval('public.wallet_tx_seq')::text),
  user_id uuid NOT NULL,
  type public.wallet_tx_type NOT NULL,
  status public.wallet_tx_status NOT NULL DEFAULT 'success',
  amount numeric NOT NULL,
  payment_method text,
  balance_after numeric,
  order_id uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wtx_user ON public.wallet_transactions(user_id, created_at DESC);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tx" ON public.wallet_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin tx" ON public.wallet_transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- WITHDRAWALS
CREATE TABLE IF NOT EXISTS public.wallet_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  card_id uuid REFERENCES public.bank_cards(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  otp_code text,
  otp_verified boolean NOT NULL DEFAULT false,
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wallet_withdrawals TO authenticated;
GRANT ALL ON public.wallet_withdrawals TO service_role;
ALTER TABLE public.wallet_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own withdrawals" ON public.wallet_withdrawals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admin withdrawals select" ON public.wallet_withdrawals FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_wallet_withdrawals_updated BEFORE UPDATE ON public.wallet_withdrawals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- HELPERS
CREATE OR REPLACE FUNCTION public.get_my_wallet()
RETURNS public.wallets LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
DECLARE _u uuid := auth.uid(); _w public.wallets;
BEGIN
  IF _u IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO _w FROM public.wallets WHERE user_id = _u;
  IF NOT FOUND THEN
    INSERT INTO public.wallets(user_id) VALUES (_u) ON CONFLICT (user_id) DO NOTHING;
    SELECT * INTO _w FROM public.wallets WHERE user_id = _u;
  END IF;
  RETURN _w;
END; $$;

CREATE OR REPLACE FUNCTION public.wallet_deposit(_amount numeric, _method text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
DECLARE _u uuid := auth.uid(); _bal numeric; _ref text;
BEGIN
  IF _u IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _amount IS NULL OR _amount < 1000 THEN RETURN jsonb_build_object('ok',false,'error','min_amount'); END IF;
  IF _amount > 50000000 THEN RETURN jsonb_build_object('ok',false,'error','max_amount'); END IF;
  PERFORM public.get_my_wallet();
  UPDATE public.wallets SET balance = balance + _amount, total_deposited = total_deposited + _amount
    WHERE user_id = _u RETURNING balance INTO _bal;
  INSERT INTO public.wallet_transactions(user_id, type, status, amount, payment_method, balance_after, note)
    VALUES (_u,'deposit','success',_amount,_method,_bal,'Balans to''ldirildi') RETURNING ref_code INTO _ref;
  INSERT INTO public.notifications(user_id, title, message, type)
    VALUES (_u,'Balans to''ldirildi 💰', _amount || ' so''m balansingizga qo''shildi.','wallet_deposit');
  INSERT INTO public.audit_logs(user_id, action, entity, meta) VALUES (_u,'wallet_deposit','wallet',jsonb_build_object('amount',_amount,'method',_method));
  RETURN jsonb_build_object('ok',true,'balance',_bal,'ref',_ref);
END; $$;

CREATE OR REPLACE FUNCTION public.wallet_request_withdrawal(_amount numeric, _card_id uuid, _otp text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
DECLARE _u uuid := auth.uid(); _bal numeric; _id uuid;
BEGIN
  IF _u IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF _amount < 10000 THEN RETURN jsonb_build_object('ok',false,'error','min_amount'); END IF;
  IF _amount > 20000000 THEN RETURN jsonb_build_object('ok',false,'error','max_amount'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.bank_cards WHERE id = _card_id AND user_id = _u) THEN
    RETURN jsonb_build_object('ok',false,'error','invalid_card'); END IF;
  PERFORM public.get_my_wallet();
  SELECT balance INTO _bal FROM public.wallets WHERE user_id = _u FOR UPDATE;
  IF _bal < _amount THEN RETURN jsonb_build_object('ok',false,'error','insufficient'); END IF;

  UPDATE public.wallets SET balance = balance - _amount, frozen_balance = frozen_balance + _amount WHERE user_id = _u;
  INSERT INTO public.wallet_withdrawals(user_id, card_id, amount, otp_code, otp_verified)
    VALUES (_u,_card_id,_amount,_otp, _otp IS NOT NULL) RETURNING id INTO _id;
  INSERT INTO public.wallet_transactions(user_id, type, status, amount, payment_method, balance_after, note)
    VALUES (_u,'withdrawal','pending',_amount,'card',_bal - _amount,'Pul yechish so''rovi');
  INSERT INTO public.audit_logs(user_id, action, entity, entity_id, meta) VALUES (_u,'withdrawal_request','withdrawal',_id,jsonb_build_object('amount',_amount));
  RETURN jsonb_build_object('ok',true,'id',_id);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_review_withdrawal(_id uuid, _decision text, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
DECLARE _w public.wallet_withdrawals;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
  SELECT * INTO _w FROM public.wallet_withdrawals WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;

  IF _decision = 'rejected' THEN
    UPDATE public.wallets SET balance = balance + _w.amount, frozen_balance = GREATEST(0, frozen_balance - _w.amount) WHERE user_id = _w.user_id;
    UPDATE public.wallet_transactions SET status='cancelled' WHERE user_id=_w.user_id AND type='withdrawal' AND status='pending';
    INSERT INTO public.notifications(user_id,title,message,type) VALUES (_w.user_id,'Pul yechish rad etildi', COALESCE(_note,'So''rovingiz rad etildi, mablag'' qaytarildi.'),'withdrawal_rejected');
  ELSIF _decision = 'completed' THEN
    UPDATE public.wallets SET frozen_balance = GREATEST(0, frozen_balance - _w.amount), total_withdrawn = total_withdrawn + _w.amount WHERE user_id = _w.user_id;
    UPDATE public.wallet_transactions SET status='success' WHERE user_id=_w.user_id AND type='withdrawal' AND status='pending';
    INSERT INTO public.notifications(user_id,title,message,type) VALUES (_w.user_id,'Pul yechildi ✅', _w.amount || ' so''m kartangizga o''tkazildi.','withdrawal_completed');
  END IF;

  UPDATE public.wallet_withdrawals SET status = _decision::public.withdrawal_status, admin_note = _note,
    reviewed_by = auth.uid(), reviewed_at = now() WHERE id = _id;
  INSERT INTO public.audit_logs(user_id, action, entity, entity_id, meta) VALUES (auth.uid(),'withdrawal_'||_decision,'withdrawal',_id,jsonb_build_object('amount',_w.amount));
  RETURN jsonb_build_object('ok',true);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_wallet_overview()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
  RETURN jsonb_build_object(
    'platform_balance', COALESCE((SELECT SUM(balance + frozen_balance) FROM public.wallets),0),
    'total_deposits', COALESCE((SELECT SUM(total_deposited) FROM public.wallets),0),
    'total_withdrawn', COALESCE((SELECT SUM(total_withdrawn) FROM public.wallets),0),
    'pending_withdrawals', COALESCE((SELECT SUM(amount) FROM public.wallet_withdrawals WHERE status='pending'),0),
    'pending_count', COALESCE((SELECT COUNT(*) FROM public.wallet_withdrawals WHERE status='pending'),0),
    'refunds', COALESCE((SELECT SUM(amount) FROM public.wallet_transactions WHERE type='refund' AND status='success'),0),
    'revenue', COALESCE((SELECT SUM(commission_amount) FROM public.orders WHERE status='completed'),0)
  );
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_withdrawals()
RETURNS TABLE(id uuid, user_id uuid, full_name text, role text, amount numeric, status public.withdrawal_status,
  card_masked text, card_holder text, admin_note text, created_at timestamptz, reviewed_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
  RETURN QUERY SELECT w.id, w.user_id, p.full_name, p.role::text, w.amount, w.status,
    c.card_masked, c.card_holder, w.admin_note, w.created_at, w.reviewed_at
  FROM public.wallet_withdrawals w
  LEFT JOIN public.profiles p ON p.user_id = w.user_id
  LEFT JOIN public.bank_cards c ON c.id = w.card_id
  ORDER BY w.created_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_wallet_transactions(_limit integer DEFAULT 300)
RETURNS TABLE(id uuid, ref_code text, user_id uuid, full_name text, role text, type public.wallet_tx_type,
  status public.wallet_tx_status, amount numeric, payment_method text, note text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
  RETURN QUERY SELECT t.id, t.ref_code, t.user_id, p.full_name, p.role::text, t.type, t.status, t.amount,
    t.payment_method, t.note, t.created_at
  FROM public.wallet_transactions t
  LEFT JOIN public.profiles p ON p.user_id = t.user_id
  ORDER BY t.created_at DESC LIMIT _limit;
END; $$;

CREATE OR REPLACE FUNCTION public.get_my_earnings_summary()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='public' AS $$
DECLARE _u uuid := auth.uid();
BEGIN
  IF _u IS NULL THEN RETURN jsonb_build_object('ok',false); END IF;
  RETURN jsonb_build_object(
    'today', COALESCE((SELECT SUM(master_amount) FROM public.orders WHERE master_id=_u AND status='completed' AND updated_at::date = now()::date),0),
    'week', COALESCE((SELECT SUM(master_amount) FROM public.orders WHERE master_id=_u AND status='completed' AND updated_at > now()-interval '7 days'),0),
    'month', COALESCE((SELECT SUM(master_amount) FROM public.orders WHERE master_id=_u AND status='completed' AND updated_at > now()-interval '30 days'),0),
    'total', COALESCE((SELECT SUM(master_amount) FROM public.orders WHERE master_id=_u AND status='completed'),0),
    'pending', COALESCE((SELECT SUM(master_amount) FROM public.orders WHERE master_id=_u AND status IN ('accepted','in_progress')),0),
    'commission', COALESCE((SELECT SUM(commission_amount) FROM public.orders WHERE master_id=_u AND status='completed'),0),
    'jobs', COALESCE((SELECT COUNT(*) FROM public.orders WHERE master_id=_u AND status='completed'),0),
    'avg', COALESCE((SELECT AVG(amount) FROM public.orders WHERE master_id=_u AND status='completed'),0)
  );
END; $$;
