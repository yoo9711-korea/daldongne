CREATE TABLE IF NOT EXISTS public.book_order_print_readiness (
  id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  version INTEGER NOT NULL DEFAULT 1,
  final_pdf_url TEXT,
  cover_pdf_url TEXT,
  interior_pdf_url TEXT,
  trim_size TEXT,
  trim_width_mm INTEGER,
  trim_height_mm INTEGER,
  bleed_mm INTEGER DEFAULT 3,
  page_count INTEGER,
  cover_paper TEXT,
  inner_paper TEXT,
  cover_finish TEXT,
  binding_type TEXT,
  print_color TEXT,
  quantity INTEGER,
  order_method TEXT,
  sample_print_required BOOLEAN NOT NULL DEFAULT FALSE,
  sample_print_status TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
  sample_note TEXT,
  pdf_opened_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  fonts_embedded_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  image_quality_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  bleed_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  safe_area_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  page_order_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  color_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  cover_spine_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  blocker_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  report JSONB,
  spec_hash TEXT,
  frozen_at TIMESTAMP(3),
  frozen_by_id TEXT,
  note TEXT,
  created_by_id TEXT,
  updated_by_id TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT book_order_print_readiness_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS book_order_print_readiness_order_id_key
ON public.book_order_print_readiness(order_id);

CREATE INDEX IF NOT EXISTS book_order_print_readiness_status_updated_at_idx
ON public.book_order_print_readiness(status, updated_at);

CREATE TABLE IF NOT EXISTS public.book_order_print_quotes (
  id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  printer_name TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  quote_number TEXT,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  quantity INTEGER NOT NULL,
  minimum_quantity INTEGER,
  unit_cost INTEGER,
  setup_cost INTEGER NOT NULL DEFAULT 0,
  shipping_cost INTEGER NOT NULL DEFAULT 0,
  total_cost INTEGER NOT NULL,
  vat_included BOOLEAN NOT NULL DEFAULT FALSE,
  lead_time_business_days INTEGER,
  valid_until TIMESTAMP(3),
  selected_at TIMESTAMP(3),
  note TEXT,
  created_by_id TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT book_order_print_quotes_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS book_order_print_quotes_order_status_created_at_idx
ON public.book_order_print_quotes(order_id, status, created_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'book_order_print_readiness_order_id_fkey'
  ) THEN
    ALTER TABLE public.book_order_print_readiness
      ADD CONSTRAINT book_order_print_readiness_order_id_fkey
      FOREIGN KEY (order_id)
      REFERENCES public.book_orders(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'book_order_print_quotes_order_id_fkey'
  ) THEN
    ALTER TABLE public.book_order_print_quotes
      ADD CONSTRAINT book_order_print_quotes_order_id_fkey
      FOREIGN KEY (order_id)
      REFERENCES public.book_orders(id)
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
