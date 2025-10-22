-- ========================================================================
-- ÉTAPE 1 : AJOUTER LE RÔLE SAUCE À L'ENUM
-- ========================================================================
-- IMPORTANT: Ce script doit être exécuté SEUL, puis vous devez
-- fermer et rouvrir la connexion avant d'exécuter l'étape 2

-- Ajouter SAUCE au type recipe_role_enum
ALTER TYPE recipe_role_enum ADD VALUE IF NOT EXISTS 'SAUCE';

-- Vérification
SELECT 
    '✅ Valeur SAUCE ajoutée à l''enum' as message,
    'Maintenant FERMEZ cette connexion et exécutez fix_recipe_structure_step2.sql' as prochaine_etape;

-- Afficher toutes les valeurs de l'enum
SELECT 
    enumlabel as valeur_enum,
    enumsortorder as ordre
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'recipe_role_enum'
ORDER BY e.enumsortorder;
