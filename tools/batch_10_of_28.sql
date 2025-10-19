INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Bourride sétoise'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Aïoli provençal et ses légumes'
  AND t.name = 'Française'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Aïoli provençal et ses légumes'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Saumon teriyaki'
  AND t.name = 'Japonaise'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Saumon à la plancha, sauce vierge'
  AND t.name = 'Texture-Crémeux'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Saumon à la plancha, sauce vierge'
  AND t.name = 'Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Lasagnes au saumon et épinards'
  AND t.name = 'Italienne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tartare de saumon à l''aneth et au citron vert'
  AND t.name = 'Saveur-Acide'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tartare de saumon à l''aneth et au citron vert'
  AND t.name = 'Arôme-Agrumes'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tartare de saumon à l''aneth et au citron vert'
  AND t.name = 'Arôme-Végétal'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tartare de saumon à l''aneth et au citron vert'
  AND t.name = 'Arôme-Épicé Frais'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 11 ---'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Brochettes de saumon marinées'
  AND t.name = 'Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Quiche au saumon et poireaux'
  AND t.name = 'Française'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Quiche au saumon et poireaux'
  AND t.name = 'Arôme-Fruité'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Quiche au saumon et poireaux'
  AND t.name = 'Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Dos de cabillaud en croûte de chorizo'
  AND t.name = 'Espagnole'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Fish and chips britannique'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Fish and chips britannique'
  AND t.name = 'Texture-Croquant'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Waterzooi de poisson'
  AND t.name = 'Arôme-Marin'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Curry de poisson au lait de coco'
  AND t.name = 'Thaïlandaise'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Curry de poisson au lait de coco'
  AND t.name = 'Indienne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Curry de poisson au lait de coco'
  AND t.name = 'Saveur-Épicé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Curry de poisson au lait de coco'
  AND t.name = 'Arôme-Marin'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Curry de poisson au lait de coco'
  AND t.name = 'Arôme-Lacté'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Steak de thon à la sicilienne (olives, câpres)'
  AND t.name = 'Saveur-Salé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Bar en croûte de sel'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Bar en croûte de sel'
  AND t.name = 'Saveur-Salé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Dorade royale au four et fenouil'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Filet de sole meunière'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Raie au beurre noir et aux câpres'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Raie au beurre noir et aux câpres'
  AND t.name = 'Saveur-Salé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Raie au beurre noir et aux câpres'
  AND t.name = 'Intensité-Riche'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Raie au beurre noir et aux câpres'
  AND t.name = 'Arôme-Lacté'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Maquereaux marinés au vin blanc'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Maquereaux marinés au vin blanc'
  AND t.name = 'Saveur-Acide'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Sardines grillées au barbecue'
  AND t.name = 'Américaine'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Sardines grillées au barbecue'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Sardines grillées au barbecue'
  AND t.name = 'Texture-Croquant'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Sardines grillées au barbecue'
  AND t.name = 'Intensité-Moyen'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Sardines grillées au barbecue'
  AND t.name = 'Arôme-Caramélisé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Sardines grillées au barbecue'
  AND t.name = 'Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Sardines grillées au barbecue'
  AND t.name = 'Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Coquilles Saint-Jacques poêlées, fondue de poireaux'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Coquilles Saint-Jacques poêlées, fondue de poireaux'
  AND t.name = 'Arôme-Fruité'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Coquilles Saint-Jacques poêlées, fondue de poireaux'
  AND t.name = 'Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Coquilles Saint-Jacques poêlées, fondue de poireaux'
  AND t.name = 'Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Coquilles Saint-Jacques poêlées, fondue de poireaux'
  AND t.name = 'Hiver'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Noix de Saint-Jacques snackées, purée de carottes au cumin'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Noix de Saint-Jacques snackées, purée de carottes au cumin'
  AND t.name = 'Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;