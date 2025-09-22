-- =======================================================================
-- SCHÉMA COMPLET SUPABASE - SYSTÈME D'INVENTAIRE ALIMENTAIRE ET RECETTES
-- =======================================================================

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =======================================================================
-- TABLES DE RÉFÉRENCE
-- =======================================================================

-- Catégories de référence avec propriétés par défaut
CREATE TABLE reference_categories (
    id bigint PRIMARY KEY DEFAULT nextval('reference_categories_id_seq'::regclass),
    name text NOT NULL,
    parent_category text,
    icon text,
    color_hex text,
    typical_storage text,
    average_shelf_life_days integer,
    sort_priority integer DEFAULT 50
);

-- Lieux de stockage
CREATE TABLE locations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    sort_order integer,
    icon text
);

-- Catalogue des ustensiles
CREATE TABLE utensils_catalog (
    id integer PRIMARY KEY DEFAULT nextval('utensils_catalog_id_seq'::regclass),
    name text NOT NULL,
    category text,
    icon text,
    common_alternatives text[],
    created_at timestamp with time zone DEFAULT now()
);

-- =======================================================================
-- HIÉRARCHIE DES PRODUITS ALIMENTAIRES
-- =======================================================================

-- Aliments canoniques (base de données de référence)
CREATE TABLE canonical_foods (
    id bigint PRIMARY KEY DEFAULT nextval('canonical_foods_id_seq'::regclass),
    canonical_name text NOT NULL,
    category_id bigint REFERENCES reference_categories(id),
    subcategory text,
    keywords text[], -- Mots-clés pour recherche
    primary_unit text DEFAULT 'u',
    
    -- Propriétés physiques
    unit_weight_grams numeric,
    unit_volume_ml numeric,
    density_g_per_ml numeric,
    
    -- Données nutritionnelles (pour 100g)
    calories_per_100g numeric,
    protein_g_per_100g numeric,
    carbs_g_per_100g numeric,
    fat_g_per_100g numeric,
    fiber_g_per_100g numeric,
    sugar_g_per_100g numeric,
    sodium_mg_per_100g numeric,
    
    -- Durées de conservation par méthode (jours)
    shelf_life_days_pantry integer,
    shelf_life_days_fridge integer,
    shelf_life_days_freezer integer,
    
    -- Origine et saisonnalité
    origin_country text[], -- Pays d'origine
    structured_seasons jsonb, -- Données de saisonnalité
    category_parent text,
    category_child text,
    
    -- Méthodes de conservation possibles
    can_conserve_bocal boolean DEFAULT false,
    can_lactofermentation boolean DEFAULT false,
    can_sechage boolean DEFAULT false,
    can_congelation boolean DEFAULT false,
    can_confiture boolean DEFAULT false,
    can_vinaigre boolean DEFAULT false,
    can_huile boolean DEFAULT false,
    
    -- Paramètres de transformation
    process_params jsonb,
    
    -- Métadonnées
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Variétés/cultivars spécifiques
CREATE TABLE cultivars (
    id bigint PRIMARY KEY DEFAULT nextval('cultivars_id_seq'::regclass),
    canonical_food_id bigint REFERENCES canonical_foods(id),
    cultivar_name text NOT NULL,
    synonyms text[], -- Noms alternatifs
    region_code text DEFAULT 'FR',
    
    -- Données nutritionnelles spécifiques (peut surcharger canonical)
    calories_per_100g numeric,
    protein_g_per_100g numeric,
    carbs_g_per_100g numeric,
    fat_g_per_100g numeric,
    fiber_g_per_100g numeric,
    sugar_g_per_100g numeric,
    sodium_mg_per_100g numeric,
    
    -- Durées de conservation spécifiques
    shelf_life_days_pantry integer,
    shelf_life_days_fridge integer,
    shelf_life_days_freezer integer,
    
    -- Spécificités du cultivar
    season_availability text[], -- Mois de disponibilité
    origin_country text[],
    
    -- Méthodes de conservation (peut surcharger canonical)
    can_conserve_bocal boolean,
    can_lactofermentation boolean,
    can_sechage boolean,
    can_congelation boolean,
    can_confiture boolean,
    can_vinaigre boolean,
    can_huile boolean,
    process_params jsonb,
    
    -- Métadonnées
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Produits dérivés/transformés
CREATE TABLE derived_products (
    id bigint PRIMARY KEY DEFAULT nextval('derived_products_id_seq'::regclass),
    cultivar_id bigint REFERENCES cultivars(id),
    derived_name text NOT NULL,
    process_method text, -- Méthode de transformation
    notes text,
    batch_date date DEFAULT CURRENT_DATE,
    expected_shelf_life_days integer,
    expiration_date date,
    package_size numeric,
    package_unit text,
    
    -- Données nutritionnelles du produit transformé
    calories_per_100g numeric,
    protein_g_per_100g numeric,
    carbs_g_per_100g numeric,
    fat_g_per_100g numeric,
    fiber_g_per_100g numeric,
    sugar_g_per_100g numeric,
    sodium_mg_per_100g numeric,
    
    -- Métadonnées
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Produits génériques (définis par l'utilisateur)
CREATE TABLE generic_products (
    id bigint PRIMARY KEY DEFAULT nextval('generic_products_id_seq'::regclass),
    name text NOT NULL,
    category_id bigint REFERENCES reference_categories(id),
    subcategory text,
    keywords text[],
    primary_unit text,
    
    -- Propriétés physiques
    unit_weight_grams numeric,
    unit_volume_ml numeric,
    density_g_per_ml numeric,
    
    -- Durées de conservation
    shelf_life_days_pantry integer,
    shelf_life_days_fridge integer,
    shelf_life_days_freezer integer,
    
    -- Données nutritionnelles
    calories_per_100g numeric,
    protein_g_per_100g numeric,
    carbs_g_per_100g numeric,
    fat_g_per_100g numeric,
    fiber_g_per_100g numeric,
    sugar_g_per_100g numeric,
    sodium_mg_per_100g numeric,
    
    -- Métadonnées
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =======================================================================
-- SYSTÈME D'ALIAS ET RECHERCHE
-- =======================================================================

-- Alias pour améliorer la recherche
CREATE TABLE product_aliases (
    id bigint PRIMARY KEY DEFAULT nextval('product_aliases_id_seq'::regclass),
    -- Références flexibles vers la hiérarchie
    canonical_food_id bigint REFERENCES canonical_foods(id),
    cultivar_id bigint REFERENCES cultivars(id),
    derived_product_id bigint REFERENCES derived_products(id),
    generic_product_id bigint REFERENCES generic_products(id),
    
    alias_name text NOT NULL,
    alias_type text, -- 'synonym', 'common_name', 'brand', etc.
    language text DEFAULT 'fr',
    popularity_score numeric DEFAULT 0.5 -- Score de popularité pour le classement
);

-- =======================================================================
-- GESTION DES STOCKS
-- =======================================================================

-- Lots d'inventaire avec référence flexible
CREATE TABLE inventory_lots (
    id bigint PRIMARY KEY DEFAULT nextval('inventory_lots_id_seq'::regclass),
    
    -- Références flexibles vers la hiérarchie de produits
    canonical_food_id bigint REFERENCES canonical_foods(id),
    cultivar_id bigint REFERENCES cultivars(id),
    derived_product_id bigint REFERENCES derived_products(id),
    generic_product_id bigint REFERENCES generic_products(id),
    
    -- Quantités
    qty_remaining numeric,
    initial_qty numeric,
    unit text,
    
    -- Stockage
    storage_method text, -- 'pantry', 'fridge', 'freezer'
    storage_place text,
    
    -- Dates importantes
    acquired_on date,
    produced_on date,
    opened_on date,
    expiration_date date,
    
    -- Métadonnées
    notes text,
    source text DEFAULT 'manual', -- 'manual', 'recipe_output', 'purchase', etc.
    owner_id uuid,
    
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Guides de conservation spécifiques
CREATE TABLE storage_guides (
    id bigint PRIMARY KEY DEFAULT nextval('storage_guides_id_seq'::regclass),
    -- Références flexibles
    canonical_food_id bigint REFERENCES canonical_foods(id),
    cultivar_id bigint REFERENCES cultivars(id),
    derived_product_id bigint REFERENCES derived_products(id),
    
    method text, -- 'fridge', 'freezer', 'pantry', 'cellar', etc.
    temp_c_min numeric,
    temp_c_max numeric,
    humidity_pct numeric,
    shelf_life_days integer,
    notes text
);

-- =======================================================================
-- SYSTÈME DE RECETTES
-- =======================================================================

-- Recettes
CREATE TABLE recipes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    steps text, -- Texte libre pour compatibilité
    
    -- Temps et difficulté
    time_min integer,
    prep_min integer,
    cook_min integer,
    total_min integer,
    difficulty text, -- 'easy', 'medium', 'hard'
    
    -- Métadonnées
    servings integer DEFAULT 2,
    tags text[],
    category text,
    is_veg boolean,
    is_divisible boolean DEFAULT true,
    
    -- Source et attribution
    author text,
    source_canonical_url text,
    image_url text,
    
    -- Données nutritionnelles calculées
    nutrition jsonb,
    
    -- Métadonnées
    created_at timestamp with time zone DEFAULT now(),
    scraped_at timestamp with time zone DEFAULT now()
);

-- Ingrédients de recettes avec référence flexible
CREATE TABLE recipe_ingredients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id uuid NOT NULL REFERENCES recipes(id),
    product_id uuid, -- Référence legacy
    
    -- Références flexibles vers la hiérarchie
    canonical_food_id bigint REFERENCES canonical_foods(id),
    cultivar_id bigint REFERENCES cultivars(id),
    derived_product_id bigint REFERENCES derived_products(id),
    generic_product_id bigint REFERENCES generic_products(id),
    
    -- Quantité et unité
    qty numeric NOT NULL,
    unit text DEFAULT 'g',
    
    -- Métadonnées de l'ingrédient
    note text,
    position integer,
    is_optional boolean,
    preparation text, -- 'diced', 'chopped', 'grated', etc.
    product_specificity text -- Niveau de spécificité requis
);

-- Étapes de recettes
CREATE TABLE recipe_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id uuid REFERENCES recipes(id),
    step_no integer NOT NULL,
    instruction text NOT NULL,
    duration_min integer,
    temperature integer,
    temperature_unit text DEFAULT '°C'
);

-- Outils nécessaires
CREATE TABLE recipe_tools (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id uuid REFERENCES recipes(id),
    tool text NOT NULL
);

-- Ustensiles avec quantités
CREATE TABLE recipe_utensils (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id uuid REFERENCES recipes(id),
    utensil_name text NOT NULL,
    quantity integer DEFAULT 1,
    is_optional boolean,
    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- =======================================================================
-- CONVERSIONS ET SUBSTITUTIONS
-- =======================================================================

-- Conversions d'unités génériques
CREATE TABLE unit_conversions_generic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    from_unit text NOT NULL,
    to_unit text NOT NULL,
    factor numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Conversions spécifiques par produit
CREATE TABLE unit_conversions_product (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid, -- Référence flexible nécessaire
    from_unit text NOT NULL,
    to_unit text NOT NULL,
    factor numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Substitutions possibles entre produits
CREATE TABLE substitutions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid,
    substitute_product_id uuid,
    note text -- Ratio de substitution et notes
);

-- Observations utilisateur pour améliorer les conversions
CREATE TABLE product_meta_observations (
    id bigint PRIMARY KEY,
    product_id uuid,
    grams_per_unit_obs numeric, -- Poids observé par unité
    density_g_per_ml_obs numeric, -- Densité observée
    source text DEFAULT 'cook', -- Source de l'observation
    created_at timestamp with time zone DEFAULT now()
);

-- =======================================================================
-- INDEX POUR LES PERFORMANCES
-- =======================================================================

-- Index sur les recherches de produits
CREATE INDEX idx_canonical_foods_category ON canonical_foods(category_id);
CREATE INDEX idx_canonical_foods_name_search ON canonical_foods USING gin(to_tsvector('french', canonical_name));
CREATE INDEX idx_canonical_foods_keywords ON canonical_foods USING gin(keywords);

-- Index sur la hiérarchie
CREATE INDEX idx_cultivars_canonical_food ON cultivars(canonical_food_id);
CREATE INDEX idx_derived_products_cultivar ON derived_products(cultivar_id);

-- Index sur les alias
CREATE INDEX idx_product_aliases_name ON product_aliases USING gin(to_tsvector('french', alias_name));
CREATE INDEX idx_product_aliases_canonical ON product_aliases(canonical_food_id);
CREATE INDEX idx_product_aliases_cultivar ON product_aliases(cultivar_id);

-- Index sur l'inventaire
CREATE INDEX idx_inventory_lots_canonical ON inventory_lots(canonical_food_id);
CREATE INDEX idx_inventory_lots_cultivar ON inventory_lots(cultivar_id);
CREATE INDEX idx_inventory_lots_derived ON inventory_lots(derived_product_id);
CREATE INDEX idx_inventory_lots_generic ON inventory_lots(generic_product_id);
CREATE INDEX idx_inventory_lots_expiration ON inventory_lots(expiration_date);
CREATE INDEX idx_inventory_lots_storage ON inventory_lots(storage_place);

-- Index sur les recettes
CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_canonical ON recipe_ingredients(canonical_food_id);
CREATE INDEX idx_recipe_steps_recipe ON recipe_steps(recipe_id, step_no);

-- =======================================================================
-- TRIGGERS POUR UPDATE AUTOMATIQUE
-- =======================================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer aux tables avec updated_at
CREATE TRIGGER update_canonical_foods_updated_at 
    BEFORE UPDATE ON canonical_foods 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cultivars_updated_at 
    BEFORE UPDATE ON cultivars 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_derived_products_updated_at 
    BEFORE UPDATE ON derived_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generic_products_updated_at 
    BEFORE UPDATE ON generic_products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_lots_updated_at 
    BEFORE UPDATE ON inventory_lots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================================================================
-- VUES UTILES
-- =======================================================================

-- Vue consolidée de l'inventaire
CREATE OR REPLACE VIEW v_inventory_display AS
SELECT 
    il.*,
    -- Nom d'affichage selon la hiérarchie
    COALESCE(
        cf.canonical_name,
        cv.cultivar_name,
        dp.derived_name,
        gp.name,
        'Produit inconnu'
    ) as display_name,
    
    -- Catégorie
    COALESCE(
        rc_cf.name,
        rc_gp.name
    ) as category_name,
    
    -- Icône de catégorie
    COALESCE(
        rc_cf.icon,
        rc_gp.icon,
        '📦'
    ) as category_icon,
    
    -- Statut d'expiration
    CASE 
        WHEN il.expiration_date IS NULL THEN 'no_date'
        WHEN il.expiration_date < CURRENT_DATE THEN 'expired'
        WHEN il.expiration_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'expires_soon'
        WHEN il.expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'expires_this_week'
        ELSE 'good'
    END as expiration_status,
    
    -- Jours jusqu'expiration
    CASE 
        WHEN il.expiration_date IS NOT NULL THEN 
            EXTRACT(days FROM il.expiration_date - CURRENT_DATE)::integer
        ELSE NULL
    END as days_until_expiration

FROM inventory_lots il
LEFT JOIN canonical_foods cf ON il.canonical_food_id = cf.id
LEFT JOIN cultivars cv ON il.cultivar_id = cv.id
LEFT JOIN derived_products dp ON il.derived_product_id = dp.id
LEFT JOIN generic_products gp ON il.generic_product_id = gp.id
LEFT JOIN reference_categories rc_cf ON cf.category_id = rc_cf.id
LEFT JOIN reference_categories rc_gp ON gp.category_id = rc_gp.id

WHERE il.qty_remaining > 0

ORDER BY il.expiration_date ASC NULLS LAST;

-- =======================================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- =======================================================================

COMMENT ON TABLE canonical_foods IS 'Aliments de référence avec données nutritionnelles complètes';
COMMENT ON TABLE cultivars IS 'Variétés spécifiques des aliments canoniques';
COMMENT ON TABLE derived_products IS 'Produits transformés à partir des cultivars';
COMMENT ON TABLE generic_products IS 'Produits personnalisés définis par l''utilisateur';
COMMENT ON TABLE inventory_lots IS 'Stocks actuels avec référence flexible vers la hiérarchie';
COMMENT ON TABLE product_aliases IS 'Alias et synonymes pour améliorer la recherche';
COMMENT ON TABLE recipes IS 'Recettes avec métadonnées complètes';
COMMENT ON TABLE recipe_ingredients IS 'Ingrédients avec référence flexible vers la hiérarchie';
COMMENT ON VIEW v_inventory_display IS 'Vue formatée de l''inventaire avec statuts d''expiration';

-- =======================================================================
-- DONNÉES D'EXEMPLE POUR TESTS
-- =======================================================================

-- Insertion des catégories de base (exemple)
INSERT INTO reference_categories (id, name, icon, typical_storage, average_shelf_life_days, sort_priority) VALUES
(1, 'Fruits', '🍎', 'fridge', 7, 50),
(2, 'Légumes', '🥕', 'fridge', 5, 50),
(5, 'Céréales', '🌾', 'pantry', 365, 30)
ON CONFLICT (id) DO NOTHING;

-- Insertion des lieux de stockage (exemple)
INSERT INTO locations (name, sort_order, icon) VALUES
('Frigo', 1, '🧊'),
('Placard', 2, '🧺'),
('Congélateur', 3, '❄️')
ON CONFLICT DO NOTHING;

-- Conversions d'unités génériques de base
INSERT INTO unit_conversions_generic (from_unit, to_unit, factor) VALUES
('kg', 'g', 1000),
('g', 'kg', 0.001),
('L', 'ml', 1000),
('ml', 'L', 0.001),
('L', 'cl', 100),
('cl', 'L', 0.01)
ON CONFLICT DO NOTHING;

-- =======================================================================
-- FONCTIONS UTILITAIRES
-- =======================================================================

-- Fonction pour obtenir le nom d'affichage d'un lot
CREATE OR REPLACE FUNCTION get_lot_display_name(lot_row inventory_lots)
RETURNS text AS $
DECLARE
    result text;
BEGIN
    IF lot_row.canonical_food_id IS NOT NULL THEN
        SELECT canonical_name INTO result FROM canonical_foods WHERE id = lot_row.canonical_food_id;
    ELSIF lot_row.cultivar_id IS NOT NULL THEN
        SELECT cultivar_name INTO result FROM cultivars WHERE id = lot_row.cultivar_id;
    ELSIF lot_row.derived_product_id IS NOT NULL THEN
        SELECT derived_name INTO result FROM derived_products WHERE id = lot_row.derived_product_id;
    ELSIF lot_row.generic_product_id IS NOT NULL THEN
        SELECT name INTO result FROM generic_products WHERE id = lot_row.generic_product_id;
    ELSE
        result := 'Produit inconnu';
    END IF;
    
    RETURN COALESCE(result, 'Produit inconnu');
END;
$ LANGUAGE plpgsql;

-- Fonction pour calculer les jours jusqu'à expiration
CREATE OR REPLACE FUNCTION days_until_expiration(expiration_date date)
RETURNS integer AS $
BEGIN
    IF expiration_date IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN EXTRACT(days FROM expiration_date - CURRENT_DATE)::integer;
END;
$ LANGUAGE plpgsql;

-- =======================================================================
-- CONTRAINTES ET VALIDATIONS
-- =======================================================================

-- Contrainte : un lot doit avoir au moins une référence produit
ALTER TABLE inventory_lots ADD CONSTRAINT check_product_reference 
CHECK (
    canonical_food_id IS NOT NULL OR 
    cultivar_id IS NOT NULL OR 
    derived_product_id IS NOT NULL OR 
    generic_product_id IS NOT NULL
);

-- Contrainte : les quantités doivent être positives
ALTER TABLE inventory_lots ADD CONSTRAINT check_positive_quantities 
CHECK (qty_remaining >= 0 AND initial_qty > 0);

-- Contrainte : un alias doit avoir exactement une référence produit
ALTER TABLE product_aliases ADD CONSTRAINT check_alias_single_reference 
CHECK (
    (canonical_food_id IS NOT NULL)::int + 
    (cultivar_id IS NOT NULL)::int + 
    (derived_product_id IS NOT NULL)::int + 
    (generic_product_id IS NOT NULL)::int = 1
);

-- =======================================================================
-- POLICIES RLS (Row Level Security) - Optionnel
-- =======================================================================

-- Activer RLS sur les tables sensibles
-- ALTER TABLE inventory_lots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Politique exemple : les utilisateurs ne voient que leurs propres lots
-- CREATE POLICY user_inventory_lots ON inventory_lots
--     FOR ALL USING (auth.uid() = owner_id);

-- =======================================================================
-- MAINTENANCE ET NETTOYAGE
-- =======================================================================

-- Vue pour identifier les données orphelines
CREATE OR REPLACE VIEW v_orphaned_data AS
SELECT 
    'inventory_lots' as table_name,
    id::text as record_id,
    'No product reference' as issue
FROM inventory_lots 
WHERE canonical_food_id IS NULL 
  AND cultivar_id IS NULL 
  AND derived_product_id IS NULL 
  AND generic_product_id IS NULL

UNION ALL

SELECT 
    'product_aliases' as table_name,
    id::text as record_id,
    'Multiple product references' as issue
FROM product_aliases 
WHERE (canonical_food_id IS NOT NULL)::int + 
      (cultivar_id IS NOT NULL)::int + 
      (derived_product_id IS NOT NULL)::int + 
      (generic_product_id IS NOT NULL)::int > 1;

-- Fonction de nettoyage des lots expirés
CREATE OR REPLACE FUNCTION cleanup_expired_lots(days_threshold integer DEFAULT 30)
RETURNS integer AS $
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM inventory_lots 
    WHERE expiration_date < CURRENT_DATE - INTERVAL '1 day' * days_threshold
    AND qty_remaining = 0;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$ LANGUAGE plpgsql;
