-- Migration 001: Ajouter parent_archetype_id pour la hiérarchie
-- Date: 2025-10-30
-- Description: Ajoute la colonne parent_archetype_id à la table archetypes
--              pour permettre la hiérarchie parent/enfant (ex: crème → crème liquide)

-- Ajouter la colonne
ALTER TABLE archetypes
ADD COLUMN IF NOT EXISTS parent_archetype_id BIGINT;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE archetypes
ADD CONSTRAINT fk_parent_archetype
FOREIGN KEY (parent_archetype_id)
REFERENCES archetypes(id)
ON DELETE SET NULL;

-- Créer un index pour les performances
CREATE INDEX IF NOT EXISTS idx_archetypes_parent
ON archetypes(parent_archetype_id);

-- Ajouter un commentaire
COMMENT ON COLUMN archetypes.parent_archetype_id IS
'ID de l''archetype parent pour créer une hiérarchie (ex: crème liquide → crème)';

-- Vérification
SELECT
  COUNT(*) as total_archetypes,
  COUNT(parent_archetype_id) as with_parent
FROM archetypes;
