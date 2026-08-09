-- 1) profiles.phone column-level protection
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, full_name, avatar_url, city, region, role, is_verified, is_blocked, created_at, updated_at, latitude, longitude, last_seen_at, bonus_balance, referral_code, referred_by)
  ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.profiles TO service_role;

-- 2) wallet_withdrawals: RPC-only writes
REVOKE INSERT, UPDATE, DELETE ON public.wallet_withdrawals FROM anon, authenticated;
GRANT SELECT ON public.wallet_withdrawals TO authenticated;
GRANT ALL ON public.wallet_withdrawals TO service_role;

-- 3) portfolio bucket: ownership-checked UPDATE policy
DROP POLICY IF EXISTS "Users can update their own portfolio images" ON storage.objects;
CREATE POLICY "Users can update their own portfolio images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);