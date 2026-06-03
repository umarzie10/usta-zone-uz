CREATE OR REPLACE FUNCTION public.trg_award_cashback_on_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    PERFORM public.award_cashback(NEW.id);
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS award_cashback_on_complete ON public.orders;
CREATE TRIGGER award_cashback_on_complete
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_award_cashback_on_complete();