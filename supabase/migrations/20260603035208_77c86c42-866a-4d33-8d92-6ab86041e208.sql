-- Verification tier enum
CREATE TYPE verification_tier AS ENUM ('none','bronze','silver','gold');

-- Add to master_profiles
ALTER TABLE public.master_profiles
  ADD COLUMN IF NOT EXISTS verification_tier verification_tier NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Verification requests table
CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid NOT NULL,
  passport_url text,
  selfie_url text,
  certificate_url text,
  requested_tier verification_tier NOT NULL DEFAULT 'bronze',
  status text NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.verification_requests TO authenticated;
GRANT ALL ON public.verification_requests TO service_role;

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Masters can view own requests"
  ON public.verification_requests FOR SELECT
  USING (auth.uid() = master_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Masters can create own requests"
  ON public.verification_requests FOR INSERT
  WITH CHECK (auth.uid() = master_id);

CREATE POLICY "Masters can update own pending requests"
  ON public.verification_requests FOR UPDATE
  USING (auth.uid() = master_id AND status = 'pending');

CREATE POLICY "Admins can manage requests"
  ON public.verification_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_verification_requests_updated
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admin approve function: sets tier on master and updates master_profile
CREATE OR REPLACE FUNCTION public.admin_approve_verification(_request_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _master uuid; _tier verification_tier;
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  SELECT master_id, requested_tier INTO _master, _tier FROM public.verification_requests WHERE id = _request_id;
  IF _master IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;

  UPDATE public.verification_requests
    SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
        admin_note = _note,
        reviewed_by = auth.uid(),
        reviewed_at = now()
    WHERE id = _request_id;

  IF _approve THEN
    UPDATE public.master_profiles
      SET verification_tier = _tier, verified_at = now()
      WHERE user_id = _master;
    UPDATE public.profiles SET is_verified = true WHERE user_id = _master;
    INSERT INTO public.notifications (user_id, sender_id, title, message, type)
    VALUES (_master, auth.uid(), 'Verifikatsiya tasdiqlandi ✅',
            'Sizning ' || _tier::text || ' darajadagi verifikatsiyangiz tasdiqlandi.', 'verification_approved');
  ELSE
    INSERT INTO public.notifications (user_id, sender_id, title, message, type)
    VALUES (_master, auth.uid(), 'Verifikatsiya rad etildi',
            COALESCE(_note,'Iltimos, hujjatlarni qaytadan yuboring.'), 'verification_rejected');
  END IF;

  RETURN jsonb_build_object('ok', true);
END; $$;