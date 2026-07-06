
-- Create storage bucket for funding documents
INSERT INTO storage.buckets (id, name, public) VALUES ('funding-documents', 'funding-documents', false);

-- Create table to track funding applications and their documents
CREATE TABLE public.funding_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  po_amount NUMERIC NOT NULL,
  customer_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  payment_terms TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to track uploaded documents per application
CREATE TABLE public.application_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.funding_applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.funding_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

-- Public insert policy (no auth required for applicants)
CREATE POLICY "Anyone can submit funding applications"
  ON public.funding_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view their own application by id"
  ON public.funding_applications FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert application documents"
  ON public.application_documents FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view application documents"
  ON public.application_documents FOR SELECT
  USING (true);

-- Storage policies for funding-documents bucket
CREATE POLICY "Anyone can upload funding documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'funding-documents');

CREATE POLICY "Authenticated users can view funding documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'funding-documents');

-- Create funders table for registration
CREATE TABLE public.registered_funders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  funding_capacity TEXT,
  industries TEXT[],
  min_po_amount NUMERIC,
  max_po_amount NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.registered_funders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can register as a funder"
  ON public.registered_funders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view funders"
  ON public.registered_funders FOR SELECT
  USING (true);
