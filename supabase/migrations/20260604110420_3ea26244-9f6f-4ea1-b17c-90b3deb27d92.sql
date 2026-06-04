
-- Complaints
CREATE TABLE public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL,
  target_user_id UUID,
  target_order_id UUID,
  target_review_id UUID,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  admin_note TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users insert own complaints" ON public.complaints
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "users see own complaints" ON public.complaints
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "admin manage complaints" ON public.complaints
  FOR UPDATE TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Broadcasts
CREATE TABLE public.broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  send_sms BOOLEAN NOT NULL DEFAULT false,
  recipients_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.broadcasts TO authenticated;
GRANT ALL ON public.broadcasts TO service_role;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manage broadcasts" ON public.broadcasts
  FOR ALL TO authenticated USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- Admin broadcast RPC: creates notifications for the chosen audience
CREATE OR REPLACE FUNCTION public.admin_send_broadcast(_audience TEXT, _title TEXT, _message TEXT, _send_sms BOOLEAN DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _admin UUID := auth.uid(); _count INT := 0; _bid UUID;
BEGIN
  IF NOT has_role(_admin,'admin') THEN RAISE EXCEPTION 'admin only'; END IF;

  INSERT INTO public.broadcasts (sender_id, audience, title, message, send_sms)
    VALUES (_admin, _audience, _title, _message, _send_sms) RETURNING id INTO _bid;

  INSERT INTO public.notifications (user_id, sender_id, title, message, type)
  SELECT p.user_id, _admin, _title, _message, 'broadcast'
  FROM public.profiles p
  WHERE CASE
    WHEN _audience = 'clients' THEN p.role = 'client'
    WHEN _audience = 'masters' THEN p.role = 'master'
    ELSE true
  END;
  GET DIAGNOSTICS _count = ROW_COUNT;

  UPDATE public.broadcasts SET recipients_count = _count WHERE id = _bid;
  RETURN jsonb_build_object('ok', true, 'count', _count, 'broadcast_id', _bid);
END; $$;

-- Admin chat monitoring RPC (read-only flagged/recent messages)
CREATE OR REPLACE FUNCTION public.admin_recent_messages(_limit INT DEFAULT 100)
RETURNS TABLE(id UUID, sender_id UUID, receiver_id UUID, content TEXT, created_at TIMESTAMPTZ, sender_name TEXT, receiver_name TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'admin only'; END IF;
  RETURN QUERY
    SELECT m.id, m.sender_id, m.receiver_id, m.content, m.created_at,
           ps.full_name, pr.full_name
    FROM public.messages m
    LEFT JOIN public.profiles ps ON ps.user_id = m.sender_id
    LEFT JOIN public.profiles pr ON pr.user_id = m.receiver_id
    ORDER BY m.created_at DESC
    LIMIT _limit;
END; $$;
