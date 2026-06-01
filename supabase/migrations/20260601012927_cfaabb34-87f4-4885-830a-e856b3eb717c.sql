
-- 1) PRIVILEGE ESCALATION: Remove ability for users to insert their own role
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- 2) Subscriptions: Remove public SELECT policy (per-user policy already exists)
DROP POLICY IF EXISTS "Public view tiers for ranking" ON public.subscriptions;

-- 3) Profiles: revoke sensitive columns from anon (column-level grants)
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, user_id, full_name, avatar_url, city, region, role, created_at, updated_at) ON public.profiles TO anon;

-- 4) Master profiles: revoke balance/withdrawable_balance from anon and authenticated
REVOKE SELECT ON public.master_profiles FROM anon, authenticated;
GRANT SELECT (
  id, user_id, category_ids, skills, portfolio_urls,
  bio, experience_years, rating, reviews_count, jobs_completed,
  is_active, is_approved, created_at, updated_at
) ON public.master_profiles TO anon, authenticated;
-- service_role retains full access for admin/edge functions
GRANT ALL ON public.master_profiles TO service_role;

-- Helper RPC for owner to read their own balance
CREATE OR REPLACE FUNCTION public.get_my_master_balance()
RETURNS TABLE(balance numeric, withdrawable_balance numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT balance, withdrawable_balance
  FROM public.master_profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_master_balance() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_master_balance() TO authenticated;

-- Admin RPC to read all master balances
CREATE OR REPLACE FUNCTION public.admin_get_master_balances()
RETURNS TABLE(user_id uuid, balance numeric, withdrawable_balance numeric)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  RETURN QUERY SELECT mp.user_id, mp.balance, mp.withdrawable_balance FROM public.master_profiles mp;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_get_master_balances() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_master_balances() TO authenticated;

-- 5) Notifications: restrict who can be a recipient
DROP POLICY IF EXISTS "Users can create notifications for others" ON public.notifications;
CREATE POLICY "Users can create notifications for related parties"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE (o.client_id = auth.uid() AND o.master_id = notifications.user_id)
         OR (o.master_id = auth.uid() AND o.client_id = notifications.user_id)
         OR (o.id = notifications.related_order_id
             AND (o.client_id = auth.uid() OR o.master_id = auth.uid()))
    )
    OR EXISTS (
      SELECT 1 FROM public.messages m
      WHERE (m.sender_id = auth.uid() AND m.receiver_id = notifications.user_id)
         OR (m.receiver_id = auth.uid() AND m.sender_id = notifications.user_id)
    )
  )
);
