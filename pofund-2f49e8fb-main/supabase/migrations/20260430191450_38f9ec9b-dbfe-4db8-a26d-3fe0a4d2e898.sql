REVOKE EXECUTE ON FUNCTION public.user_owns_application(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_is_assigned_funder(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_owns_application(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_assigned_funder(uuid, uuid) TO authenticated;