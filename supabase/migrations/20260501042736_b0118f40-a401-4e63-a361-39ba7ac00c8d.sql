-- Lock down tables that should NOT be exposed to anon via GraphQL/PostgREST.
-- These tables still allow authenticated users via RLS policies.
REVOKE SELECT ON public.notifications FROM anon;
REVOKE SELECT ON public.messages FROM anon;
REVOKE SELECT ON public.orders FROM anon;
REVOKE SELECT ON public.transactions FROM anon;
REVOKE SELECT ON public.subscriptions FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.withdraw_requests FROM anon;

-- Lock down admin_delete_user: only authenticated users (the function itself enforces admin role).
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(uuid) TO authenticated;

-- create_free_subscription is a trigger function; it should not be callable directly.
REVOKE EXECUTE ON FUNCTION public.create_free_subscription() FROM PUBLIC, anon, authenticated;