-- Add claim tracking columns to notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS claimed_by uuid,
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

-- Function: atomically claim an emergency order
CREATE OR REPLACE FUNCTION public.claim_emergency_order(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _master uuid := auth.uid();
  _existing_master uuid;
  _order_status text;
BEGIN
  IF _master IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  -- Lock the order row
  SELECT master_id, status INTO _existing_master, _order_status
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'order_not_found');
  END IF;

  -- Already claimed by someone else
  IF _existing_master IS NOT NULL AND _existing_master <> _master THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_claimed', 'master_id', _existing_master);
  END IF;

  -- Assign master to order
  UPDATE public.orders
  SET master_id = _master,
      status = 'accepted',
      updated_at = now()
  WHERE id = _order_id;

  -- Mark all emergency notifications for this order as claimed
  UPDATE public.notifications
  SET claimed_by = _master,
      claimed_at = now(),
      is_read = CASE WHEN user_id <> _master THEN true ELSE is_read END
  WHERE related_order_id = _order_id
    AND type = 'emergency_order'
    AND claimed_by IS NULL;

  -- Notify the client that someone accepted
  INSERT INTO public.notifications (user_id, sender_id, title, message, type, related_order_id)
  SELECT client_id, _master,
         'Buyurtmangiz qabul qilindi ✅',
         'Bir usta sizning shoshilinch buyurtmangizni qabul qildi.',
         'order_accepted',
         _order_id
  FROM public.orders WHERE id = _order_id;

  RETURN jsonb_build_object('ok', true, 'order_id', _order_id, 'master_id', _master);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_emergency_order(uuid) TO authenticated;