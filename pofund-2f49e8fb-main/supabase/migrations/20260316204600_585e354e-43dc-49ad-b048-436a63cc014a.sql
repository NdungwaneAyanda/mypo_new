-- Consolidated, idempotent schema convergence migration
-- Final naming: funding_applications, application_documents, registered_funders

-- Remove legacy conflicting tables if they exist
DROP TABLE IF EXISTS public.po_application_documents CASCADE;
DROP TABLE IF EXISTS public.po_applications CASCADE;

-- Shared timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'supplier',
  company_name text,
  contact_name text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'supplier';
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Signup profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'supplier')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  industry text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  ALTER TABLE public.suppliers
    ADD CONSTRAINT suppliers_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);

DROP POLICY IF EXISTS "Users view own supplier" ON public.suppliers;
DROP POLICY IF EXISTS "Users insert own supplier" ON public.suppliers;
DROP POLICY IF EXISTS "Users update own supplier" ON public.suppliers;
CREATE POLICY "Users view own supplier" ON public.suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own supplier" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own supplier" ON public.suppliers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Funders
CREATE TABLE IF NOT EXISTS public.funders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  typical_funding_range text,
  preferred_industries text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.funders ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.funders ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.funders ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE public.funders ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.funders ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.funders ADD COLUMN IF NOT EXISTS typical_funding_range text;
ALTER TABLE public.funders ADD COLUMN IF NOT EXISTS preferred_industries text[];
ALTER TABLE public.funders ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.funders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  ALTER TABLE public.funders
    ADD CONSTRAINT funders_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_funders_user_id ON public.funders(user_id);

DROP POLICY IF EXISTS "Users view own funder" ON public.funders;
DROP POLICY IF EXISTS "Users insert own funder" ON public.funders;
DROP POLICY IF EXISTS "Users update own funder" ON public.funders;
CREATE POLICY "Users view own funder" ON public.funders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own funder" ON public.funders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own funder" ON public.funders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Funding applications (final canonical table)
CREATE TABLE IF NOT EXISTS public.funding_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  industry text NOT NULL,
  po_amount numeric NOT NULL,
  cost_of_delivery numeric,
  amount_needed numeric,
  customer_name text NOT NULL,
  payment_terms text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  assigned_funder_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS po_amount numeric;
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS cost_of_delivery numeric;
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS amount_needed numeric;
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS payment_terms text;
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS assigned_funder_id uuid;
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE public.funding_applications ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.funding_applications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  ALTER TABLE public.funding_applications
    ADD CONSTRAINT funding_applications_assigned_funder_id_fkey
    FOREIGN KEY (assigned_funder_id) REFERENCES public.funders(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_funding_applications_status ON public.funding_applications(status);
CREATE INDEX IF NOT EXISTS idx_funding_applications_assigned_funder_id ON public.funding_applications(assigned_funder_id);
CREATE INDEX IF NOT EXISTS idx_funding_applications_created_at ON public.funding_applications(created_at DESC);

DROP POLICY IF EXISTS "Anyone can submit funding applications" ON public.funding_applications;
DROP POLICY IF EXISTS "Anyone can view funding applications" ON public.funding_applications;
DROP POLICY IF EXISTS "Anyone can view their own application by id" ON public.funding_applications;
DROP POLICY IF EXISTS "Anyone can update funding applications" ON public.funding_applications;
DROP POLICY IF EXISTS "System can update applications" ON public.funding_applications;
CREATE POLICY "Anyone can submit funding applications" ON public.funding_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view funding applications" ON public.funding_applications FOR SELECT USING (true);
CREATE POLICY "Anyone can update funding applications" ON public.funding_applications FOR UPDATE USING (true);

DROP TRIGGER IF EXISTS update_funding_applications_updated_at ON public.funding_applications;
CREATE TRIGGER update_funding_applications_updated_at
BEFORE UPDATE ON public.funding_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Application documents
CREATE TABLE IF NOT EXISTS public.application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.funding_applications(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.application_documents ADD COLUMN IF NOT EXISTS application_id uuid;
ALTER TABLE public.application_documents ADD COLUMN IF NOT EXISTS document_type text;
ALTER TABLE public.application_documents ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.application_documents ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE public.application_documents ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE public.application_documents ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  ALTER TABLE public.application_documents
    ADD CONSTRAINT application_documents_application_id_fkey
    FOREIGN KEY (application_id) REFERENCES public.funding_applications(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_application_documents_application_id ON public.application_documents(application_id);

DROP POLICY IF EXISTS "Anyone can insert application documents" ON public.application_documents;
DROP POLICY IF EXISTS "Anyone can view application documents" ON public.application_documents;
CREATE POLICY "Anyone can insert application documents" ON public.application_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view application documents" ON public.application_documents FOR SELECT USING (true);

-- Registered funders
CREATE TABLE IF NOT EXISTS public.registered_funders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  funding_capacity text,
  industries text[],
  min_po_amount numeric,
  max_po_amount numeric,
  is_active boolean NOT NULL DEFAULT true,
  unsubscribe_token text DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.registered_funders ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.registered_funders ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE public.registered_funders ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.registered_funders ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.registered_funders ADD COLUMN IF NOT EXISTS funding_capacity text;
ALTER TABLE public.registered_funders ADD COLUMN IF NOT EXISTS industries text[];
ALTER TABLE public.registered_funders ADD COLUMN IF NOT EXISTS min_po_amount numeric;
ALTER TABLE public.registered_funders ADD COLUMN IF NOT EXISTS max_po_amount numeric;
ALTER TABLE public.registered_funders ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.registered_funders ADD COLUMN IF NOT EXISTS unsubscribe_token text DEFAULT encode(extensions.gen_random_bytes(16), 'hex');
ALTER TABLE public.registered_funders ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.registered_funders ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_registered_funders_email ON public.registered_funders(email);

DROP POLICY IF EXISTS "Anyone can register as a funder" ON public.registered_funders;
DROP POLICY IF EXISTS "Anyone can view funders" ON public.registered_funders;
CREATE POLICY "Anyone can register as a funder" ON public.registered_funders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view funders" ON public.registered_funders FOR SELECT USING (true);

-- Unsubscribed funders
CREATE TABLE IF NOT EXISTS public.unsubscribed_funders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  funder_id uuid REFERENCES public.registered_funders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.unsubscribed_funders ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.unsubscribed_funders ADD COLUMN IF NOT EXISTS funder_id uuid;
ALTER TABLE public.unsubscribed_funders ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.unsubscribed_funders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  ALTER TABLE public.unsubscribed_funders
    ADD CONSTRAINT unsubscribed_funders_funder_id_fkey
    FOREIGN KEY (funder_id) REFERENCES public.registered_funders(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_unsubscribed_funders_email ON public.unsubscribed_funders(email);

DROP POLICY IF EXISTS "Anyone can unsubscribe" ON public.unsubscribed_funders;
DROP POLICY IF EXISTS "Anyone can view unsubscribed" ON public.unsubscribed_funders;
CREATE POLICY "Anyone can unsubscribe" ON public.unsubscribed_funders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view unsubscribed" ON public.unsubscribed_funders FOR SELECT USING (true);

-- Access tokens
CREATE TABLE IF NOT EXISTS public.access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.funding_applications(id) ON DELETE CASCADE,
  funder_id uuid REFERENCES public.registered_funders(id) ON DELETE CASCADE,
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  token_type text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_tokens ADD COLUMN IF NOT EXISTS application_id uuid;
ALTER TABLE public.access_tokens ADD COLUMN IF NOT EXISTS funder_id uuid;
ALTER TABLE public.access_tokens ADD COLUMN IF NOT EXISTS token text DEFAULT encode(extensions.gen_random_bytes(32), 'hex');
ALTER TABLE public.access_tokens ADD COLUMN IF NOT EXISTS token_type text;
ALTER TABLE public.access_tokens ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '30 days');
ALTER TABLE public.access_tokens ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  ALTER TABLE public.access_tokens
    ADD CONSTRAINT access_tokens_application_id_fkey
    FOREIGN KEY (application_id) REFERENCES public.funding_applications(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.access_tokens
    ADD CONSTRAINT access_tokens_funder_id_fkey
    FOREIGN KEY (funder_id) REFERENCES public.registered_funders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_access_tokens_token ON public.access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_access_tokens_application_id ON public.access_tokens(application_id);

DROP POLICY IF EXISTS "System can insert tokens" ON public.access_tokens;
DROP POLICY IF EXISTS "Tokens are publicly readable by token value" ON public.access_tokens;
DROP POLICY IF EXISTS "Tokens are publicly readable" ON public.access_tokens;
CREATE POLICY "System can insert tokens" ON public.access_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Tokens are publicly readable" ON public.access_tokens FOR SELECT USING (true);

-- Funder offers
CREATE TABLE IF NOT EXISTS public.funder_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.funding_applications(id) ON DELETE CASCADE,
  funder_id uuid NOT NULL REFERENCES public.registered_funders(id) ON DELETE CASCADE,
  access_token_id uuid NOT NULL REFERENCES public.access_tokens(id) ON DELETE CASCADE,
  funding_amount numeric NOT NULL,
  interest_rate numeric,
  terms text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.funder_offers ADD COLUMN IF NOT EXISTS application_id uuid;
ALTER TABLE public.funder_offers ADD COLUMN IF NOT EXISTS funder_id uuid;
ALTER TABLE public.funder_offers ADD COLUMN IF NOT EXISTS access_token_id uuid;
ALTER TABLE public.funder_offers ADD COLUMN IF NOT EXISTS funding_amount numeric;
ALTER TABLE public.funder_offers ADD COLUMN IF NOT EXISTS interest_rate numeric;
ALTER TABLE public.funder_offers ADD COLUMN IF NOT EXISTS terms text;
ALTER TABLE public.funder_offers ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.funder_offers ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.funder_offers ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.funder_offers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  ALTER TABLE public.funder_offers
    ADD CONSTRAINT funder_offers_application_id_fkey
    FOREIGN KEY (application_id) REFERENCES public.funding_applications(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.funder_offers
    ADD CONSTRAINT funder_offers_funder_id_fkey
    FOREIGN KEY (funder_id) REFERENCES public.registered_funders(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE public.funder_offers
    ADD CONSTRAINT funder_offers_access_token_id_fkey
    FOREIGN KEY (access_token_id) REFERENCES public.access_tokens(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_funder_offers_application_id ON public.funder_offers(application_id);

DROP POLICY IF EXISTS "Anyone can insert offers" ON public.funder_offers;
DROP POLICY IF EXISTS "Anyone can view offers" ON public.funder_offers;
DROP POLICY IF EXISTS "System can update offers" ON public.funder_offers;
CREATE POLICY "Anyone can insert offers" ON public.funder_offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view offers" ON public.funder_offers FOR SELECT USING (true);
CREATE POLICY "System can update offers" ON public.funder_offers FOR UPDATE USING (true);

-- Storage bucket for uploaded funding documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('funding-documents', 'funding-documents', false)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, public = EXCLUDED.public;

DROP POLICY IF EXISTS "Authenticated upload funding documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated view funding documents" ON storage.objects;
CREATE POLICY "Authenticated upload funding documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'funding-documents');
CREATE POLICY "Authenticated view funding documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'funding-documents');

-- Realtime updates for dashboard
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.funding_applications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;