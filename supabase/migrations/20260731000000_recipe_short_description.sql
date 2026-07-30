-- Une colonne pour dire, en français, ce qu'on va manger.
--
-- Le planning affichait « İmam bayıldı », « Bacalao al pil-pil », « Mujaddara »,
-- « Thịt kho trứng ». Les noms authentiques sont à leur place — ils nomment le
-- plat tel qu'il s'appelle — mais rien ne disait ce que c'est, et l'utilisateur
-- lisait sa semaine sans savoir ce qu'il mangerait.
--
-- Trois cent quatre-vingt-douze recettes publiables portent désormais une
-- description courte au corpus. Elle nomme les ingrédients principaux et la
-- forme du plat, jamais son histoire : « Bœuf mijoté longuement dans un bouillon
-- paprikaté avec pommes de terre, tomates et poivrons » plutôt que l'étymologie
-- du mot goulash.
--
-- La colonne est NULLABLE à dessein. Cent quatre-vingt-quatre recettes non
-- publiables n'en ont pas encore, et une description absente doit rester une
-- absence — pas une chaîne vide qui se lirait comme une description écrite puis
-- effacée. C'est la même règle que pour la nutrition : une absence ne devient
-- jamais un zéro.
ALTER TABLE culinary.recipe_versions
  ADD COLUMN IF NOT EXISTS short_description text;

COMMENT ON COLUMN culinary.recipe_versions.short_description IS
  'Description courte en français : ingrédients principaux et forme du plat. NULL tant qu''elle n''est pas écrite — une absence n''est pas une chaîne vide.';
