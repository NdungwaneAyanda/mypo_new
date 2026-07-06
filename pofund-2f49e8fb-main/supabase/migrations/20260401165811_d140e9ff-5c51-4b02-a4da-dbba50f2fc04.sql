
CREATE OR REPLACE FUNCTION public.resolve_chat_recipient(
  _application_id uuid,
  _current_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _app_email text;
  _assigned_funder_id uuid;
  _resolved uuid;
BEGIN
  -- Get the application details
  SELECT email, assigned_funder_id
  INTO _app_email, _assigned_funder_id
  FROM public.funding_applications
  WHERE id = _application_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Check if current user is the funder (by checking registered_funders)
  IF EXISTS (
    SELECT 1 FROM public.registered_funders
    WHERE id = _assigned_funder_id AND user_id = _current_user_id
  ) THEN
    -- Current user is the funder, resolve the supplier by email
    SELECT id INTO _resolved FROM public.profiles WHERE email = _app_email LIMIT 1;
    RETURN _resolved;
  ELSE
    -- Current user is the supplier, resolve the funder's user_id
    SELECT user_id INTO _resolved FROM public.registered_funders WHERE id = _assigned_funder_id LIMIT 1;
    RETURN _resolved;
  END IF;
END;
$$;
