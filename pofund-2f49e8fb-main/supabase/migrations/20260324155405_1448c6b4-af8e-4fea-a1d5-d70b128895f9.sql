
-- Add user_id column to registered_funders
ALTER TABLE public.registered_funders ADD COLUMN IF NOT EXISTS user_id uuid;

-- Add RLS policies for authenticated funder operations
CREATE POLICY "Funders can update own record" ON public.registered_funders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Drop unused tables (cascade to remove FK constraints)
DROP TABLE IF EXISTS public.funder_offers CASCADE;
DROP TABLE IF EXISTS public.access_tokens CASCADE;
DROP TABLE IF EXISTS public.unsubscribed_funders CASCADE;
DROP TABLE IF EXISTS public.funders CASCADE;
