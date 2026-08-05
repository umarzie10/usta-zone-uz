DROP POLICY IF EXISTS "Settings viewable by everyone" ON public.platform_settings;
REVOKE SELECT ON public.platform_settings FROM anon;
CREATE POLICY "Admins can view settings" ON public.platform_settings FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
GRANT EXECUTE ON FUNCTION public.get_commission_percent() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_founding_config() TO anon, authenticated;