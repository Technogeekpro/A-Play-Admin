-- Add missing amenities column to restaurants table
-- Run this in the Supabase Dashboard > SQL Editor

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS amenities TEXT[];
