CREATE TABLE IF NOT EXISTS public.book_order_manual_print_jobs (
  id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PREPARING',
  printer_name TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  order_method TEXT,
  final_pdf_url TEXT,
  cover_pdf_url TEXT,
  interior_pdf_url TEXT,
  trim_size TEXT,
  page_count INTEGER,
  cover_paper TEXT,
  inner_paper TEXT,
  binding_type TEXT,
  print_color TEXT,
  quantity INTEGER,
  unit_cost INTEGER,
  total_cost INTEGER,
  order_sent_at TIMESTAMP(3),
  accepted_at TIMESTAMP(3),
  expected_completion_at TIMESTAMP(3),
  printing_started_at TIMESTAMP(3),
  completed_at TIMESTAMP(3),
  note TEXT,
  created_by_id TEXT,
  updated_by_id TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT book_order_manual_print_jobs_pkey PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS
  book_order_manual_print_jobs_order_id_key
ON public.book_order_manual_print_jobs(order_id);

CREATE INDEX IF NOT EXISTS
  book_order_manual_print_jobs_status_updated_at_idx
ON public.book_order_manual_print_jobs(status, updated_at);

CREATE INDEX IF NOT EXISTS
  book_order_manual_print_jobs_printer_name_updated_at_idx
ON public.book_order_manual_print_jobs(printer_name, updated_at);

CREATE INDEX IF NOT EXISTS
  book_order_manual_print_jobs_expected_completion_at_idx
ON public.book_order_manual_print_jobs(expected_completion_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'book_order_manual_print_jobs_order_id_fkey'
  ) THEN
    ALTER TABLE public.book_order_manual_print_jobs
      ADD CONSTRAINT book_order_manual_print_jobs_order_id_fkey
      FOREIGN KEY (order_id)
      REFERENCES public.book_orders(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;
