INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Feuilletés saucisse à la moutarde'
  AND t.name = 'Arôme-Végétal'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Mini-brochettes de poulet mariné au satay'
  AND t.name = 'Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)'
  AND t.name = 'Italienne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)'
  AND t.name = 'Saveur-Acide'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)'
  AND t.name = 'Saveur-Herbacé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)'
  AND t.name = 'Arôme-Épicé Frais'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)'
  AND t.name = 'Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Mini-brochettes Caprese (tomate cerise, mozzarella, basilic)'
  AND t.name = 'Barbecue'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Roulés de courgette au fromage frais'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Roulés de courgette au fromage frais'
  AND t.name = 'Intensité-Riche'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Roulés de courgette au fromage frais'
  AND t.name = 'Arôme-Lacté'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Roulés de courgette au fromage frais'
  AND t.name = 'Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Roulés de courgette au fromage frais'
  AND t.name = 'Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Blinis au saumon fumé et crème à l''aneth'
  AND t.name = 'Texture-Crémeux'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Blinis au saumon fumé et crème à l''aneth'
  AND t.name = 'Arôme-Lacté'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Blinis au saumon fumé et crème à l''aneth'
  AND t.name = 'Arôme-Épicé Frais'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Champignons farcis à l''ail et au persil'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Champignons farcis à l''ail et au persil'
  AND t.name = 'Saveur-Umami'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Champignons farcis à l''ail et au persil'
  AND t.name = 'Saveur-Herbacé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Champignons farcis à l''ail et au persil'
  AND t.name = 'Arôme-Terreux'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Champignons farcis à l''ail et au persil'
  AND t.name = 'Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tomates provençales au four'
  AND t.name = 'Française'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tomates provençales au four'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tomates provençales au four'
  AND t.name = 'Saveur-Acide'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tomates provençales au four'
  AND t.name = 'Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tarte soleil au pesto et parmesan'
  AND t.name = 'Italienne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tarte soleil au pesto et parmesan'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tarte soleil au pesto et parmesan'
  AND t.name = 'Saveur-Umami'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Gougères au fromage'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Gougères au fromage'
  AND t.name = 'Intensité-Riche'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Cake salé aux olives et au jambon'
  AND t.name = 'Saveur-Salé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Muffins salés au chorizo et poivron'
  AND t.name = 'Espagnole'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Muffins salés au chorizo et poivron'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Muffins salés au chorizo et poivron'
  AND t.name = 'Saveur-Salé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Muffins salés au chorizo et poivron'
  AND t.name = 'Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Madeleines salées au chèvre et romarin'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Madeleines salées au chèvre et romarin'
  AND t.name = 'Saveur-Salé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Madeleines salées au chèvre et romarin'
  AND t.name = 'Saveur-Herbacé'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Quiche Lorraine traditionnelle'
  AND t.name = 'Française'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Quiche Lorraine traditionnelle'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = '--- Batch 6 ---'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tarte aux poireaux et lardons'
  AND t.name = 'Arôme-Fruité'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tarte aux poireaux et lardons'
  AND t.name = 'Automne'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tarte à la tomate et à la moutarde'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tarte à la tomate et à la moutarde'
  AND t.name = 'Saveur-Acide'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tarte à la tomate et à la moutarde'
  AND t.name = 'Été'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Tarte fine aux légumes du soleil et chèvre'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Quiche sans pâte aux épinards et ricotta'
  AND t.name = 'Française'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;

INSERT INTO recipe_tags (recipe_id, tag_id)
SELECT r.id, t.id FROM recipes r, tags t
WHERE r.name = 'Quiche sans pâte aux épinards et ricotta'
  AND t.name = 'Végétarien'
ON CONFLICT (recipe_id, tag_id) DO NOTHING;