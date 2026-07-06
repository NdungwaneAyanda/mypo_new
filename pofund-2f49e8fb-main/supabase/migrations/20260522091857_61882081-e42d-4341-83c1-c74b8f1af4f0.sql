
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
