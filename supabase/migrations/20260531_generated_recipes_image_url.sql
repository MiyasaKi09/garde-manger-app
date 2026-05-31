-- Add image_url column to generated_recipes for Pexels auto-fetch
ALTER TABLE generated_recipes ADD COLUMN IF NOT EXISTS image_url TEXT;
