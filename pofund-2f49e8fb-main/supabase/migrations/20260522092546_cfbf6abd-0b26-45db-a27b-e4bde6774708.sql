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
    IF NEW.status = 'successful' AND (OLD.status IS DISTINCT FROM 'successful') THEN
      event := 'UPDATE';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  select net.http_post(
    url := 'https://zoefwpwayxumvggfkisz.supabase.co/functions/v1/notify-funders-on-new-opportunity',
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('record', row_to_json(NEW), 'event_type', event)
  ) into request_id;

  RETURN NEW;
exception when others then
  raise warning 'Failed to call notify-funders edge function: %', sqlerrm;
  RETURN NEW;
end;
$$;

DROP TRIGGER IF EXISTS trigger_notify_funders_on_insert ON public.funding_applications;
DROP TRIGGER IF EXISTS trigger_notify_funders_on_update ON public.funding_applications;
DROP TRIGGER IF EXISTS trigger_notify_funders_on_new_application ON public.funding_applications;
DROP TRIGGER IF EXISTS trg_notify_funders_insert ON public.funding_applications;
DROP TRIGGER IF EXISTS trg_notify_funders_update ON public.funding_applications;

CREATE TRIGGER trg_notify_funders_insert
AFTER INSERT ON public.funding_applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_funders_on_new_application();

CREATE TRIGGER trg_notify_funders_update
AFTER UPDATE ON public.funding_applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_funders_on_new_application();