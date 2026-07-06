-- 1. Add ref_code columns
ALTER TABLE public.funding_applications ADD COLUMN IF NOT EXISTS ref_code text UNIQUE;
ALTER TABLE public.registered_funders ADD COLUMN IF NOT EXISTS ref_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ref_code text UNIQUE;

-- 2. Sequences for ref codes
CREATE SEQUENCE IF NOT EXISTS public.seq_application_ref START 1;
CREATE SEQUENCE IF NOT EXISTS public.seq_funder_ref START 1;
CREATE SEQUENCE IF NOT EXISTS public.seq_supplier_ref START 1;

-- 3. Trigger functions to assign ref codes
CREATE OR REPLACE FUNCTION public.assign_application_ref()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.ref_code IS NULL THEN
    NEW.ref_code := 'APP-' || lpad(nextval('public.seq_application_ref')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_funder_ref()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.ref_code IS NULL THEN
    NEW.ref_code := 'FUN-' || lpad(nextval('public.seq_funder_ref')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_supplier_ref()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.ref_code IS NULL THEN
    NEW.ref_code := 'SUP-' || lpad(nextval('public.seq_supplier_ref')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Triggers
DROP TRIGGER IF EXISTS trg_assign_application_ref ON public.funding_applications;
CREATE TRIGGER trg_assign_application_ref
BEFORE INSERT ON public.funding_applications
FOR EACH ROW EXECUTE FUNCTION public.assign_application_ref();

DROP TRIGGER IF EXISTS trg_assign_funder_ref ON public.registered_funders;
CREATE TRIGGER trg_assign_funder_ref
BEFORE INSERT ON public.registered_funders
FOR EACH ROW EXECUTE FUNCTION public.assign_funder_ref();

DROP TRIGGER IF EXISTS trg_assign_supplier_ref ON public.profiles;
CREATE TRIGGER trg_assign_supplier_ref
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.assign_supplier_ref();

-- 5. Backfill existing rows in deterministic order
WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.funding_applications WHERE ref_code IS NULL
)
UPDATE public.funding_applications fa
SET ref_code = 'APP-' || lpad(o.rn::text, 4, '0')
FROM ordered o WHERE fa.id = o.id;

WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.registered_funders WHERE ref_code IS NULL
)
UPDATE public.registered_funders rf
SET ref_code = 'FUN-' || lpad(o.rn::text, 4, '0')
FROM ordered o WHERE rf.id = o.id;

WITH ordered AS (
  SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
  FROM public.profiles WHERE ref_code IS NULL
)
UPDATE public.profiles p
SET ref_code = 'SUP-' || lpad(o.rn::text, 4, '0')
FROM ordered o WHERE p.id = o.id;

-- Advance sequences past backfilled values
SELECT setval('public.seq_application_ref', GREATEST((SELECT count(*) FROM public.funding_applications), 1));
SELECT setval('public.seq_funder_ref', GREATEST((SELECT count(*) FROM public.registered_funders), 1));
SELECT setval('public.seq_supplier_ref', GREATEST((SELECT count(*) FROM public.profiles), 1));

-- 6. Star-schema views (security_invoker so RLS still applies)
CREATE OR REPLACE VIEW public.dim_supplier
WITH (security_invoker = true) AS
SELECT
  p.id              AS supplier_key,
  p.ref_code        AS supplier_ref,
  p.company_name,
  p.contact_name,
  p.email,
  p.phone,
  p.created_at      AS supplier_created_at
FROM public.profiles p;

CREATE OR REPLACE VIEW public.dim_funder
WITH (security_invoker = true) AS
SELECT
  rf.id                  AS funder_key,
  rf.ref_code            AS funder_ref,
  rf.company_name,
  rf.contact_name,
  rf.email,
  rf.phone,
  rf.industries,
  rf.min_po_amount,
  rf.max_po_amount,
  rf.funding_capacity,
  rf.is_active,
  rf.created_at          AS funder_created_at
FROM public.registered_funders rf;

CREATE OR REPLACE VIEW public.dim_date
WITH (security_invoker = true) AS
SELECT
  d::date                                 AS date_key,
  EXTRACT(year FROM d)::int               AS year,
  EXTRACT(quarter FROM d)::int            AS quarter,
  EXTRACT(month FROM d)::int              AS month,
  to_char(d, 'Month')                     AS month_name,
  EXTRACT(week FROM d)::int               AS week,
  EXTRACT(day FROM d)::int                AS day,
  EXTRACT(dow FROM d)::int                AS day_of_week,
  to_char(d, 'Day')                       AS day_name
FROM generate_series(
  (now() - interval '5 years')::date,
  (now() + interval '1 year')::date,
  interval '1 day'
) AS d;

CREATE OR REPLACE VIEW public.fact_applications
WITH (security_invoker = true) AS
SELECT
  fa.id                       AS application_key,
  fa.ref_code                 AS application_ref,
  p.id                        AS supplier_key,
  p.ref_code                  AS supplier_ref,
  fa.assigned_funder_id       AS funder_key,
  rf.ref_code                 AS funder_ref,
  fa.created_at::date         AS date_key,
  fa.status,
  fa.industry,
  fa.payment_terms,
  fa.po_amount,
  fa.amount_needed,
  fa.cost_of_delivery,
  (fa.po_amount - COALESCE(fa.cost_of_delivery, 0))            AS gross_margin,
  fa.customer_name,
  fa.company_name,
  fa.created_at,
  fa.updated_at
FROM public.funding_applications fa
LEFT JOIN public.profiles p             ON p.email = fa.email
LEFT JOIN public.registered_funders rf  ON rf.id = fa.assigned_funder_id;

-- Restrict views to authenticated users
REVOKE ALL ON public.dim_supplier, public.dim_funder, public.fact_applications FROM PUBLIC, anon;
GRANT SELECT ON public.dim_supplier, public.dim_funder, public.fact_applications TO authenticated;
GRANT SELECT ON public.dim_date TO authenticated, anon;