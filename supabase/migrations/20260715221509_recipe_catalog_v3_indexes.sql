-- Index de lecture du catalogue éditorial et des compositions de recettes.
CREATE INDEX IF NOT EXISTS idx_recipe_components_recipe_version
  ON culinary.recipe_components (recipe_version_id, position);

CREATE INDEX IF NOT EXISTS idx_recipe_components_sub_recipe
  ON culinary.recipe_components (sub_recipe_version_id)
  WHERE sub_recipe_version_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recipe_requirements_recipe_position
  ON culinary.recipe_ingredient_requirements (recipe_version_id, position);

CREATE INDEX IF NOT EXISTS idx_recipe_requirements_component
  ON culinary.recipe_ingredient_requirements (component_id)
  WHERE component_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recipe_requirements_food_form
  ON culinary.recipe_ingredient_requirements (preferred_food_form_id)
  WHERE preferred_food_form_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_recipe_variation_axes_family
  ON culinary.recipe_variation_axes (recipe_family_id);

CREATE INDEX IF NOT EXISTS idx_recipe_variation_options_axis
  ON culinary.recipe_variation_options (variation_axis_id);
