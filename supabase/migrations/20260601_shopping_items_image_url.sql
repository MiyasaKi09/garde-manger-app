-- Add image_url column to shopping items for Pexels food photos
ALTER TABLE nutrition_plan_shopping_items ADD COLUMN IF NOT EXISTS image_url TEXT;
