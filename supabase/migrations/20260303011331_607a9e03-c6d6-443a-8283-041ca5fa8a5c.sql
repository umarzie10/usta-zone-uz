
-- Update admin_delete_user to also delete notifications
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  DELETE FROM public.notifications WHERE user_id = target_user_id OR sender_id = target_user_id;
  DELETE FROM public.master_availability WHERE master_id IN (SELECT id FROM public.master_profiles WHERE user_id = target_user_id);
  DELETE FROM public.reviews WHERE client_id = target_user_id OR master_id = target_user_id;
  DELETE FROM public.messages WHERE sender_id = target_user_id OR receiver_id = target_user_id;
  DELETE FROM public.orders WHERE client_id = target_user_id OR master_id = target_user_id;
  DELETE FROM public.transactions WHERE user_id = target_user_id;
  DELETE FROM public.withdraw_requests WHERE master_id = target_user_id;
  DELETE FROM public.master_profiles WHERE user_id = target_user_id;
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$function$;
