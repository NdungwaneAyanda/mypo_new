
CREATE OR REPLACE FUNCTION public.notify_funders_on_new_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  SELECT net.http_post(
    url := 'https://zoefwpwayxumvggfkisz.supabase.co/functions/v1/notify-funders-on-new-opportunity',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := jsonb_build_object(
      'record', row_to_json(NEW)
    )
  ) INTO request_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to call notify-funders edge function: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_funders_on_new_application ON public.funding_applications;
CREATE TRIGGER trigger_notify_funders_on_new_application
  AFTER INSERT ON public.funding_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_funders_on_new_application();
