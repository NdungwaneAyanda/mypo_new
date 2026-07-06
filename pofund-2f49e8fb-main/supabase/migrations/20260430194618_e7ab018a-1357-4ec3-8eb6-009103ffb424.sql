-- ============================================================
-- 1) LOCK DOWN funding_applications RLS
-- ============================================================
-- Drop overly-permissive public policies
DROP POLICY IF EXISTS "Anyone can view funding applications" ON public.funding_applications;
DROP POLICY IF EXISTS "Anyone can update funding applications" ON public.funding_applications;
DROP POLICY IF EXISTS "Anyone can submit funding applications" ON public.funding_applications;

-- Keep INSERT public (the apply form is unauthenticated by design)
CREATE POLICY "Anyone can submit funding applications"
  ON public.funding_applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- SELECT: owner (supplier) or assigned funder; funders can also see open opportunities (pending, no funder yet)
CREATE POLICY "Owner or funder can view applications"
  ON public.funding_applications
  FOR SELECT
  TO authenticated
  USING (
    public.user_owns_application(id, auth.uid())
    OR public.user_is_assigned_funder(id, auth.uid())
    OR (
      status IN ('pending', 'reviewed')
      AND EXISTS (
        SELECT 1 FROM public.registered_funders rf
        WHERE rf.user_id = auth.uid() AND rf.is_active = true
      )
    )
  );

-- UPDATE: owner can update their own pending application; assigned funder OR claiming funder can update status
CREATE POLICY "Owner can update own pending application"
  ON public.funding_applications
  FOR UPDATE
  TO authenticated
  USING (public.user_owns_application(id, auth.uid()) AND status = 'pending')
  WITH CHECK (public.user_owns_application(id, auth.uid()));

CREATE POLICY "Funders can claim or update applications"
  ON public.funding_applications
  FOR UPDATE
  TO authenticated
  USING (
    -- assigned funder
    public.user_is_assigned_funder(id, auth.uid())
    OR
    -- any active funder can claim a still-pending unassigned application
    (
      status = 'pending'
      AND assigned_funder_id IS NULL
      AND EXISTS (
        SELECT 1 FROM public.registered_funders rf
        WHERE rf.user_id = auth.uid() AND rf.is_active = true
      )
    )
  )
  WITH CHECK (
    -- after update, the row must belong to a real registered funder owned by this user
    EXISTS (
      SELECT 1 FROM public.registered_funders rf
      WHERE rf.id = assigned_funder_id AND rf.user_id = auth.uid()
    )
  );

-- ============================================================
-- 2) ADD MISSING INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_funding_applications_email
  ON public.funding_applications (email);

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles (email);

CREATE INDEX IF NOT EXISTS idx_application_messages_receiver_id
  ON public.application_messages (receiver_id);

CREATE INDEX IF NOT EXISTS idx_application_messages_sender_id
  ON public.application_messages (sender_id);

-- ============================================================
-- 3) RESTRICT SECURITY DEFINER FUNCTION EXECUTION
-- ============================================================
-- Helper functions should only be callable by signed-in users
REVOKE EXECUTE ON FUNCTION public.user_owns_application(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.user_is_assigned_funder(uuid, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.resolve_chat_recipient(uuid, uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.user_owns_application(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_assigned_funder(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_chat_recipient(uuid, uuid) TO authenticated;