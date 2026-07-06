-- =========================================================
-- 1. Helper: link a funding_application to a supplier user
--    (matched by email on the profiles table)
-- =========================================================
CREATE OR REPLACE FUNCTION public.user_owns_application(_app_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.funding_applications fa
    JOIN public.profiles p ON p.email = fa.email
    WHERE fa.id = _app_id
      AND p.id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_assigned_funder(_app_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.funding_applications fa
    JOIN public.registered_funders rf ON rf.id = fa.assigned_funder_id
    WHERE fa.id = _app_id
      AND rf.user_id = _user_id
  );
$$;

-- =========================================================
-- 2. application_documents: replace open RLS with scoped RLS
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view application documents" ON public.application_documents;
DROP POLICY IF EXISTS "Anyone can insert application documents" ON public.application_documents;
DROP POLICY IF EXISTS "Owner or assigned funder can view documents" ON public.application_documents;
DROP POLICY IF EXISTS "Owner can insert documents" ON public.application_documents;
DROP POLICY IF EXISTS "Owner can delete own documents" ON public.application_documents;

CREATE POLICY "Owner or assigned funder can view documents"
ON public.application_documents
FOR SELECT
TO authenticated
USING (
  public.user_owns_application(application_id, auth.uid())
  OR public.user_is_assigned_funder(application_id, auth.uid())
);

CREATE POLICY "Owner can insert documents"
ON public.application_documents
FOR INSERT
TO authenticated
WITH CHECK (
  public.user_owns_application(application_id, auth.uid())
);

CREATE POLICY "Owner can delete own documents"
ON public.application_documents
FOR DELETE
TO authenticated
USING (
  public.user_owns_application(application_id, auth.uid())
);

-- =========================================================
-- 3. funding-documents bucket: enforce size + mime type
-- =========================================================
UPDATE storage.buckets
SET
  file_size_limit = 5242880, -- 5 MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
WHERE id = 'funding-documents';

-- =========================================================
-- 4. storage.objects RLS for funding-documents bucket
--    Path convention: applications/{application_id}/{doc_type}/{filename}
-- =========================================================
DROP POLICY IF EXISTS "Owner or funder can read funding docs" ON storage.objects;
DROP POLICY IF EXISTS "Owner can upload funding docs" ON storage.objects;
DROP POLICY IF EXISTS "Owner can delete own funding docs" ON storage.objects;

CREATE POLICY "Owner or funder can read funding docs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'funding-documents'
  AND (storage.foldername(name))[1] = 'applications'
  AND (
    public.user_owns_application(((storage.foldername(name))[2])::uuid, auth.uid())
    OR public.user_is_assigned_funder(((storage.foldername(name))[2])::uuid, auth.uid())
  )
);

CREATE POLICY "Owner can upload funding docs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'funding-documents'
  AND (storage.foldername(name))[1] = 'applications'
  AND public.user_owns_application(((storage.foldername(name))[2])::uuid, auth.uid())
);

CREATE POLICY "Owner can delete own funding docs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'funding-documents'
  AND (storage.foldername(name))[1] = 'applications'
  AND public.user_owns_application(((storage.foldername(name))[2])::uuid, auth.uid())
);