INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Churros espagnols et leur chocolat chaud'
  AND t.name = 'Espagnole'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Churros espagnols et leur chocolat chaud'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Crème catalane'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Crème catalane'
  AND t.name = 'Texture-Crémeux'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Crème catalane'
  AND t.name = 'Arôme-Lacté'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tarta de Santiago (gâteau aux amandes)'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Leche frita (lait frit)'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Leche frita (lait frit)'
  AND t.name = 'Intensité-Riche'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Leche frita (lait frit)'
  AND t.name = 'Arôme-Lacté'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Pastel de nata portugais'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Gâteau basque à la crème ou à la cerise'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Gâteau basque à la crème ou à la cerise'
  AND t.name = 'Texture-Crémeux'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Gâteau basque à la crème ou à la cerise'
  AND t.name = 'Arôme-Lacté'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Loukoumades grecs (beignets au miel)'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Loukoumades grecs (beignets au miel)'
  AND t.name = 'Saveur-Sucré'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Loukoumades grecs (beignets au miel)'
  AND t.name = 'Arôme-Caramélisé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Baklava'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Halva'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Basboussa (gâteau de semoule)'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Cornes de gazelle marocaines'
  AND t.name = 'Orientale'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Cornes de gazelle marocaines'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Mochi japonais'
  AND t.name = 'Japonaise'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Mochi japonais'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Dorayaki (pancakes japonais fourrés)'
  AND t.name = 'Japonaise'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Dorayaki (pancakes japonais fourrés)'
  AND t.name = 'Américaine'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Dorayaki (pancakes japonais fourrés)'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Gâteau de lune chinois'
  AND t.name = 'Chinoise'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Gâteau de lune chinois'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Alfajores argentins'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Brigadeiros brésiliens'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 25 ---'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Salade de fruits frais de saison'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Salade de fruits frais de saison'
  AND t.name = 'Saveur-Sucré'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Carpaccio d''ananas à la menthe et au citron vert'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Carpaccio d''ananas à la menthe et au citron vert'
  AND t.name = 'Saveur-Acide'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Carpaccio d''ananas à la menthe et au citron vert'
  AND t.name = 'Saveur-Herbacé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Carpaccio d''ananas à la menthe et au citron vert'
  AND t.name = 'Arôme-Agrumes'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Carpaccio d''ananas à la menthe et au citron vert'
  AND t.name = 'Arôme-Végétal'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Carpaccio d''ananas à la menthe et au citron vert'
  AND t.name = 'Arôme-Épicé Frais'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Fraises au sucre et jus de citron'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Fraises au sucre et jus de citron'
  AND t.name = 'Saveur-Acide'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Fraises au sucre et jus de citron'
  AND t.name = 'Texture-Liquide'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Fraises au sucre et jus de citron'
  AND t.name = 'Arôme-Fruité'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Fraises au sucre et jus de citron'
  AND t.name = 'Arôme-Agrumes'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Fraises au sucre et jus de citron'
  AND t.name = 'Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Soupe de fraises à la menthe'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Soupe de fraises à la menthe'
  AND t.name = 'Saveur-Herbacé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Soupe de fraises à la menthe'
  AND t.name = 'Texture-Liquide'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Soupe de fraises à la menthe'
  AND t.name = 'Arôme-Fruité'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Soupe de fraises à la menthe'
  AND t.name = 'Arôme-Épicé Frais'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;