-- Micronutriments PAR PORTION d'un plat cuisiné / reste (cooked_dishes), pour que
-- la consommation d'un reste loggue aussi les micros (en plus des macros déjà
-- stockées via *_per_portion). Clés alignées sur nutritional_data / page nutrition.
ALTER TABLE public.cooked_dishes
  ADD COLUMN IF NOT EXISTS micronutrients_per_portion jsonb;
