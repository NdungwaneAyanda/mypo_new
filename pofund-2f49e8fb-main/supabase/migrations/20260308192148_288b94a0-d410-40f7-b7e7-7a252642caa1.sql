ALTER TABLE public.po_applications
  ADD COLUMN IF NOT EXISTS cost_of_delivery numeric,
  ADD COLUMN IF NOT EXISTS amount_needed numeric;