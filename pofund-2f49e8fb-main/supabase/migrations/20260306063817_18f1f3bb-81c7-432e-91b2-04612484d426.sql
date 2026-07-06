
-- Fix po_applications: drop RESTRICTIVE SELECT policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Suppliers view own apps" ON public.po_applications;
DROP POLICY IF EXISTS "Funders view pending apps" ON public.po_applications;

CREATE POLICY "Suppliers view own apps"
ON public.po_applications FOR SELECT TO authenticated
USING (
  supplier_id IN (
    SELECT id FROM public.suppliers WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Funders view pending apps"
ON public.po_applications FOR SELECT TO authenticated
USING (
  (EXISTS (SELECT 1 FROM public.funders WHERE funders.user_id = auth.uid()))
  AND (
    status = 'pending'
    OR assigned_funder_id IN (
      SELECT id FROM public.funders WHERE funders.user_id = auth.uid()
    )
  )
);

-- Add funder UPDATE policy for claiming
DROP POLICY IF EXISTS "Funders claim pending apps" ON public.po_applications;
CREATE POLICY "Funders claim pending apps"
ON public.po_applications FOR UPDATE TO authenticated
USING (
  status = 'pending'
  AND EXISTS (SELECT 1 FROM public.funders WHERE funders.user_id = auth.uid())
)
WITH CHECK (
  assigned_funder_id IN (SELECT id FROM public.funders WHERE funders.user_id = auth.uid())
);

-- Fix po_application_documents: drop RESTRICTIVE SELECT and recreate as PERMISSIVE
DROP POLICY IF EXISTS "View docs via own apps" ON public.po_application_documents;
DROP POLICY IF EXISTS "Insert docs via own apps" ON public.po_application_documents;

CREATE POLICY "View docs via own apps"
ON public.po_application_documents FOR SELECT TO authenticated
USING (
  application_id IN (
    SELECT id FROM public.po_applications
    WHERE supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Funders view docs for accessible apps"
ON public.po_application_documents FOR SELECT TO authenticated
USING (
  application_id IN (
    SELECT id FROM public.po_applications
    WHERE (status = 'pending')
       OR (assigned_funder_id IN (SELECT id FROM public.funders WHERE user_id = auth.uid()))
  )
  AND EXISTS (SELECT 1 FROM public.funders WHERE user_id = auth.uid())
);

CREATE POLICY "Insert docs via own apps"
ON public.po_application_documents FOR INSERT TO authenticated
WITH CHECK (
  application_id IN (
    SELECT id FROM public.po_applications
    WHERE supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid())
  )
);
