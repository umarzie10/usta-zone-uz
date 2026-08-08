-- ESCROW
CREATE TABLE IF NOT EXISTS public.order_escrow (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  client_id uuid NOT NULL,
  master_id uuid,
  amount numeric NOT NULL,
  commission_amount numeric NOT NULL DEFAULT 0,
  master_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'held',
  released_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.order_escrow TO authenticated;
GRANT ALL ON public.order_escrow TO service_role;
ALTER TABLE public.order_escrow ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escrow_owner_read" ON public.order_escrow FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR master_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_order_escrow_updated BEFORE UPDATE ON public.order_escrow
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- WARRANTY CLAIMS (7 kun kafolat)
CREATE TABLE IF NOT EXISTS public.warranty_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  client_id uuid NOT NULL,
  master_id uuid,
  reason text NOT NULL,
  photos text[] NOT NULL DEFAULT '{}',
  resolution text NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.warranty_claims TO authenticated;
GRANT ALL ON public.warranty_claims TO service_role;
ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warranty_read" ON public.warranty_claims FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR master_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "warranty_client_insert" ON public.warranty_claims FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());
CREATE POLICY "warranty_admin_update" ON public.warranty_claims FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_warranty_updated BEFORE UPDATE ON public.warranty_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- REVIEW MEDIA
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS photo_urls text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS video_url text;

-- ORDER WARRANTY WINDOW
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS warranty_until timestamptz;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS escrow_status text NOT NULL DEFAULT 'none';

-- ESCROW RPCs
CREATE OR REPLACE FUNCTION public.escrow_hold(_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _u uuid := auth.uid(); _o public.orders; _pct numeric; _comm numeric; _bal numeric;
BEGIN
  IF _u IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO _o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND OR _o.client_id <> _u THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  IF COALESCE(_o.amount,0) <= 0 THEN RETURN jsonb_build_object('ok',false,'error','no_amount'); END IF;
  IF _o.escrow_status = 'held' THEN RETURN jsonb_build_object('ok',false,'error','already_held'); END IF;

  PERFORM public.get_my_wallet();
  SELECT balance INTO _bal FROM public.wallets WHERE user_id = _u FOR UPDATE;
  IF _bal < _o.amount THEN RETURN jsonb_build_object('ok',false,'error','insufficient'); END IF;

  _pct := public.get_commission_percent();
  _comm := round(_o.amount * _pct / 100);

  UPDATE public.wallets SET balance = balance - _o.amount, frozen_balance = frozen_balance + _o.amount WHERE user_id = _u;
  INSERT INTO public.wallet_transactions(user_id, type, status, amount, payment_method, balance_after, order_id, note)
    VALUES (_u,'payment','pending',_o.amount,'wallet',_bal - _o.amount,_order_id,'Escrow: mablag'' ushlab turildi');
  INSERT INTO public.order_escrow(order_id, client_id, master_id, amount, commission_amount, master_amount)
    VALUES (_order_id, _u, _o.master_id, _o.amount, _comm, _o.amount - _comm)
    ON CONFLICT (order_id) DO UPDATE SET status='held', amount=EXCLUDED.amount,
      commission_amount=EXCLUDED.commission_amount, master_amount=EXCLUDED.master_amount, updated_at=now();
  UPDATE public.orders SET escrow_status='held' WHERE id = _order_id;
  RETURN jsonb_build_object('ok',true);
END; $$;

CREATE OR REPLACE FUNCTION public.escrow_release(_order_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _u uuid := auth.uid(); _e public.order_escrow; _mbal numeric;
BEGIN
  SELECT * INTO _e FROM public.order_escrow WHERE order_id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  IF _e.client_id <> _u AND NOT public.has_role(_u,'admin') THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  IF _e.status <> 'held' THEN RETURN jsonb_build_object('ok',false,'error','not_held'); END IF;

  UPDATE public.wallets SET frozen_balance = GREATEST(0, frozen_balance - _e.amount), total_spent = total_spent + _e.amount
    WHERE user_id = _e.client_id;
  UPDATE public.wallet_transactions SET status='success' WHERE order_id=_order_id AND user_id=_e.client_id AND type='payment' AND status='pending';

  IF _e.master_id IS NOT NULL THEN
    INSERT INTO public.wallets(user_id) VALUES (_e.master_id) ON CONFLICT (user_id) DO NOTHING;
    UPDATE public.wallets SET balance = balance + _e.master_amount WHERE user_id = _e.master_id RETURNING balance INTO _mbal;
    INSERT INTO public.wallet_transactions(user_id,type,status,amount,payment_method,balance_after,order_id,note)
      VALUES (_e.master_id,'earning','success',_e.master_amount,'escrow',_mbal,_order_id,'Buyurtma daromadi (escrow)');
    INSERT INTO public.notifications(user_id,title,message,type,related_order_id)
      VALUES (_e.master_id,'To''lov chiqarildi 💰', _e.master_amount || ' so''m balansingizga o''tdi.','escrow_released',_order_id);
  END IF;

  UPDATE public.order_escrow SET status='released', released_at=now() WHERE order_id=_order_id;
  UPDATE public.orders SET escrow_status='released', warranty_until = now() + interval '7 days' WHERE id=_order_id;
  RETURN jsonb_build_object('ok',true);
END; $$;

CREATE OR REPLACE FUNCTION public.escrow_refund(_order_id uuid, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _e public.order_escrow; _bal numeric;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
  SELECT * INTO _e FROM public.order_escrow WHERE order_id=_order_id FOR UPDATE;
  IF NOT FOUND OR _e.status <> 'held' THEN RETURN jsonb_build_object('ok',false,'error','not_held'); END IF;
  UPDATE public.wallets SET frozen_balance = GREATEST(0, frozen_balance - _e.amount), balance = balance + _e.amount
    WHERE user_id = _e.client_id RETURNING balance INTO _bal;
  UPDATE public.wallet_transactions SET status='cancelled' WHERE order_id=_order_id AND type='payment' AND status='pending';
  INSERT INTO public.wallet_transactions(user_id,type,status,amount,payment_method,balance_after,order_id,note)
    VALUES (_e.client_id,'refund','success',_e.amount,'escrow',_bal,_order_id, COALESCE(_note,'Escrow qaytarildi'));
  INSERT INTO public.notifications(user_id,title,message,type,related_order_id)
    VALUES (_e.client_id,'Mablag'' qaytarildi ↩️', _e.amount || ' so''m balansingizga qaytarildi.','refund',_order_id);
  UPDATE public.order_escrow SET status='refunded', refunded_at=now() WHERE order_id=_order_id;
  UPDATE public.orders SET escrow_status='refunded' WHERE id=_order_id;
  RETURN jsonb_build_object('ok',true);
END; $$;

-- WARRANTY RPCs
CREATE OR REPLACE FUNCTION public.create_warranty_claim(_order_id uuid, _reason text, _photos text[] DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _u uuid := auth.uid(); _o public.orders; _id uuid;
BEGIN
  IF _u IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO _o FROM public.orders WHERE id=_order_id AND client_id=_u;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  IF _o.warranty_until IS NULL OR _o.warranty_until < now() THEN
    RETURN jsonb_build_object('ok',false,'error','warranty_expired'); END IF;
  INSERT INTO public.warranty_claims(order_id, client_id, master_id, reason, photos)
    VALUES (_order_id,_u,_o.master_id,_reason,COALESCE(_photos,'{}')) RETURNING id INTO _id;
  INSERT INTO public.notifications(user_id,title,message,type,related_order_id)
    SELECT p.user_id,'Kafolat murojaati ⚠️','Buyurtma bo''yicha kafolat murojaati keldi.','warranty_claim',_order_id
    FROM public.profiles p WHERE p.role='admin';
  RETURN jsonb_build_object('ok',true,'id',_id);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_resolve_warranty(_id uuid, _resolution text, _note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _c public.warranty_claims;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
  SELECT * INTO _c FROM public.warranty_claims WHERE id=_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  UPDATE public.warranty_claims SET resolution=_resolution, admin_note=_note,
    reviewed_by=auth.uid(), reviewed_at=now() WHERE id=_id;
  IF _resolution = 'refund' THEN PERFORM public.escrow_refund(_c.order_id, 'Kafolat bo''yicha refund'); END IF;
  INSERT INTO public.notifications(user_id,title,message,type,related_order_id)
    VALUES (_c.client_id,'Kafolat javobi', COALESCE(_note,'Murojaatingiz ko''rib chiqildi: '||_resolution),'warranty_resolved',_c.order_id);
  RETURN jsonb_build_object('ok',true);
END; $$;

CREATE OR REPLACE FUNCTION public.admin_list_warranty_claims()
RETURNS TABLE(id uuid, order_id uuid, client_name text, master_name text, reason text, photos text[], resolution text, admin_note text, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
  RETURN QUERY SELECT w.id, w.order_id, pc.full_name, pm.full_name, w.reason, w.photos, w.resolution, w.admin_note, w.created_at
  FROM public.warranty_claims w
  LEFT JOIN public.profiles pc ON pc.user_id = w.client_id
  LEFT JOIN public.profiles pm ON pm.user_id = w.master_id
  ORDER BY w.created_at DESC;
END; $$;