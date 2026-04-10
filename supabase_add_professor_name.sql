-- Add a freeform professor_name text field to reviews
-- so students can type the professor name instead of selecting from a dropdown.
-- Run this in Supabase → SQL Editor

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS professor_name TEXT;
