
-- Create master_availability table for working hours
CREATE TABLE public.master_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  master_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.master_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability is viewable by everyone"
ON public.master_availability FOR SELECT USING (true);

CREATE POLICY "Masters can manage their own availability"
ON public.master_availability FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.master_profiles mp WHERE mp.user_id = auth.uid() AND mp.id = master_availability.master_id)
);

CREATE POLICY "Admins can manage all availability"
ON public.master_availability FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create edge function for admin to delete users and their data
-- We'll use a DB function instead
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check caller is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Delete related data
  DELETE FROM public.master_availability WHERE master_id IN (SELECT id FROM public.master_profiles WHERE user_id = target_user_id);
  DELETE FROM public.reviews WHERE client_id = target_user_id OR master_id = target_user_id;
  DELETE FROM public.messages WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  DELETE FROM public.orders WHERE client_id = target_user_id OR master_id = target_user_id;
  DELETE FROM public.transactions WHERE user_id = target_user_id;
  DELETE FROM public.withdraw_requests WHERE master_id = target_user_id;
  DELETE FROM public.master_profiles WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;
