-- ============================================================
-- MyPO PROD BOOTSTRAP — One-time schema snapshot
-- Target project:  prod_pofund (ref: jyzjsmpelpeotkzkskji)
-- Source:          Lovable Cloud dev (ref: zoefwpwayxumvggfkisz)
-- Generated:       2026-05-01
-- Run ONCE in:     Supabase Dashboard → prod_pofund → SQL Editor → New query → paste → Run
--
-- DO NOT run this against the dev project.
-- DO NOT add this file to supabase/migrations/ (it is not a Lovable Cloud migration).
-- After this runs successfully, all future schema changes go via:
--     supabase link --project-ref jyzjsmpelpeotkzkskji
--     supabase db push
-- ============================================================

-- ------------------------------------------------------------
-- 0. EXTENSIONS
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA extensions;

-- ------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('supplier', 'funder');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- 2. SEQUENCES (for human-friendly ref codes: SUP-0001, FUN-0001, APP-0001)
--    Starting at 1 in prod (clean slate, no real data to migrate).
-- ------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.seq_supplier_ref    START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.seq_funder_ref      START WITH 1;
CREATE SEQUENCE IF NOT EXISTS public.seq_application_ref START WITH 1;

-- ------------------------------------------------------------
-- 3. UTILITY FUNCTIONS (created early because triggers depend on them)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.assign_supplier_ref()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.ref_code IS NULL THEN
    NEW.ref_code := 'SUP-' || lpad(nextval('public.seq_supplier_ref')::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.assign_funder_ref()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.ref_code IS NULL THEN
    NEW.ref_code := 'FUN-' || lpad(nextval('public.seq_funder_ref')::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.assign_application_ref()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.ref_code IS NULL THEN
    NEW.ref_code := 'APP-' || lpad(nextval('public.seq_application_ref')::text, 4, '0');
  END IF;
  RETURN NEW;
END; $$;

-- ------------------------------------------------------------
-- 4. TABLES
-- ------------------------------------------------------------

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id           uuid PRIMARY KEY,
  company_name text,
  contact_name text,
  email        text,
  phone        text,
  ref_code     text UNIQUE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL UNIQUE,
  company_name text NOT NULL,
  contact_name text,
  email        text,
  phone        text,
  industry     text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);

-- registered_funders
CREATE TABLE IF NOT EXISTS public.registered_funders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid,
  company_name        text NOT NULL,
  contact_name        text NOT NULL,
  email               text NOT NULL,
  phone               text,
  company_website     text,
  funding_capacity    text,
  funding_description text,
  industries          text[],
  min_po_amount       numeric,
  max_po_amount       numeric,
  years_in_business   integer,
  is_active           boolean NOT NULL DEFAULT true,
  ref_code            text UNIQUE,
  unsubscribe_token   text NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_registered_funders_email ON public.registered_funders(email);

-- funding_applications
CREATE TABLE IF NOT EXISTS public.funding_applications (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name        text NOT NULL,
  contact_name        text NOT NULL,
  email               text NOT NULL,
  phone               text,
  industry            text NOT NULL,
  po_amount           numeric NOT NULL,
  cost_of_delivery    numeric,
  amount_needed       numeric,
  customer_name       text NOT NULL,
  payment_terms       text NOT NULL,
  description         text,
  status              text NOT NULL DEFAULT 'pending',
  assigned_funder_id  uuid,
  ref_code            text UNIQUE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_funding_applications_email              ON public.funding_applications(email);
CREATE INDEX IF NOT EXISTS idx_funding_applications_status             ON public.funding_applications(status);
CREATE INDEX IF NOT EXISTS idx_funding_applications_assigned_funder_id ON public.funding_applications(assigned_funder_id);
CREATE INDEX IF NOT EXISTS idx_funding_applications_created_at         ON public.funding_applications(created_at DESC);

-- application_documents
CREATE TABLE IF NOT EXISTS public.application_documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  document_type  text NOT NULL,
  file_name      text NOT NULL,
  file_path      text NOT NULL,
  file_size      bigint,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_application_documents_application_id ON public.application_documents(application_id);

-- application_messages
CREATE TABLE IF NOT EXISTS public.application_messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  sender_id      uuid NOT NULL,
  receiver_id    uuid NOT NULL,
  message_text   text NOT NULL,
  is_read        boolean NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_application_messages_application_id ON public.application_messages(application_id);
CREATE INDEX IF NOT EXISTS idx_application_messages_sender_id      ON public.application_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_application_messages_receiver_id    ON public.application_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_application_messages_created_at     ON public.application_messages(created_at);

-- user_roles (separate table — never store roles on profiles)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL,
  role       public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- ------------------------------------------------------------
-- 5. SECURITY DEFINER HELPER FUNCTIONS (used by RLS — must be SECURITY DEFINER)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.user_owns_application(_app_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.funding_applications fa
    JOIN public.profiles p ON p.email = fa.email
    WHERE fa.id = _app_id AND p.id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_assigned_funder(_app_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.funding_applications fa
    JOIN public.registered_funders rf ON rf.id = fa.assigned_funder_id
    WHERE fa.id = _app_id AND rf.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.resolve_chat_recipient(_application_id uuid, _current_user_id uuid)
RETURNS uuid LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  _app_email text;
  _assigned_funder_id uuid;
  _resolved uuid;
BEGIN
  SELECT email, assigned_funder_id INTO _app_email, _assigned_funder_id
  FROM public.funding_applications WHERE id = _application_id;

  IF NOT FOUND THEN RETURN NULL; END IF;

  IF EXISTS (
    SELECT 1 FROM public.registered_funders
    WHERE id = _assigned_funder_id AND user_id = _current_user_id
  ) THEN
    SELECT id INTO _resolved FROM public.profiles WHERE email = _app_email LIMIT 1;
    RETURN _resolved;
  ELSE
    SELECT user_id INTO _resolved FROM public.registered_funders WHERE id = _assigned_funder_id LIMIT 1;
    RETURN _resolved;
  END IF;
END; $$;

-- ------------------------------------------------------------
-- 6. AUTH TRIGGER — auto-create profile on signup
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------
-- 7. EDGE-FUNCTION NOTIFY TRIGGER
--    NOTE: URL points to PROD project (jyzjsmpelpeotkzkskji), not dev.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_funders_on_new_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  request_id bigint;
  event text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    event := 'INSERT';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'successful' AND (OLD.status IS DISTINCT FROM 'successful') THEN
      event := 'UPDATE';
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  SELECT net.http_post(
    url := 'https://jyzjsmpelpeotkzkskji.supabase.co/functions/v1/notify-funders-on-new-opportunity',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('supabase.service_role_key', true)
    ),
    body := jsonb_build_object('record', row_to_json(NEW), 'event_type', event)
  ) INTO request_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Failed to call notify-funders edge function: %', sqlerrm;
  RETURN NEW;
END; $$;

-- ------------------------------------------------------------
-- 8. TABLE TRIGGERS
-- ------------------------------------------------------------
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_assign_supplier_ref ON public.profiles;
CREATE TRIGGER trg_assign_supplier_ref
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_supplier_ref();

DROP TRIGGER IF EXISTS trg_assign_funder_ref ON public.registered_funders;
CREATE TRIGGER trg_assign_funder_ref
  BEFORE INSERT ON public.registered_funders
  FOR EACH ROW EXECUTE FUNCTION public.assign_funder_ref();

DROP TRIGGER IF EXISTS update_funding_applications_updated_at ON public.funding_applications;
CREATE TRIGGER update_funding_applications_updated_at
  BEFORE UPDATE ON public.funding_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_assign_application_ref ON public.funding_applications;
CREATE TRIGGER trg_assign_application_ref
  BEFORE INSERT ON public.funding_applications
  FOR EACH ROW EXECUTE FUNCTION public.assign_application_ref();

DROP TRIGGER IF EXISTS trigger_notify_funders_on_insert ON public.funding_applications;
CREATE TRIGGER trigger_notify_funders_on_insert
  AFTER INSERT ON public.funding_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_funders_on_new_application();

DROP TRIGGER IF EXISTS trigger_notify_funders_on_update ON public.funding_applications;
CREATE TRIGGER trigger_notify_funders_on_update
  AFTER UPDATE ON public.funding_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_funders_on_new_application();

-- ------------------------------------------------------------
-- 9. ROW-LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registered_funders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_applications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_messages  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles            ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "Users view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users view own profile"   ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- suppliers
DROP POLICY IF EXISTS "Users view own supplier"   ON public.suppliers;
DROP POLICY IF EXISTS "Users insert own supplier" ON public.suppliers;
DROP POLICY IF EXISTS "Users update own supplier" ON public.suppliers;
CREATE POLICY "Users view own supplier"   ON public.suppliers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own supplier" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own supplier" ON public.suppliers FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- registered_funders
DROP POLICY IF EXISTS "Anyone can view funders"        ON public.registered_funders;
DROP POLICY IF EXISTS "Anyone can register as a funder" ON public.registered_funders;
DROP POLICY IF EXISTS "Funders can update own record"  ON public.registered_funders;
CREATE POLICY "Anyone can view funders"        ON public.registered_funders FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can register as a funder" ON public.registered_funders FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Funders can update own record"  ON public.registered_funders FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- funding_applications
DROP POLICY IF EXISTS "Anyone can submit funding applications" ON public.funding_applications;
DROP POLICY IF EXISTS "Owner or funder can view applications"  ON public.funding_applications;
DROP POLICY IF EXISTS "Owner can update own pending application" ON public.funding_applications;
DROP POLICY IF EXISTS "Funders can claim or update applications" ON public.funding_applications;
CREATE POLICY "Anyone can submit funding applications" ON public.funding_applications
  FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Owner or funder can view applications" ON public.funding_applications
  FOR SELECT TO authenticated
  USING (
    public.user_owns_application(id, auth.uid())
    OR public.user_is_assigned_funder(id, auth.uid())
    OR (status = ANY (ARRAY['pending'::text, 'reviewed'::text])
        AND EXISTS (SELECT 1 FROM public.registered_funders rf WHERE rf.user_id = auth.uid() AND rf.is_active = true))
  );
CREATE POLICY "Owner can update own pending application" ON public.funding_applications
  FOR UPDATE TO authenticated
  USING (public.user_owns_application(id, auth.uid()) AND status = 'pending')
  WITH CHECK (public.user_owns_application(id, auth.uid()));
CREATE POLICY "Funders can claim or update applications" ON public.funding_applications
  FOR UPDATE TO authenticated
  USING (
    public.user_is_assigned_funder(id, auth.uid())
    OR (status = 'pending' AND assigned_funder_id IS NULL
        AND EXISTS (SELECT 1 FROM public.registered_funders rf WHERE rf.user_id = auth.uid() AND rf.is_active = true))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.registered_funders rf WHERE rf.id = funding_applications.assigned_funder_id AND rf.user_id = auth.uid())
  );

-- application_documents
DROP POLICY IF EXISTS "Owner or assigned funder can view documents" ON public.application_documents;
DROP POLICY IF EXISTS "Owner can insert documents"                  ON public.application_documents;
DROP POLICY IF EXISTS "Owner can delete own documents"              ON public.application_documents;
CREATE POLICY "Owner or assigned funder can view documents" ON public.application_documents
  FOR SELECT TO authenticated
  USING (public.user_owns_application(application_id, auth.uid()) OR public.user_is_assigned_funder(application_id, auth.uid()));
CREATE POLICY "Owner can insert documents" ON public.application_documents
  FOR INSERT TO authenticated
  WITH CHECK (public.user_owns_application(application_id, auth.uid()));
CREATE POLICY "Owner can delete own documents" ON public.application_documents
  FOR DELETE TO authenticated
  USING (public.user_owns_application(application_id, auth.uid()));

-- application_messages
DROP POLICY IF EXISTS "Users can view messages in their applications"   ON public.application_messages;
DROP POLICY IF EXISTS "Users can insert messages in their applications" ON public.application_messages;
CREATE POLICY "Users can view messages in their applications" ON public.application_messages
  FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can insert messages in their applications" ON public.application_messages
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());

-- user_roles
DROP POLICY IF EXISTS "Users view own roles"   ON public.user_roles;
DROP POLICY IF EXISTS "Users insert own roles" ON public.user_roles;
CREATE POLICY "Users view own roles"   ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 10. ANALYTICS VIEWS (star schema for reporting)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.dim_supplier AS
  SELECT id AS supplier_key, ref_code AS supplier_ref,
         company_name, contact_name, email, phone,
         created_at AS supplier_created_at
  FROM public.profiles;

CREATE OR REPLACE VIEW public.dim_funder AS
  SELECT id AS funder_key, ref_code AS funder_ref,
         company_name, contact_name, email, phone,
         industries, min_po_amount, max_po_amount, funding_capacity, is_active,
         created_at AS funder_created_at
  FROM public.registered_funders;

CREATE OR REPLACE VIEW public.dim_date AS
  SELECT d::date AS date_key,
         EXTRACT(year    FROM d)::int AS year,
         EXTRACT(quarter FROM d)::int AS quarter,
         EXTRACT(month   FROM d)::int AS month,
         to_char(d, 'Month')          AS month_name,
         EXTRACT(week    FROM d)::int AS week,
         EXTRACT(day     FROM d)::int AS day,
         EXTRACT(dow     FROM d)::int AS day_of_week,
         to_char(d, 'Day')            AS day_name
  FROM generate_series(
    (now() - interval '5 years')::date,
    (now() + interval '1 year')::date,
    interval '1 day'
  ) d(d);

CREATE OR REPLACE VIEW public.fact_applications AS
  SELECT fa.id                AS application_key,
         fa.ref_code          AS application_ref,
         p.id                 AS supplier_key,
         p.ref_code           AS supplier_ref,
         fa.assigned_funder_id AS funder_key,
         rf.ref_code          AS funder_ref,
         fa.created_at::date  AS date_key,
         fa.status, fa.industry, fa.payment_terms,
         fa.po_amount, fa.amount_needed, fa.cost_of_delivery,
         (fa.po_amount - COALESCE(fa.cost_of_delivery, 0)) AS gross_margin,
         fa.customer_name, fa.company_name,
         fa.created_at, fa.updated_at
  FROM public.funding_applications fa
  LEFT JOIN public.profiles p            ON p.email = fa.email
  LEFT JOIN public.registered_funders rf ON rf.id = fa.assigned_funder_id;

-- ------------------------------------------------------------
-- 11. STORAGE BUCKET + POLICIES
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('funding-documents', 'funding-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Owner can upload funding docs"          ON storage.objects;
DROP POLICY IF EXISTS "Owner or funder can read funding docs"  ON storage.objects;
DROP POLICY IF EXISTS "Owner can delete own funding docs"      ON storage.objects;

CREATE POLICY "Owner can upload funding docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'funding-documents'
    AND (storage.foldername(name))[1] = 'applications'
    AND public.user_owns_application(((storage.foldername(name))[2])::uuid, auth.uid())
  );

CREATE POLICY "Owner or funder can read funding docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'funding-documents'
    AND (storage.foldername(name))[1] = 'applications'
    AND (
      public.user_owns_application(((storage.foldername(name))[2])::uuid, auth.uid())
      OR public.user_is_assigned_funder(((storage.foldername(name))[2])::uuid, auth.uid())
    )
  );

CREATE POLICY "Owner can delete own funding docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'funding-documents'
    AND (storage.foldername(name))[1] = 'applications'
    AND public.user_owns_application(((storage.foldername(name))[2])::uuid, auth.uid())
  );

-- ------------------------------------------------------------
-- 12. REALTIME (chat messages)
-- ------------------------------------------------------------
ALTER TABLE public.application_messages REPLICA IDENTITY FULL;
-- NOTE: production already has realtime configured as FOR ALL TABLES.
-- Do not run ALTER PUBLICATION here; it errors on FOR ALL TABLES publications.

-- ============================================================
-- DONE.
-- Verify with:
--   SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1;
--   SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace ORDER BY 1;
--   SELECT id FROM storage.buckets;
-- ============================================================
