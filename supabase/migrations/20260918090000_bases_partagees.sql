-- ============================================================================
-- BASES PARTAGÉES — les plats déclarent la base qu'ils emploient (livrable 2.1)
-- ============================================================================
-- Généré par scripts/data/recipes/link-shared-bases.mjs depuis
-- data/recipes/arbitrations/bases-partagees.json. NE PAS ÉDITER À LA MAIN :
-- l'arbitrage est la source, ce fichier en est la projection.
--
-- POURQUOI CETTE MIGRATION EXISTE. lib/domain/planning/sharedBases.js lit
-- `ingredient.component.code`. Sur le chemin BASE, ce champ vient de
-- get_operational_recipe_catalog_v3, qui le projette depuis
-- culinary.recipe_components.sub_recipe_version_id (migration 20260917110000,
-- phase 0b). La projection existe ; il n'y avait rien à projeter — 0 exigence
-- d'ingrédient ne portait de component_id. Cette migration pose les 77 liens
-- arbitrés sur 71 plats.
--
-- ORDRE : le composant d'abord, l'exigence ensuite. Idempotent (gardes
-- d'existence), sans suppression, rollback dans le fichier voisin.
-- ============================================================================

CREATE TEMP TABLE _liens (
  parent_code       text,
  base_code         text,
  ingredient_pos    integer,
  ingredient_name   text,
  component_name    text,
  component_pos     integer,
  required_quantity numeric,
  required_unit     text
) ON COMMIT DROP;

INSERT INTO _liens VALUES
    ('DESS-006', 'RAP-004', 1, 'Pâte brisée crue', 'Pâte brisée', 2, 320, 'g'),
    ('DESS-011', 'RAP-005', 1, 'Pâte sablée crue', 'Pâte sablée', 2, 350, 'g'),
    ('FR-005', 'RAP-004', 1, 'Pâte brisée crue', 'Pâte brisée', 2, 280, 'g'),
    ('FR-014', 'RAP-007', 5, 'Bouillon de légumes', 'Bouillon de légumes', 2, 1500, 'ml'),
    ('FR-029', 'RAP-004', 1, 'Pâte brisée crue', 'Pâte brisée', 2, 280, 'g'),
    ('FR-036', 'RAP-004', 1, 'Pâte brisée crue', 'Pâte brisée', 2, 280, 'g'),
    ('FR-039', 'RAP-004', 1, 'Pâte brisée crue', 'Pâte brisée', 2, 300, 'g'),
    ('JUM-002', 'RAP-007', 6, 'Bouillon de légumes', 'Bouillon de légumes', 2, 750, 'ml'),
    ('JUM-004', 'RAP-007', 3, 'Bouillon de légumes', 'Bouillon de légumes', 2, 400, 'ml'),
    ('JUM-005', 'RAP-007', 2, 'Bouillon de légumes', 'Bouillon de légumes', 2, 800, 'ml'),
    ('JUM-006', 'RAP-007', 3, 'Bouillon de légumes', 'Bouillon de légumes', 2, 300, 'ml'),
    ('JUM-007', 'RAP-007', 1, 'Bouillon de légumes', 'Bouillon de légumes', 2, 1600, 'ml'),
    ('JUM-033', 'RAP-007', 3, 'Bouillon de légumes', 'Bouillon de légumes', 2, 250, 'ml'),
    ('JUM-053', 'RAP-007', 1, 'Bouillon de légumes', 'Bouillon de légumes', 2, 1000, 'ml'),
    ('JUM-061', 'RAP-007', 2, 'Bouillon de légumes', 'Bouillon de légumes', 2, 450, 'ml'),
    ('JUM-062', 'RAP-007', 3, 'Bouillon de légumes', 'Bouillon de légumes', 2, 150, 'ml'),
    ('JUM-063', 'RAP-007', 2, 'Bouillon de légumes', 'Bouillon de légumes', 2, 300, 'ml'),
    ('JUM-071', 'RAP-007', 1, 'Bouillon de légumes', 'Bouillon de légumes', 2, 2000, 'ml'),
    ('JUM-073', 'RAP-007', 1, 'Bouillon de légumes', 'Bouillon de légumes', 2, 2500, 'ml'),
    ('JUM-074', 'RAP-004', 2, 'Pâte brisée crue', 'Pâte brisée', 2, 280, 'g'),
    ('JUM-082', 'RAP-007', 4, 'Bouillon de légumes', 'Bouillon de légumes', 2, 400, 'ml'),
    ('JUM-114', 'RAP-015', 4, 'Œuf dur', 'Œufs durs', 2, 3, 'u'),
    ('RAP-031', 'RAP-019', 4, 'Mayonnaise', 'Mayonnaise maison', 2, 60, 'g'),
    ('RAP-045', 'RAP-019', 6, 'Mayonnaise', 'Mayonnaise maison', 2, 100, 'g'),
    ('RAP-050', 'RAP-007', 2, 'Bouillon de légumes', 'Bouillon de légumes', 2, 600, 'ml'),
    ('REAL-088', 'RAP-004', 1, 'Pâte brisée crue', 'Pâte brisée', 2, 320, 'g'),
    ('REAL-115', 'RAP-015', 6, 'Œuf dur', 'Œufs durs', 2, 3, 'u'),
    ('REAL-127', 'RAP-012', 7, 'Tzatziki', 'Tzatziki', 2, 250, 'g'),
    ('REAL-146', 'VAR-023', 2, 'Msemen cuit', 'Msemen', 2, 8, 'u'),
    ('REAL-148', 'RAP-015', 7, 'Œuf dur', 'Œufs durs', 2, 6, 'u'),
    ('REAL-158', 'RAP-015', 7, 'Œuf dur', 'Œufs durs', 2, 4, 'u'),
    ('REAL-208', 'RAP-015', 9, 'Œuf dur', 'Œufs durs', 2, 6, 'u'),
    ('REAL-231', 'RAP-015', 8, 'Œuf dur', 'Œufs durs', 2, 4, 'u'),
    ('REAL-241', 'RAP-019', 4, 'Mayonnaise', 'Mayonnaise maison', 2, 120, 'g'),
    ('REAL-244', 'RAP-015', 2, 'Œuf dur', 'Œufs durs', 2, 8, 'u'),
    ('REAL-256', 'RAP-015', 7, 'Œuf dur', 'Œufs durs', 2, 4, 'u'),
    ('REAL-257', 'RAP-015', 8, 'Œuf dur', 'Œufs durs', 2, 4, 'u'),
    ('REAL-274', 'RAP-019', 2, 'Mayonnaise', 'Mayonnaise maison', 2, 120, 'g'),
    ('REAL-280', 'RAP-015', 5, 'Œuf dur', 'Œufs durs', 2, 3, 'u'),
    ('REAL-282', 'RAP-016', 9, 'Riz long blanc cuit', 'Riz créole', 2, 700, 'g'),
    ('REAL-283', 'RAP-015', 10, 'Œuf dur', 'Œufs durs', 2, 4, 'u'),
    ('REAL-284', 'RAP-019', 6, 'Mayonnaise', 'Mayonnaise maison', 2, 180, 'g'),
    ('REAL-284', 'RAP-015', 8, 'Œuf dur', 'Œufs durs', 3, 4, 'u'),
    ('REAL-286', 'RAP-019', 5, 'Mayonnaise', 'Mayonnaise maison', 2, 150, 'g'),
    ('REAL-299', 'RAP-007', 2, 'Bouillon de légumes', 'Bouillon de légumes', 2, 1400, 'ml'),
    ('SRC-015', 'RAP-019', 2, 'Mayonnaise', 'Mayonnaise maison', 2, 35, 'g'),
    ('SRC-015-D1', 'RAP-019', 2, 'Mayonnaise', 'Mayonnaise maison', 2, 35, 'g'),
    ('SRC-015-D3', 'RAP-019', 2, 'Mayonnaise', 'Mayonnaise maison', 2, 55, 'g'),
    ('SRC-015-D4', 'RAP-019', 2, 'Mayonnaise', 'Mayonnaise maison', 2, 35, 'g'),
    ('SRC-017', 'RAP-015', 4, 'Œuf dur', 'Œufs durs', 2, 3, 'u'),
    ('SRC-017-D1', 'RAP-015', 4, 'Œuf dur', 'Œufs durs', 2, 3, 'u'),
    ('SRC-017-D2', 'RAP-015', 4, 'Œuf dur', 'Œufs durs', 2, 3, 'u'),
    ('SRC-017-D3', 'RAP-015', 4, 'Œuf dur', 'Œufs durs', 2, 3, 'u'),
    ('SRC-017-D4', 'RAP-015', 4, 'Œuf dur', 'Œufs durs', 2, 3, 'u'),
    ('SRC-025', 'RAP-015', 4, 'Œuf dur', 'Œufs durs', 2, 150, 'g'),
    ('SRC-025', 'RAP-019', 6, 'Mayonnaise', 'Mayonnaise maison', 3, 125, 'g'),
    ('SRC-025-D1', 'RAP-015', 4, 'Œuf dur', 'Œufs durs', 2, 150, 'g'),
    ('SRC-025-D2', 'RAP-015', 4, 'Œuf dur', 'Œufs durs', 2, 150, 'g'),
    ('SRC-025-D2', 'RAP-019', 6, 'Mayonnaise', 'Mayonnaise maison', 3, 60, 'g'),
    ('SRC-025-D3', 'RAP-015', 4, 'Œuf dur', 'Œufs durs', 2, 150, 'g'),
    ('SRC-025-D3', 'RAP-019', 6, 'Mayonnaise', 'Mayonnaise maison', 3, 125, 'g'),
    ('SRC-025-D4', 'RAP-015', 3, 'Œuf dur', 'Œufs durs', 2, 300, 'g'),
    ('SRC-025-D4', 'RAP-019', 5, 'Mayonnaise', 'Mayonnaise maison', 3, 125, 'g'),
    ('SRC-052-D4', 'RAP-007', 3, 'Bouillon de légumes', 'Bouillon de légumes', 2, 500, 'ml'),
    ('SRC-055-D2', 'RAP-018', 10, 'Pâtes fraîches aux œufs crues', 'Pâtes fraîches maison', 2, 400, 'g'),
    ('VAR-019', 'RAP-007', 7, 'Bouillon de légumes', 'Bouillon de légumes', 2, 225, 'ml'),
    ('VAR-021', 'RAP-015', 4, 'Œuf dur', 'Œufs durs', 2, 3, 'u'),
    ('VAR-025', 'RAP-007', 8, 'Bouillon de légumes', 'Bouillon de légumes', 2, 700, 'ml'),
    ('VAR-029', 'RAP-015', 5, 'Œuf dur', 'Œufs durs', 2, 3, 'u'),
    ('VAR-030', 'RAP-019', 5, 'Mayonnaise', 'Mayonnaise maison', 2, 120, 'g'),
    ('VAR-030', 'RAP-015', 6, 'Œuf dur', 'Œufs durs', 3, 3, 'u'),
    ('VAR-035', 'RAP-004', 3, 'Pâte brisée crue', 'Pâte brisée', 2, 250, 'g'),
    ('VAR-037', 'RAP-004', 3, 'Pâte brisée crue', 'Pâte brisée', 2, 250, 'g'),
    ('VAR-038', 'RAP-004', 3, 'Pâte brisée crue', 'Pâte brisée', 2, 250, 'g'),
    ('VAR-040', 'RAP-007', 1, 'Bouillon de légumes', 'Bouillon de légumes', 2, 1500, 'ml'),
    ('VAR-041', 'RAP-004', 2, 'Pâte brisée crue', 'Pâte brisée', 2, 250, 'g'),
    ('VAR-042', 'RAP-007', 2, 'Bouillon de légumes', 'Bouillon de légumes', 2, 500, 'ml');

-- 1. Le composant : une ligne par (plat, base), qui porte la sous-recette et la
--    quantité que le plat en demande pour ses portions de référence.
INSERT INTO culinary.recipe_components
  (recipe_version_id, name, component_role, position, sub_recipe_version_id,
   required_quantity, required_unit)
SELECT parent.id, lien.component_name, 'base', lien.component_pos, enfant.id,
       lien.required_quantity, lien.required_unit
FROM _liens lien
JOIN ops.source_datasets dataset ON dataset.code = 'myko_editorial_v3'
JOIN culinary.recipe_versions parent
  ON parent.source_dataset_id = dataset.id AND upper(parent.source_record_key) = lien.parent_code
JOIN culinary.recipe_versions enfant
  ON enfant.source_dataset_id = dataset.id AND upper(enfant.source_record_key) = lien.base_code
WHERE NOT EXISTS (
  SELECT 1 FROM culinary.recipe_components existant
  WHERE existant.recipe_version_id = parent.id
    AND existant.sub_recipe_version_id = enfant.id
);

-- 2. L'exigence d'ingrédient désigne ce composant. Le rapprochement se fait sur
--    la POSITION et sur le LIBELLÉ ÉDITORIAL à la fois : la position seule
--    rattacherait la base à la mauvaise ligne si une fiche était réécrite, et le
--    libellé seul ne trancherait pas une recette qui emploierait deux fois la
--    même forme.
UPDATE culinary.recipe_ingredient_requirements exigence
SET component_id = composant.id,
    requirement_type = 'sub_recipe'
FROM _liens lien
JOIN ops.source_datasets dataset ON dataset.code = 'myko_editorial_v3'
JOIN culinary.recipe_versions parent
  ON parent.source_dataset_id = dataset.id AND upper(parent.source_record_key) = lien.parent_code
JOIN culinary.recipe_versions enfant
  ON enfant.source_dataset_id = dataset.id AND upper(enfant.source_record_key) = lien.base_code
JOIN culinary.recipe_components composant
  ON composant.recipe_version_id = parent.id AND composant.sub_recipe_version_id = enfant.id
WHERE exigence.recipe_version_id = parent.id
  AND exigence.position = lien.ingredient_pos
  AND exigence.source_name = lien.ingredient_name
  AND (exigence.component_id IS DISTINCT FROM composant.id
       OR exigence.requirement_type IS DISTINCT FROM 'sub_recipe');

-- 3. L'empreinte de contenu des plats liés. `check-corpus-parity` compare
--    recette par recette le md5 du JSON du dépôt à `content_hash` en base ;
--    poser un `component` change ce JSON. Les dix tranches du 17 septembre
--    sont figées et portent l'empreinte d'AVANT : sans cette mise à jour, la
--    parité échouerait sur 71 recettes à la première release, pour un écart
--    qui n'en est pas un. Écrite APRÈS les liens et dans la même transaction.
--    La garde sur l'empreinte d'avant évite d'écraser un rechargement de corpus
--    plus récent qui porterait déjà la nouvelle.
CREATE TEMP TABLE _empreintes (code text, avant text, apres text) ON COMMIT DROP;

INSERT INTO _empreintes VALUES
    ('DESS-006', '652652704fb14e6fd3ac3667c68b4c18', '6c45edc57766750f5a59eca14d08c85c'),
    ('DESS-011', '66fe725d0983e345afec504d5cd47208', 'f6ac7f4f5ecd349c311b736c8b4c61ac'),
    ('FR-005', 'a4c863534e92be46f75f15a709b56aae', 'cb46d281aa28a2ddb485f60f5994ba2d'),
    ('FR-014', '4df198d72591dcf495474de1c09e98f8', 'f029d5d2ce3721dea0b5282ae4b244ef'),
    ('FR-029', '7993e2ce2b7c9e511fb7f5dedfeb0869', '89025d43eae5f31fb53b967782c0bca3'),
    ('FR-036', 'f8f33c16ce2129baa18f9f591dfc4032', 'f6b001f96bc9b18a3e14e8cad7f26333'),
    ('FR-039', '5e2d0770f0fdc0219bf5463484e85c51', '72a10e48ed3482ed3e8a97b376cbc910'),
    ('JUM-002', '2564c3d64556c8e036a869f90a403a05', '43b48d5000251076ce4e931e6fb0fca7'),
    ('JUM-004', 'd1c35ccfebce558b6ec456dbebb7eb19', 'a5f9daf1c201073e365527ce8bbeec20'),
    ('JUM-005', '9e640d1931504d6c0b9f2154ca38f506', 'b5ca93062bb6cf974c3e2c9c358f788f'),
    ('JUM-006', '09513dce850ec05eea7e911b96acda80', '747b6a7c8caeb78206414230b1a7d6cb'),
    ('JUM-007', '2423d8363bcbdbffe817bcb3c1f0b638', 'ad471562b644f25fa1edf038da4660e1'),
    ('JUM-033', 'e9e120cb7da06b6c338f0d1b3332e631', 'ee907de06c347f04552fe7cc83757567'),
    ('JUM-053', 'aab3b916f84f0ac059a84f9cdb234645', 'f6338405d59b2fb89f7483634ba4e92c'),
    ('JUM-061', 'd75822760c5c2618b41cfcfb20b5855b', '659b724cddc4c7ade9829b6ec82479b1'),
    ('JUM-062', 'bf77f286df1b3f3eae46aa965a82ff2c', '9e4f37485043923a69bb9b011d12461d'),
    ('JUM-063', '4f422e47f9d443684345c4ee5618bd60', 'a4e9c5b0f463fb04ff444fea6efb6104'),
    ('JUM-071', 'e348a7c8653ee26dfdb10fb0215f70e1', 'f1e42a5158c41b30c9f015689fb9285e'),
    ('JUM-073', 'cb23133d0ac24bc579a76fc1355e1aff', '009d6ad1c8509c6cbcd34ff5fe1cd4c4'),
    ('JUM-074', '3f068bfc9119a0e022d4c073479d314b', '02dc8b0e783230a5fb583cb6e5c09cb8'),
    ('JUM-082', 'd975f45e7ded8d7f82e208a422d62a5a', '095db5a31786a0a9fd7a81e2d03c3626'),
    ('JUM-114', '668c681dffd67c67f736ed61091af7a8', '8d41d5bf12dee135bad6ea51c0b0e922'),
    ('RAP-031', '971e66b64e2a2013a01e647e4144692f', 'c840e98b472a5102d582b95aaf120347'),
    ('RAP-045', 'ef57ac707bfba5285c7b58ffcdbd4978', '0809e280975188c67341f6c734cc166e'),
    ('RAP-050', 'bdd8872ee052df842d85061211f45f15', '03791bbc8cd4059acdee495dd7c439b1'),
    ('REAL-088', 'ea6034e4f89d9c5615599be8fcbaa8a8', '1f432d29c4a4ca328618367068022bd0'),
    ('REAL-115', 'e311cddd19fdf0f1df2c72e41dc7b63e', 'd4ee4ef5e4dfdeb1bcb23c37c74ec077'),
    ('REAL-127', 'b9d63550b6ba86e8fe9473a1c4fc1333', '5f18f64f9ccab0fe7e568ac7fecda284'),
    ('REAL-146', '44177d661dc141a4f2d7e203f063b23c', 'db66b0fc97631829e53f347f1a217168'),
    ('REAL-148', 'd2d6af75b699eeae7bcf9ec1c7fa49f6', '687547e341130d9fa7e0b5a6b01d6976'),
    ('REAL-158', 'ff87a71a6050b176ca6d1c3823401f2f', '9dff21be95303aa457efc48f4c44f315'),
    ('REAL-208', 'fd5d69f0a9fbae6458991bc30ed5edb4', 'd11c9bff0faf0a241f04550abcb8a0e7'),
    ('REAL-231', '00e69480aa89b2a324b36dc978ba174e', 'a0a05327f4110d67c12cb8a06c6c9840'),
    ('REAL-241', 'e112ed08172f3306052c9c86da13ab7f', 'afd42e6361af3782a62dfe5f6cf1ea09'),
    ('REAL-244', 'f0ea7655f4992bb949c71e4cd5b0e3e8', 'ebd99ff3430135848c77beed9034ce95'),
    ('REAL-256', '3868b19ada7645b14dc2d64594e174dd', '35e37ef19b47e008b02543a74fb3c3a9'),
    ('REAL-257', '2fa1f1f07e1f5ed9d2b1e243696334af', 'e17e502a74232e622c3dc3e986ef972a'),
    ('REAL-274', 'd2f07e680b907425449bee7ac44d248e', '9070a7037374c7b61eade1f8a61a3a94'),
    ('REAL-280', 'b68c4ef90638f2746f83820876bf8034', '69fcc6cc76922bc3239e9b40488e6b6d'),
    ('REAL-282', 'f8b053e85f6109d401155d07bfd15536', '7fdff71db5cb2dd3689f3bb8d5d875ea'),
    ('REAL-283', 'de6b64e15ee01643587e3d3c9cb984b6', '7fc01ab85bdff91b026d409d44eb0614'),
    ('REAL-284', 'a83aa850033cd847c5ad7c3dfcc9a36a', '9f1d2fca123651629c634e1523026fde'),
    ('REAL-286', '2dae14f3cef776b1ce5eb3c54f3a30c9', '1f545119ac40f36abcc003346549ef75'),
    ('REAL-299', '55cdb88c4fecff3aebce47dc57d1ebfc', '54ac8d030ce70777a7c3384861c911d1'),
    ('SRC-015', 'b92c45b9bef8a4c6fb007eacb61e161c', 'a39ede7012c74da1c0c983da9ab8e2b0'),
    ('SRC-015-D1', '1854b2d708ab5e1e9a7d1175cbdefe77', 'f2c13a0254ecd2dcd943e714df617da3'),
    ('SRC-015-D3', '14906bce55c44bc542a7ed81201b87a1', 'f4bbd2a97c5e722bf5285e0ff3f55b90'),
    ('SRC-015-D4', 'f21ad17632b60d964775f83163c5c7ed', '69950bad269d50a671608ec2d508c915'),
    ('SRC-017', '0371598f48d4c6370e2384107bb02de0', 'f616fe13c7d0e8417214d8b7a8117491'),
    ('SRC-017-D1', 'cbf59c8687f988a316882ebbedf4033e', '45570df2398834af626b1f4fbb50d3f1'),
    ('SRC-017-D2', '747e123350d8e5e5c825994c4593bbc3', '69d8723d8b621c866dd139b030b14280'),
    ('SRC-017-D3', '2e2b9fab2529608a3e2819a762ee51b6', '5357097d601dbf5a7a442c6c65ddef9c'),
    ('SRC-017-D4', 'ea468577f8d4742ba62f5d65069bc17c', 'd38777502be9c1addc203b1786fe04a7'),
    ('SRC-025', '6767ca05e39ddcac7d138a7bbab36328', 'b46ce44e150ec8e1c8412364b556837f'),
    ('SRC-025-D1', 'd94cdf814a44213588f14878d30c84e5', 'f3cf2d173ec732b12468b302edbe3771'),
    ('SRC-025-D2', 'e1fcb7dbc12dbc1fa2dd0bb1f000191a', '2e6b5659411504b1ca92ec4d3827c930'),
    ('SRC-025-D3', '26ae295f8378917f7254b9edd184e742', 'eef66daa80042d66841846acda70fc2b'),
    ('SRC-025-D4', 'c9429737b96d0ef4a7e3b715d81b71fe', 'ee195114ccdfd8e1dd9581ffed1f65d7'),
    ('SRC-052-D4', 'fe5eacb49827fcab2f2064d41fe4e889', 'be769f2ef5d629a2b4b0c40f242f07d5'),
    ('SRC-055-D2', '693011fbd66f46d8705726ddf47ce717', 'e89caf32de24453ac33833d7e7a87a14'),
    ('VAR-019', '09f482e2ee3953d225bc5c290ea762dc', 'eb4f3c2368f923575a3065b15e416e84'),
    ('VAR-021', '736b97c841e9cf7baa09928ac1d5bb15', '731043add84b6e530b382a9f7eecf884'),
    ('VAR-025', 'fd36f68db33e2cfbbdb89eccf1ea885d', 'b1fb09c0995c471598e9a004a9976c0b'),
    ('VAR-029', 'a5d46843d7bbca8ed862c964b9fa423e', 'a000f199a6d248f64c1069e8201a644a'),
    ('VAR-030', '6a5eb57d122675d72a184f61e1d6ea75', '2f8d29b9c909854d065a3f3af413fc3b'),
    ('VAR-035', 'b14de1af7ef345b97b681cab2f4cad28', 'd347791f5fe6e490e55c7ae8f58c02d3'),
    ('VAR-037', '658a5397ff51dc1108c9f204ea972cce', 'ba32e29b72479e4b923eaa8bd8ce6d1b'),
    ('VAR-038', '112ca4e35b0fa97bec865ae9272f8335', 'de823f21869595af6489099aa25e24c0'),
    ('VAR-040', '723fac2642b717b2717e44289dea537e', '9a1a79f9dd3e2c99d2e2dd767b48bb8a'),
    ('VAR-041', '80b593f256a158828b6b7568fc83d242', 'fe8d729950c7701976bd6aeabb105b11'),
    ('VAR-042', 'e48bde7984d62da72b0c6f65ad765626', '3915aa67cbae7b6804f6d70c36b0c8d0');

UPDATE culinary.recipe_versions version
SET content_hash = empreinte.apres
FROM _empreintes empreinte
JOIN ops.source_datasets dataset ON dataset.code = 'myko_editorial_v3'
WHERE version.source_dataset_id = dataset.id
  AND upper(version.source_record_key) = empreinte.code
  AND version.content_hash = empreinte.avant;

-- La provenance du champ « content » porte le même md5 que la version (le
-- chargeur écrit les deux en un seul passage). Personne ne la LIT aujourd'hui —
-- aucune occurrence de `field_provenance` hors des chargeurs — mais la laisser
-- sur l'ancienne empreinte ferait dire à la trace de provenance autre chose
-- qu'à la ligne qu'elle trace, et c'est le genre d'écart qu'on ne retrouve plus.
UPDATE ops.field_provenance provenance
SET normalized_value = to_jsonb(empreinte.apres)
FROM _empreintes empreinte
JOIN ops.source_datasets dataset ON dataset.code = 'myko_editorial_v3'
JOIN culinary.recipe_versions version
  ON version.source_dataset_id = dataset.id AND upper(version.source_record_key) = empreinte.code
WHERE provenance.entity_schema = 'culinary'
  AND provenance.entity_table = 'recipe_versions'
  AND provenance.entity_id = version.id
  AND provenance.field_name = 'content'
  AND provenance.normalized_value = to_jsonb(empreinte.avant);

-- Ce que la migration a réellement posé, imprimé par l'application : un compte
-- inférieur à 77 dit qu'une fiche a bougé en base depuis l'arbitrage.
SELECT count(*) AS exigences_liees
FROM culinary.recipe_ingredient_requirements exigence
JOIN culinary.recipe_components composant ON composant.id = exigence.component_id
WHERE composant.sub_recipe_version_id IS NOT NULL;
