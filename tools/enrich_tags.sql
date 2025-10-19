-- Script d'enrichissement des recettes
-- Ajoute : difficulté, occasions, saisons

BEGIN;

-- Insertion des nouveaux tags
INSERT INTO tags (name) VALUES
('difficulté:Facile'),
('difficulté:Moyen'),
('difficulté:Difficile'),
('saison:Printemps'),
('saison:Été'),
('saison:Automne'),
('saison:Hiver'),
('usage:Petit-déjeuner'),
('usage:Apéritif'),
('usage:Fête'),
('usage:Barbecue'),
('profil:Gourmand'),
('profil:Healthy'),
('profil:Rapide')
ON CONFLICT (name) DO NOTHING;

COMMIT;