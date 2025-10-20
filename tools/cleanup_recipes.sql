-- ========================================================================
-- NETTOYAGE MASSIF DES RECETTES PROBLÉMATIQUES
-- Objectif: Passer de 1042 recettes à ~500-600 recettes de qualité
-- ========================================================================

BEGIN;

-- ========================================================================
-- 1. SUPPRIMER LES RECETTES FARFELUES (combinaisons improbables)
-- ========================================================================

-- Poulet avec ingrédients bizarres
DELETE FROM recipes 
WHERE name ~* 'poulet.*(?:kiwi|café|chocolat|thé fumé|fleurs comestibles|curry banane|curry cacao)';

-- Autres viandes avec ingrédients bizarres
DELETE FROM recipes 
WHERE name ~* '(bœuf|agneau|veau|porc).*(?:kiwi|café|chocolat|thé fumé|fleurs comestibles|curry banane)';

-- Poissons avec combinaisons bizarres
DELETE FROM recipes
WHERE name ~* '(thon|saumon|cabillaud|truite).*(?:chocolat|café|kiwi)';

-- ========================================================================
-- 2. SUPPRIMER LES RECETTES TROP GÉNÉRIQUES
-- ========================================================================

DELETE FROM recipes
WHERE name ~* '(festif|express|fusion|hybride|surprise|créatif|expérimental|original|revisité|innovant)$';

DELETE FROM recipes
WHERE name IN (
  'Accompagnement hybride',
  'Recette surprise',
  'Plat fusion',
  'Baguette traditionnelle'
);

-- ========================================================================
-- 3. LIMITER LES SOUPES (garder max 30 sur 369)
-- ========================================================================

-- Supprimer les soupes trop spécifiques ou redondantes
DELETE FROM recipes
WHERE id IN (
  SELECT id 
  FROM recipes 
  WHERE name ~* '^Soupe' 
    AND (
      -- Soupes détox (trop nombreuses)
      name ~* 'détox'
      -- Soupes "rapides" (doublon avec versions normales)
      OR name ~* 'rapide'
      -- Soupes "crémeuses" (doublon avec veloutés)
      OR name ~* 'crémeuse'
      -- Soupes trop spécifiques
      OR name ~* '(champenoise|lilloise|vosgienne|poitevine|berrichonne|charentaise)'
      -- Soupes "froides" (doublon avec gaspacho)
      OR name ~* 'froide'
      -- Soupes avec alcool (trop spécifiques)
      OR name ~* '(cognac|porto|champagne|vin rouge|vin blanc|cidre)'
      -- Soupes rustiques (doublon)
      OR name ~* 'rustique'
      -- Soupes légères (doublon)
      OR name ~* 'légère'
    )
);

-- ========================================================================
-- 4. LIMITER LES VELOUTÉS (garder max 15 sur 35)
-- ========================================================================

DELETE FROM recipes
WHERE id IN (
  SELECT id 
  FROM recipes 
  WHERE name ~* '^Velouté'
    AND (
      name ~* '(topinambours|panais|navets|rutabaga|fenouil|patates douces)'
      OR name ~* 'festiv'
    )
);

-- ========================================================================
-- 5. LIMITER LES TARTES (garder max 25 sur 68)
-- ========================================================================

-- Supprimer les tartes trop spécifiques ou redondantes
DELETE FROM recipes
WHERE id IN (
  SELECT id 
  FROM recipes 
  WHERE name ~* '^Tarte'
    AND (
      -- Tartes "fines" (doublon avec tartes normales)
      name ~* 'Tarte fine'
      -- Tartes avec fruits (garder seulement les classiques)
      OR (name ~* '(cerises|mûres|myrtilles|framboises|prunes)' AND role = 'DESSERT')
      -- Tartes trop spécifiques
      OR name ~* '(fenouil|céleri|panais|rutabaga|chou)'
    )
  LIMIT 30
);

-- ========================================================================
-- 6. LIMITER LES FEUILLETÉS (garder max 15 sur 67)
-- ========================================================================

DELETE FROM recipes
WHERE id IN (
  SELECT id 
  FROM recipes 
  WHERE name ~* '^Feuilleté'
    AND name ~* '(dinde|pintade|canard)'
  -- Garder seulement les feuilletés au poulet
);

-- Supprimer variations excessives de feuilletés au poulet
DELETE FROM recipes
WHERE name ~* 'Feuilleté au poulet et (carottes|courgettes|poireaux)$';

-- ========================================================================
-- 7. LIMITER LES BURGERS (garder max 15 sur 41)
-- ========================================================================

DELETE FROM recipes
WHERE id IN (
  SELECT id 
  FROM recipes 
  WHERE name ~* '^Burger'
    AND (
      -- Variations de fromages (garder "au fromage" générique)
      name ~* '(bleu|gorgonzola|roquefort|chèvre|camembert|comté|reblochon)'
      -- Variations de légumes (garder "aux légumes" générique)
      OR name ~* 'aux (champignons|aubergines|courgettes|poivrons|tomates|oignons)'
    )
  LIMIT 20
);

-- ========================================================================
-- 8. LIMITER LES WRAPS (garder max 15 sur 34)
-- ========================================================================

DELETE FROM recipes
WHERE id IN (
  SELECT id 
  FROM recipes 
  WHERE name ~* '^Wrap'
    AND (
      name ~* '(bleu|camembert|chèvre|comté)'
      OR name ~* 'dessert'
    )
  LIMIT 15
);

-- ========================================================================
-- 9. LIMITER "POULET GRILLÉ" (garder max 10 sur 34)
-- ========================================================================

DELETE FROM recipes
WHERE id IN (
  SELECT id 
  FROM recipes 
  WHERE name ~* '^Poulet grillé'
    AND NOT name IN (
      'Poulet grillé',
      'Poulet grillé tandoori',
      'Poulet grillé teriyaki',
      'Poulet grillé au miel',
      'Poulet grillé aux herbes fraîches'
    )
);

-- ========================================================================
-- 10. LIMITER LES BEIGNETS (garder max 10 sur 26)
-- ========================================================================

DELETE FROM recipes
WHERE id IN (
  SELECT id 
  FROM recipes 
  WHERE name ~* '^Beignets'
    AND name ~* '(sucrés|fourrés|aux (bananes|cerises|fraises|framboises|myrtilles|poires|raisins))'
);

-- ========================================================================
-- 11. SUPPRIMER LES VARIATIONS EXCESSIVES D'AGNEAU
-- ========================================================================

DELETE FROM recipes
WHERE name ~* '^Agneau (aux|au)'
  AND name ~* '(fleurs comestibles|fruits secs|curry cacao|sésame noir|miso|thé fumé|café|chocolat)';

-- ========================================================================
-- 12. SUPPRIMER LES VARIATIONS EXCESSIVES DE BŒUF
-- ========================================================================

DELETE FROM recipes
WHERE name ~* '^Bœuf (aux|au)'
  AND name ~* '(fleurs comestibles|fruits secs|curry cacao|sésame noir|miso|thé fumé|café|chocolat)';

-- ========================================================================
-- 13. SUPPRIMER LES VARIATIONS EXCESSIVES DE VEAU
-- ========================================================================

DELETE FROM recipes
WHERE name ~* '^Veau (aux|au)';

-- ========================================================================
-- 14. SUPPRIMER LES VARIATIONS EXCESSIVES DE POISSON
-- ========================================================================

-- Supprimer variations poissons "au champagne"
DELETE FROM recipes
WHERE name ~* '(cabillaud|bar|sole|turbot|thon) au champagne';

-- Supprimer variations poissons "aux morilles"
DELETE FROM recipes
WHERE name ~* '(cabillaud|bar|sole|turbot) aux morilles';

-- ========================================================================
-- 15. SUPPRIMER LES DOUBLONS ET QUASI-DOUBLONS
-- ========================================================================

-- Aligot (2 fois)
DELETE FROM recipes WHERE name = 'Aligot de l''Aubrac' AND id > (
  SELECT MIN(id) FROM recipes WHERE name = 'Aligot de l''Aubrac'
);

-- Supprimer les recettes avec "(plat principal - à compléter)" et description vide
DELETE FROM recipes
WHERE description = 'Plat principal - À compléter'
  AND id NOT IN (
    -- Garder les recettes uniques et importantes
    SELECT MIN(id) 
    FROM recipes 
    WHERE description = 'Plat principal - À compléter'
    GROUP BY name
  );

-- ========================================================================
-- 16. SUPPRIMER LES ACCOMPAGNEMENTS TROP SPÉCIFIQUES
-- ========================================================================

DELETE FROM recipes
WHERE role = 'ACCOMPAGNEMENT'
  AND name ~* '(glacé|confit|rôti|vapeur|sauté|grillé)e?s?$';

-- ========================================================================
-- 17. SUPPRIMER LES RECETTES DE BASES (bouillons, beurres composés, etc)
-- ========================================================================

DELETE FROM recipes
WHERE name ~* '^(Bouillon|Beurre|Vinaigrette|Fond)';

-- ========================================================================
-- 18. SUPPRIMER LES RECETTES TROP SPÉCIFIQUES DE PAINS
-- ========================================================================

DELETE FROM recipes
WHERE name ~* '^(Bun|Pain|Brioche|Focaccia)'
  AND name NOT IN ('Pain de campagne', 'Brioche', 'Focaccia');

-- ========================================================================
-- 19. SUPPRIMER LES VARIATIONS EXCESSIVES DE CAKES SALÉS
-- ========================================================================

DELETE FROM recipes
WHERE name ~* '^Cake (au|aux)'
  AND name ~* '(bacon|jambon cru|saumon|thon|champignons|olives|tomates|courgettes|carottes|poireaux|poivrons|brocolis|épinards|aubergines)'
  AND id NOT IN (
    SELECT MIN(id)
    FROM recipes
    WHERE name ~* '^Cake (au|aux)'
    GROUP BY name
    LIMIT 5
  );

-- ========================================================================
-- 20. SUPPRIMER LES RECETTES "FUSION" OU HYBRIDES
-- ========================================================================

DELETE FROM recipes
WHERE name ~* '(fusion|hybride|sucré-salé|expérimental)';

COMMIT;

-- ========================================================================
-- VÉRIFICATION FINALE
-- ========================================================================

SELECT 
  'NETTOYAGE TERMINÉ' as message,
  COUNT(*) as recettes_restantes,
  COUNT(*) FILTER (WHERE role = 'PLAT_PRINCIPAL') as plats_principaux,
  COUNT(*) FILTER (WHERE role = 'ENTREE') as entrees,
  COUNT(*) FILTER (WHERE role = 'DESSERT') as desserts,
  COUNT(*) FILTER (WHERE role = 'ACCOMPAGNEMENT') as accompagnements
FROM recipes;

-- Afficher quelques exemples de ce qui reste
SELECT 
  'Exemples de recettes conservées:' as info;

SELECT name, role
FROM recipes
ORDER BY RANDOM()
LIMIT 30;
