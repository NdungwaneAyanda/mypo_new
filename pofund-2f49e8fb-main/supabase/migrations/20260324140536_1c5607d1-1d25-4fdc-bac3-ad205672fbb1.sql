
-- Drop existing trigger and function, then recreate to handle both INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_notify_funders_on_new_application ON public.funding_applications;
DROP FUNCTION IF EXISTS public.notify_funders_on_new_application();

-- New function that passes event_type in the payload
CREATE OR REPLACE FUNCTION public.notify_funders_on_new_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
declare
  request_id bigint;
  event text;
begin
  IF TG_OP = 'INSERT' THEN
    event := 'INSERT';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only notify on status change to 'successful'
    IF NEW.status = 'successful' AND (OLD.status IS DISTINCT FROM 'successful') THEN
      event := 'UPDATE';
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  select net.http_post(
    url := 'https://zoefwpwayxumvggfkisz.supabase.co/functions/v1/notify-funders-on-new-opportunity',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := jsonb_build_object('record', row_to_json(NEW), 'event_type', event)
  ) into request_id;

  RETURN NEW;
exception when others then
  raise warning 'Failed to call notify-funders edge function: %', sqlerrm;
  RETURN NEW;
end;
$$;

-- Trigger on INSERT
CREATE TRIGGER trigger_notify_funders_on_insert
  AFTER INSERT ON public.funding_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_funders_on_new_application();

-- Trigger on UPDATE (fires only when status changes to 'successful' via function logic)
CREATE TRIGGER trigger_notify_funders_on_update
  AFTER UPDATE ON public.funding_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_funders_on_new_application();
