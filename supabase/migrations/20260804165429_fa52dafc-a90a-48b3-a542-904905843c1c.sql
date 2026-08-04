ALTER TABLE public.master_profiles ADD COLUMN IF NOT EXISTS founding_number integer;

WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY created_at ASC) rn FROM public.master_profiles
)
UPDATE public.master_profiles mp SET founding_number = r.rn
FROM ranked r WHERE r.id = mp.id AND r.rn <= 100 AND mp.founding_number IS NULL;

CREATE OR REPLACE FUNCTION public.assign_founding_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _n int;
BEGIN
  SELECT COALESCE(MAX(founding_number), 0) + 1 INTO _n FROM public.master_profiles;
  IF _n <= 100 THEN NEW.founding_number := _n; END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_assign_founding_number ON public.master_profiles;
CREATE TRIGGER trg_assign_founding_number
BEFORE INSERT ON public.master_profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_founding_number();

GRANT SELECT (founding_number) ON public.master_profiles TO anon, authenticated;
GRANT ALL ON public.master_profiles TO service_role;