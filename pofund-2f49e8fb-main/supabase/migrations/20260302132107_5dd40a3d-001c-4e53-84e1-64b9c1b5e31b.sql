
-- Access tokens for secure, expiring links (funder opportunity links + supplier offer links)
CREATE TABLE public.access_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  application_id uuid NOT NULL REFERENCES public.funding_applications(id) ON DELETE CASCADE,
  funder_id uuid REFERENCES public.registered_funders(id) ON DELETE CASCADE,
  token_type text NOT NULL CHECK (token_type IN ('funder_opportunity', 'supplier_offers')),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.access_tokens ENABLE ROW LEVEL SECURITY;

-- Tokens are accessed via edge functions using service role, but allow select for public lookups
CREATE POLICY "Tokens are publicly readable by token value" ON public.access_tokens
  FOR SELECT USING (true);

CREATE POLICY "System can insert tokens" ON public.access_tokens
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_access_tokens_token ON public.access_tokens(token);
CREATE INDEX idx_access_tokens_application ON public.access_tokens(application_id);

-- Funder offers on applications
CREATE TABLE public.funder_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id uuid NOT NULL REFERENCES public.funding_applications(id) ON DELETE CASCADE,
  funder_id uuid NOT NULL REFERENCES public.registered_funders(id) ON DELETE CASCADE,
  access_token_id uuid NOT NULL REFERENCES public.access_tokens(id) ON DELETE CASCADE,
  funding_amount numeric NOT NULL,
  interest_rate numeric,
  terms text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.funder_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view offers" ON public.funder_offers
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert offers" ON public.funder_offers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update offers" ON public.funder_offers
  FOR UPDATE USING (true);

CREATE INDEX idx_funder_offers_application ON public.funder_offers(application_id);

-- Track unsubscribed funders
CREATE TABLE public.unsubscribed_funders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  funder_id uuid REFERENCES public.registered_funders(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.unsubscribed_funders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view unsubscribed" ON public.unsubscribed_funders
  FOR SELECT USING (true);

CREATE POLICY "Anyone can unsubscribe" ON public.unsubscribed_funders
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_unsubscribed_email ON public.unsubscribed_funders(email);

-- Add UPDATE policy to funding_applications so status can be changed
CREATE POLICY "System can update applications" ON public.funding_applications
  FOR UPDATE USING (true);

-- Add an unsubscribe_token to registered_funders
ALTER TABLE public.registered_funders ADD COLUMN unsubscribe_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');
ALTER TABLE public.registered_funders ADD COLUMN is_active boolean NOT NULL DEFAULT true;
