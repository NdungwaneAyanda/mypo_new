
-- 1. Helper function for updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('supplier', 'funder')) DEFAULT 'supplier',
  company_name text,
  contact_name text,
  email text UNIQUE,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Auto-create profile on signup with default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'supplier');
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger for updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 3. Suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  industry text,
  contact_name text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- 4. Funders table
CREATE TABLE IF NOT EXISTS public.funders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  typical_funding_range text,
  preferred_industries text[],
  created_at timestamptz DEFAULT now()
);

-- 5. PO Applications table
CREATE TABLE IF NOT EXISTS public.po_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  po_amount_zar numeric NOT NULL,
  customer_name text NOT NULL,
  payment_terms text,
  additional_details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'funded', 'rejected')),
  assigned_funder_id uuid REFERENCES public.funders(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger for updated_at on po_applications
DROP TRIGGER IF EXISTS update_po_applications_updated_at ON public.po_applications;
CREATE TRIGGER update_po_applications_updated_at
  BEFORE UPDATE ON public.po_applications
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 6. Application Documents table - drop and recreate to match new schema
DROP TABLE IF EXISTS public.po_application_documents;
CREATE TABLE IF NOT EXISTS public.po_application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.po_applications(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN (
    'purchase_order',
    'company_registration',
    'bank_confirmation',
    'director_id',
    'company_proof_address',
    'director_proof_address'
  )),
  file_path text NOT NULL,
  file_name text,
  uploaded_at timestamptz DEFAULT now()
);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_po_applications_supplier_id ON public.po_applications(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_applications_status ON public.po_applications(status);
CREATE INDEX IF NOT EXISTS idx_po_applications_assigned_funder ON public.po_applications(assigned_funder_id);
CREATE INDEX IF NOT EXISTS idx_po_app_documents_app_id ON public.po_application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX IF NOT EXISTS idx_funders_user_id ON public.funders(user_id);

-- 8. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_application_documents ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies

-- Profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Suppliers
CREATE POLICY "Users view own supplier" ON public.suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own supplier" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own supplier" ON public.suppliers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Funders
CREATE POLICY "Users view own funder" ON public.funders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own funder" ON public.funders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own funder" ON public.funders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PO Applications
CREATE POLICY "Suppliers view own apps" ON public.po_applications FOR SELECT USING (
  supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid())
);
CREATE POLICY "Suppliers insert own apps" ON public.po_applications FOR INSERT WITH CHECK (
  supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid())
);
CREATE POLICY "Suppliers update own apps" ON public.po_applications FOR UPDATE USING (
  supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid())
) WITH CHECK (
  supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid())
);
CREATE POLICY "Funders view pending apps" ON public.po_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.funders WHERE user_id = auth.uid())
  AND (status = 'pending' OR assigned_funder_id IN (
    SELECT id FROM public.funders WHERE user_id = auth.uid()
  ))
);

-- PO Application Documents
CREATE POLICY "View docs via own apps" ON public.po_application_documents FOR SELECT USING (
  application_id IN (
    SELECT id FROM public.po_applications WHERE
      supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid())
      OR (
        status = 'pending' AND EXISTS (SELECT 1 FROM public.funders WHERE user_id = auth.uid())
      )
  )
);
CREATE POLICY "Insert docs via own apps" ON public.po_application_documents FOR INSERT WITH CHECK (
  application_id IN (
    SELECT id FROM public.po_applications WHERE
      supplier_id IN (SELECT id FROM public.suppliers WHERE user_id = auth.uid())
  )
);

-- 10. Storage Bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('po-documents', 'po-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Authenticated upload to po-documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'po-documents');

CREATE POLICY "Users view own uploaded files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'po-documents');
