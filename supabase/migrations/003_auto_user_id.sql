-- Migration 003: Auto-remplissage du user_id pour inventory_lots
-- Date: 2025-10-28
-- Description: Ajoute une valeur par défaut auth.uid() à la colonne user_id

-- Modifier la colonne user_id pour ajouter une valeur par défaut
ALTER TABLE inventory_lots 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Commentaire
COMMENT ON COLUMN inventory_lots.user_id IS 
'User ID - rempli automatiquement avec auth.uid() si non fourni';
