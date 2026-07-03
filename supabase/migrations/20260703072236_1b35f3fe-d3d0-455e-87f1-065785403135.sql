
-- 1) master_profiles: hide sensitive columns from anon/authenticated
REVOKE SELECT (card_number, bank_account, tax_info, id_document_url, selfie_url)
  ON public.master_profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_master_profile()
RETURNS SETOF public.master_profiles
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.master_profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.admin_get_master_profile(_user_id uuid)
RETURNS SETOF public.master_profiles
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'admin only'; END IF;
  RETURN QUERY SELECT * FROM public.master_profiles WHERE user_id = _user_id;
END; $$;

-- 2) profiles: hide phone from other users
REVOKE SELECT (phone) ON public.profiles FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.admin_list_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'admin only'; END IF;
  RETURN QUERY SELECT * FROM public.profiles ORDER BY created_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_get_profiles(_user_ids uuid[])
RETURNS SETOF public.profiles
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN RAISE EXCEPTION 'admin only'; END IF;
  RETURN QUERY SELECT * FROM public.profiles WHERE user_id = ANY(_user_ids);
END; $$;

GRANT EXECUTE ON FUNCTION public.get_my_master_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_master_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_profiles(uuid[]) TO authenticated;

-- 3) promo_codes: only active, non-expired codes are public
DROP POLICY IF EXISTS "Promo codes viewable" ON public.promo_codes;
CREATE POLICY "Active promo codes viewable"
  ON public.promo_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));
