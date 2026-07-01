DO $$
DECLARE tbl record;
BEGIN
  FOR tbl IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname='public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.relname);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.relname);
  END LOOP;
END $$;

-- Public-readable tables (have permissive/public policies)
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.master_profiles TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT ON public.subscription_plans TO anon;
GRANT SELECT ON public.platform_settings TO anon;

-- Views + sequences
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;