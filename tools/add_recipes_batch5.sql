-- ========================================================================
-- BATCH 5 : Ajout de 50 recettes (PLAT)
-- ========================================================================

BEGIN;

-- 1. Spaghetti carbonara
INSERT INTO recipes (name, role, description)
VALUES ('Spaghetti carbonara', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 2. Spaghetti bolognaise
INSERT INTO recipes (name, role, description)
VALUES ('Spaghetti bolognaise', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 3. Penne all’arrabbiata
INSERT INTO recipes (name, role, description)
VALUES ('Penne all’arrabbiata', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 4. Spaghetti aglio e olio
INSERT INTO recipes (name, role, description)
VALUES ('Spaghetti aglio e olio', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 5. Tagliatelles Alfredo
INSERT INTO recipes (name, role, description)
VALUES ('Tagliatelles Alfredo', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 6. Penne au pesto
INSERT INTO recipes (name, role, description)
VALUES ('Penne au pesto', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 7. Rigatoni à la puttanesca
INSERT INTO recipes (name, role, description)
VALUES ('Rigatoni à la puttanesca', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 8. Spaghetti alle vongole
INSERT INTO recipes (name, role, description)
VALUES ('Spaghetti alle vongole', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 9. Farfalle aux légumes
INSERT INTO recipes (name, role, description)
VALUES ('Farfalle aux légumes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 10. Pâtes à la Norma
INSERT INTO recipes (name, role, description)
VALUES ('Pâtes à la Norma', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 11. Fusilli sauce tomate
INSERT INTO recipes (name, role, description)
VALUES ('Fusilli sauce tomate', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 12. Linguine aux palourdes
INSERT INTO recipes (name, role, description)
VALUES ('Linguine aux palourdes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 13. Pâtes au gorgonzola
INSERT INTO recipes (name, role, description)
VALUES ('Pâtes au gorgonzola', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 14. Pâtes au saumon fumé
INSERT INTO recipes (name, role, description)
VALUES ('Pâtes au saumon fumé', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 15. Pâtes quatre fromages
INSERT INTO recipes (name, role, description)
VALUES ('Pâtes quatre fromages', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 16. Spaghetti au thon
INSERT INTO recipes (name, role, description)
VALUES ('Spaghetti au thon', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 17. Pâtes au jambon et petits pois
INSERT INTO recipes (name, role, description)
VALUES ('Pâtes au jambon et petits pois', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 18. Spaghetti primavera
INSERT INTO recipes (name, role, description)
VALUES ('Spaghetti primavera', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 19. Pâtes à la sauce arrabbiata
INSERT INTO recipes (name, role, description)
VALUES ('Pâtes à la sauce arrabbiata', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 20. Rigatoni au ragoût
INSERT INTO recipes (name, role, description)
VALUES ('Rigatoni au ragoût', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 21. Orecchiette aux brocolis
INSERT INTO recipes (name, role, description)
VALUES ('Orecchiette aux brocolis', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 22. Pasta alla genovese
INSERT INTO recipes (name, role, description)
VALUES ('Pasta alla genovese', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 23. Pasta alla gricia
INSERT INTO recipes (name, role, description)
VALUES ('Pasta alla gricia', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 24. Pasta alla norma
INSERT INTO recipes (name, role, description)
VALUES ('Pasta alla norma', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 25. Trofie au pesto
INSERT INTO recipes (name, role, description)
VALUES ('Trofie au pesto', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 26. Bigoli in salsa
INSERT INTO recipes (name, role, description)
VALUES ('Bigoli in salsa', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 27. Cavatelli aux tomates cerises
INSERT INTO recipes (name, role, description)
VALUES ('Cavatelli aux tomates cerises', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 28. Paccheri farcis
INSERT INTO recipes (name, role, description)
VALUES ('Paccheri farcis', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 29. Pici all’aglione
INSERT INTO recipes (name, role, description)
VALUES ('Pici all’aglione', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 30. Strozzapreti à la saucisse
INSERT INTO recipes (name, role, description)
VALUES ('Strozzapreti à la saucisse', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 31. Pizzoccheri à la valtellina
INSERT INTO recipes (name, role, description)
VALUES ('Pizzoccheri à la valtellina', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 32. Tagliatelle aux cèpes
INSERT INTO recipes (name, role, description)
VALUES ('Tagliatelle aux cèpes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 33. Mafaldine au ragoût
INSERT INTO recipes (name, role, description)
VALUES ('Mafaldine au ragoût', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 34. Casarecce à la ricotta
INSERT INTO recipes (name, role, description)
VALUES ('Casarecce à la ricotta', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 35. Bucatini all’amatriciana
INSERT INTO recipes (name, role, description)
VALUES ('Bucatini all’amatriciana', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 36. Malloreddus à la sarde
INSERT INTO recipes (name, role, description)
VALUES ('Malloreddus à la sarde', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 37. Garganelli à la crème
INSERT INTO recipes (name, role, description)
VALUES ('Garganelli à la crème', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 38. Culurgiones sardes
INSERT INTO recipes (name, role, description)
VALUES ('Culurgiones sardes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 39. Linguine alle cozze
INSERT INTO recipes (name, role, description)
VALUES ('Linguine alle cozze', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 40. Cavatappi au speck
INSERT INTO recipes (name, role, description)
VALUES ('Cavatappi au speck', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 41. Risotto aux champignons
INSERT INTO recipes (name, role, description)
VALUES ('Risotto aux champignons', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 42. Risotto milanais au safran
INSERT INTO recipes (name, role, description)
VALUES ('Risotto milanais au safran', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 43. Risotto aux asperges
INSERT INTO recipes (name, role, description)
VALUES ('Risotto aux asperges', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 44. Risotto aux fruits de mer
INSERT INTO recipes (name, role, description)
VALUES ('Risotto aux fruits de mer', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 45. Risotto aux courgettes
INSERT INTO recipes (name, role, description)
VALUES ('Risotto aux courgettes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 46. Risotto au poulet
INSERT INTO recipes (name, role, description)
VALUES ('Risotto au poulet', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 47. Risotto aux épinards
INSERT INTO recipes (name, role, description)
VALUES ('Risotto aux épinards', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 48. Risotto aux carottes
INSERT INTO recipes (name, role, description)
VALUES ('Risotto aux carottes', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 49. Risotto au parmesan
INSERT INTO recipes (name, role, description)
VALUES ('Risotto au parmesan', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

-- 50. Risotto aux poireaux
INSERT INTO recipes (name, role, description)
VALUES ('Risotto aux poireaux', 'PLAT_PRINCIPAL', 'Plat principal - À compléter')
ON CONFLICT (name) DO NOTHING;

COMMIT;

-- Vérification
SELECT 
  'Batch 5 terminé' as message,
  COUNT(*) as total_recettes,
  COUNT(*) FILTER (WHERE role = 'PLAT_PRINCIPAL') as recettes_plat_principal
FROM recipes;
