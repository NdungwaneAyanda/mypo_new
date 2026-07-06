
-- Safely add to realtime publication (ignore if already member)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.funding_applications;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END;
$$;
