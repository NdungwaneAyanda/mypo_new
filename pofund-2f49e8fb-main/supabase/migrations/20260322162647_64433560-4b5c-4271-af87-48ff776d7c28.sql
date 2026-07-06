
-- Fix: safely add to realtime publication only if not already there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'funding_applications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.funding_applications;
  END IF;
END $$;
