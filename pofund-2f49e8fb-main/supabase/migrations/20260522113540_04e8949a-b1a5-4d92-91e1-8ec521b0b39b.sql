DROP TRIGGER IF EXISTS notify_funders_on_funding_application_change ON public.funding_applications;
DROP TRIGGER IF EXISTS trg_notify_funders_insert ON public.funding_applications;
DROP TRIGGER IF EXISTS trg_notify_funders_update ON public.funding_applications;

CREATE TRIGGER notify_funders_on_funding_application_change
AFTER INSERT OR UPDATE OF status ON public.funding_applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_funders_on_new_application();