-- Migration 003b: TRIGGER pour auto-remplissage du user_id
-- Date: 2025-10-28
-- Description: Utilise un TRIGGER au lieu de DEFAULT pour remplir user_id
--              Car les triggers BEFORE INSERT s'exécutent AVANT les politiques RLS

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PROBLÈME RÉSOLU :
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Avec DEFAULT auth.uid() :
--   1. Code JavaScript fait INSERT sans user_id
--   2. RLS vérifie (user_id = auth.uid()) → user_id est NULL → ❌ BLOQUÉ
--   3. DEFAULT ne s'applique jamais car RLS a bloqué avant
--
-- Avec TRIGGER BEFORE INSERT :
--   1. Code JavaScript fait INSERT sans user_id
--   2. TRIGGER remplit user_id = auth.uid()
--   3. RLS vérifie (user_id = auth.uid()) → ✅ MATCH
--   4. INSERT réussit
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Créer une fonction qui remplit automatiquement user_id
CREATE OR REPLACE FUNCTION set_user_id_from_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Si user_id n'est pas fourni, utiliser auth.uid()
    IF NEW.user_id IS NULL THEN
        NEW.user_id := auth.uid();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger s'il existe déjà (pour être idempotent)
DROP TRIGGER IF EXISTS trigger_set_user_id ON inventory_lots;

-- Créer le trigger BEFORE INSERT
-- BEFORE = s'exécute AVANT les politiques RLS
CREATE TRIGGER trigger_set_user_id
    BEFORE INSERT ON inventory_lots
    FOR EACH ROW
    EXECUTE FUNCTION set_user_id_from_auth();

-- Documentation
COMMENT ON FUNCTION set_user_id_from_auth() IS 
'Auto-remplit user_id avec auth.uid() si non fourni - S''exécute AVANT RLS';

COMMENT ON TRIGGER trigger_set_user_id ON inventory_lots IS
'Remplit automatiquement user_id avec auth.uid() avant l''exécution des politiques RLS';
