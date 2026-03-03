-- Make order_id nullable in reviews table
ALTER TABLE public.reviews ALTER COLUMN order_id DROP NOT NULL;