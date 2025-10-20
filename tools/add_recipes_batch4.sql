-- ========================================================================
-- BATCH 4 : Ajout de 50 recettes (PLAT)
-- ========================================================================

BEGIN;

-- 1. Bœuf bourguignon
INSERT INTO recipes (name, role, description)
VALUES ('Bœuf bourguignon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Daube provençale
INSERT INTO recipes (name, role, description)
VALUES ('Daube provençale', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Pot-au-feu
INSERT INTO recipes (name, role, description)
VALUES ('Pot-au-feu', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Steak tartare
INSERT INTO recipes (name, role, description)
VALUES ('Steak tartare', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Steak au poivre
INSERT INTO recipes (name, role, description)
VALUES ('Steak au poivre', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Entrecôte grillée
INSERT INTO recipes (name, role, description)
VALUES ('Entrecôte grillée', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Côte de bœuf au four
INSERT INTO recipes (name, role, description)
VALUES ('Côte de bœuf au four', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Bavette à l’échalote
INSERT INTO recipes (name, role, description)
VALUES ('Bavette à l’échalote', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Rôti de bœuf
INSERT INTO recipes (name, role, description)
VALUES ('Rôti de bœuf', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Bœuf carottes
INSERT INTO recipes (name, role, description)
VALUES ('Bœuf carottes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Langue de bœuf sauce piquante
INSERT INTO recipes (name, role, description)
VALUES ('Langue de bœuf sauce piquante', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Joue de bœuf braisée
INSERT INTO recipes (name, role, description)
VALUES ('Joue de bœuf braisée', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Bœuf aux oignons
INSERT INTO recipes (name, role, description)
VALUES ('Bœuf aux oignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Bœuf miroton
INSERT INTO recipes (name, role, description)
VALUES ('Bœuf miroton', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Paleron braisé
INSERT INTO recipes (name, role, description)
VALUES ('Paleron braisé', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Brochettes de bœuf
INSERT INTO recipes (name, role, description)
VALUES ('Brochettes de bœuf', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Filet de bœuf Wellington
INSERT INTO recipes (name, role, description)
VALUES ('Filet de bœuf Wellington', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Curry de bœuf à la française
INSERT INTO recipes (name, role, description)
VALUES ('Curry de bœuf à la française', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Ragoût de bœuf aux légumes
INSERT INTO recipes (name, role, description)
VALUES ('Ragoût de bœuf aux légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Hachis parmentier au bœuf
INSERT INTO recipes (name, role, description)
VALUES ('Hachis parmentier au bœuf', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Blanquette de veau
INSERT INTO recipes (name, role, description)
VALUES ('Blanquette de veau', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Osso buco
INSERT INTO recipes (name, role, description)
VALUES ('Osso buco', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Escalope de veau à la crème
INSERT INTO recipes (name, role, description)
VALUES ('Escalope de veau à la crème', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Grenadins de veau
INSERT INTO recipes (name, role, description)
VALUES ('Grenadins de veau', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Rôti de veau au four
INSERT INTO recipes (name, role, description)
VALUES ('Rôti de veau au four', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Sauté de veau marengo
INSERT INTO recipes (name, role, description)
VALUES ('Sauté de veau marengo', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Navarin de veau
INSERT INTO recipes (name, role, description)
VALUES ('Navarin de veau', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Tendrons de veau braisés
INSERT INTO recipes (name, role, description)
VALUES ('Tendrons de veau braisés', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Veau aux champignons
INSERT INTO recipes (name, role, description)
VALUES ('Veau aux champignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Escalope milanaise
INSERT INTO recipes (name, role, description)
VALUES ('Escalope milanaise', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Côtes de veau grillées
INSERT INTO recipes (name, role, description)
VALUES ('Côtes de veau grillées', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Veau aux olives
INSERT INTO recipes (name, role, description)
VALUES ('Veau aux olives', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Veau à la provençale
INSERT INTO recipes (name, role, description)
VALUES ('Veau à la provençale', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Veau orloff
INSERT INTO recipes (name, role, description)
VALUES ('Veau orloff', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Jarret de veau confit
INSERT INTO recipes (name, role, description)
VALUES ('Jarret de veau confit', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Veau au curry doux
INSERT INTO recipes (name, role, description)
VALUES ('Veau au curry doux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Veau aux carottes
INSERT INTO recipes (name, role, description)
VALUES ('Veau aux carottes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Sauté de veau aux légumes
INSERT INTO recipes (name, role, description)
VALUES ('Sauté de veau aux légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Tête de veau sauce gribiche
INSERT INTO recipes (name, role, description)
VALUES ('Tête de veau sauce gribiche', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Veau en cocotte aux herbes
INSERT INTO recipes (name, role, description)
VALUES ('Veau en cocotte aux herbes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Navarin d’agneau
INSERT INTO recipes (name, role, description)
VALUES ('Navarin d’agneau', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Gigot d’agneau rôti
INSERT INTO recipes (name, role, description)
VALUES ('Gigot d’agneau rôti', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Curry d’agneau doux
INSERT INTO recipes (name, role, description)
VALUES ('Curry d’agneau doux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Côtes d’agneau grillées
INSERT INTO recipes (name, role, description)
VALUES ('Côtes d’agneau grillées', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Souris d’agneau confite
INSERT INTO recipes (name, role, description)
VALUES ('Souris d’agneau confite', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Agneau à la provençale
INSERT INTO recipes (name, role, description)
VALUES ('Agneau à la provençale', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Tajine d’agneau aux pruneaux
INSERT INTO recipes (name, role, description)
VALUES ('Tajine d’agneau aux pruneaux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Épaule d’agneau au four
INSERT INTO recipes (name, role, description)
VALUES ('Épaule d’agneau au four', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Agneau aux herbes
INSERT INTO recipes (name, role, description)
VALUES ('Agneau aux herbes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Agneau à la marocaine
INSERT INTO recipes (name, role, description)
VALUES ('Agneau à la marocaine', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 4 terminé' as message,
  COUNT(*) as total_recettes,
  COUNT(*) FILTER (WHERE role = 'PLAT_PRINCIPAL') as recettes_plat_principal
FROM recipes;
