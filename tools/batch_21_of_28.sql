INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Éclair au café ou au chocolat'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Éclair au café ou au chocolat'
  AND t.name = 'Saveur-Amer'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Religieuse au chocolat'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Saint-Honoré'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Saint-Honoré'
  AND t.name = 'Healthy'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Fraisier'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Opéra'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Mille-feuille'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Mille-feuille'
  AND t.name = 'Arôme-Végétal'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Soufflé au Grand Marnier'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Riz au lait à la vanille'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Riz au lait à la vanille'
  AND t.name = 'Arôme-Lacté'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 22 ---'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tiramisu classique au café'
  AND t.name = 'Italienne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tiramisu classique au café'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tiramisu classique au café'
  AND t.name = 'Saveur-Amer'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Panna Cotta et son coulis de fruits rouges'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Panna Cotta et son coulis de fruits rouges'
  AND t.name = 'Saveur-Sucré'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Panna Cotta et son coulis de fruits rouges'
  AND t.name = 'Arôme-Fruité'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tiramisu aux fraises'
  AND t.name = 'Italienne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tiramisu aux fraises'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tiramisu aux fraises'
  AND t.name = 'Arôme-Fruité'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tiramisu aux fraises'
  AND t.name = 'Printemps'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Panna Cotta au caramel beurre salé'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Panna Cotta au caramel beurre salé'
  AND t.name = 'Saveur-Salé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Panna Cotta au caramel beurre salé'
  AND t.name = 'Saveur-Sucré'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Panna Cotta au caramel beurre salé'
  AND t.name = 'Intensité-Riche'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Panna Cotta au caramel beurre salé'
  AND t.name = 'Arôme-Lacté'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Panna Cotta au caramel beurre salé'
  AND t.name = 'Arôme-Caramélisé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Zabaione au Marsala'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Cannoli siciliens à la ricotta'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Torta della nonna (tarte à la crème pâtissière et pignons)'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Torta della nonna (tarte à la crème pâtissière et pignons)'
  AND t.name = 'Texture-Crémeux'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Torta della nonna (tarte à la crème pâtissière et pignons)'
  AND t.name = 'Arôme-Lacté'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Torta caprese (gâteau au chocolat et amandes)'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Semifreddo au nougat'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Gelato à la pistache maison'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Affogato (glace vanille noyée dans un expresso)'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Affogato (glace vanille noyée dans un expresso)'
  AND t.name = 'Rapide'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Panettone (version maison)'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Cantucci (croquants aux amandes)'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Cantucci (croquants aux amandes)'
  AND t.name = 'Texture-Croquant'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Cantucci (croquants aux amandes)'
  AND t.name = 'Texture-Ferme'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Bonet piémontais (flan au chocolat et amaretti)'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Pêches au vin'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Pêches au vin'
  AND t.name = 'Arôme-Fruité'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Pêches au vin'
  AND t.name = 'Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Sbrisolona (gâteau friable aux amandes)'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Crostata à la confiture d''abricots'
  AND t.name = 'Française'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Crostata à la confiture d''abricots'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;