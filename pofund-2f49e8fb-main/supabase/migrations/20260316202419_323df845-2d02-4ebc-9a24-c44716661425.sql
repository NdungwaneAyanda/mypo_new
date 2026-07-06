
-- Drop existing triggers/policies safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_funding_applications_updated_at ON public.funding_applications;

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'supplier',
  company_name text,
  contact_name text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role) VALUES (new.id, new.email, 'supplier');
  RETURN new;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. SUPPLIERS
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
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own supplier" ON public.suppliers;
DROP POLICY IF EXISTS "Users insert own supplier" ON public.suppliers;
DROP POLICY IF EXISTS "Users update own supplier" ON public.suppliers;
CREATE POLICY "Users view own supplier" ON public.suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own supplier" ON public.suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own supplier" ON public.suppliers FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. FUNDERS
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
ALTER TABLE public.funders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own funder" ON public.funders;
DROP POLICY IF EXISTS "Users insert own funder" ON public.funders;
DROP POLICY IF EXISTS "Users update own funder" ON public.funders;
CREATE POLICY "Users view own funder" ON public.funders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own funder" ON public.funders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own funder" ON public.funders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. FUNDING_APPLICATIONS (includes cost_of_delivery & amount_needed)
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
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.funding_applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can submit funding applications" ON public.funding_applications;
DROP POLICY IF EXISTS "Anyone can view funding applications" ON public.funding_applications;
DROP POLICY IF EXISTS "Anyone can view their own application by id" ON public.funding_applications;
DROP POLICY IF EXISTS "Anyone can update funding applications" ON public.funding_applications;
DROP POLICY IF EXISTS "System can update applications" ON public.funding_applications;
CREATE POLICY "Anyone can submit funding applications" ON public.funding_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view funding applications" ON public.funding_applications FOR SELECT USING (true);
CREATE POLICY "Anyone can update funding applications" ON public.funding_applications FOR UPDATE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER update_funding_applications_updated_at BEFORE UPDATE ON public.funding_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. APPLICATION_DOCUMENTS
CREATE TABLE IF NOT EXISTS public.application_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.funding_applications(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert application documents" ON public.application_documents;
DROP POLICY IF EXISTS "Anyone can view application documents" ON public.application_documents;
CREATE POLICY "Anyone can insert application documents" ON public.application_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view application documents" ON public.application_documents FOR SELECT USING (true);

-- 6. REGISTERED_FUNDERS
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
ALTER TABLE public.registered_funders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can register as a funder" ON public.registered_funders;
DROP POLICY IF EXISTS "Anyone can view funders" ON public.registered_funders;
CREATE POLICY "Anyone can register as a funder" ON public.registered_funders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view funders" ON public.registered_funders FOR SELECT USING (true);

-- 7. UNSUBSCRIBED_FUNDERS
CREATE TABLE IF NOT EXISTS public.unsubscribed_funders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funder_id uuid REFERENCES public.registered_funders(id),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.unsubscribed_funders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can unsubscribe" ON public.unsubscribed_funders;
DROP POLICY IF EXISTS "Anyone can view unsubscribed" ON public.unsubscribed_funders;
CREATE POLICY "Anyone can unsubscribe" ON public.unsubscribed_funders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view unsubscribed" ON public.unsubscribed_funders FOR SELECT USING (true);

-- 8. ACCESS_TOKENS
CREATE TABLE IF NOT EXISTS public.access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.funding_applications(id) ON DELETE CASCADE,
  funder_id uuid REFERENCES public.registered_funders(id),
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  token_type text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);
ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System can insert tokens" ON public.access_tokens;
DROP POLICY IF EXISTS "Tokens are publicly readable by token value" ON public.access_tokens;
DROP POLICY IF EXISTS "Tokens are publicly readable" ON public.access_tokens;
CREATE POLICY "System can insert tokens" ON public.access_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Tokens are publicly readable" ON public.access_tokens FOR SELECT USING (true);

-- 9. FUNDER_OFFERS
CREATE TABLE IF NOT EXISTS public.funder_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.funding_applications(id) ON DELETE CASCADE,
  funder_id uuid NOT NULL REFERENCES public.registered_funders(id),
  access_token_id uuid NOT NULL REFERENCES public.access_tokens(id),
  funding_amount numeric NOT NULL,
  interest_rate numeric,
  terms text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.funder_offers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert offers" ON public.funder_offers;
DROP POLICY IF EXISTS "Anyone can view offers" ON public.funder_offers;
DROP POLICY IF EXISTS "System can update offers" ON public.funder_offers;
CREATE POLICY "Anyone can insert offers" ON public.funder_offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view offers" ON public.funder_offers FOR SELECT USING (true);
CREATE POLICY "System can update offers" ON public.funder_offers FOR UPDATE USING (true);

-- 10. REALTIME (safe)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.funding_applications;
EXCEPTION WHEN duplicate_object THEN NULL;
END; $$;
