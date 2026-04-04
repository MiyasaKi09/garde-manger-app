-- Migration 013: Fix user_health_goals PK to support multi-person (Julien + Zoé)
-- The original PK is (user_id) only, which prevents storing goals for multiple persons.

-- Drop the old PK
ALTER TABLE user_health_goals DROP CONSTRAINT IF EXISTS user_health_goals_pkey;

-- Add new composite PK
ALTER TABLE user_health_goals ADD CONSTRAINT user_health_goals_pkey PRIMARY KEY (user_id, person_name);

-- Ensure person_name has a default
ALTER TABLE user_health_goals ALTER COLUMN person_name SET DEFAULT 'Julien';
ALTER TABLE user_health_goals ALTER COLUMN person_name SET NOT NULL;
