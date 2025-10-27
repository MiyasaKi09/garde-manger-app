# Guide d'Intégration des Données Nutritionnelles Ciqual

## 📊 Vue d'Ensemble

Ce guide explique comment intégrer les données nutritionnelles de la base Ciqual (ANSES) dans l'application garde-manger pour calculer automatiquement les valeurs nutritionnelles des recettes.

## 🎯 Objectifs

1. **Lier** les `canonical_foods` aux aliments de référence Ciqual
2. **Importer** les données nutritionnelles dans la table `nutritional_data`
3. **Appliquer** les coefficients de transformation par cuisson via `cooking_nutrition_factors`
4. **Calculer** les valeurs nutritionnelles totales pour chaque recette

---

## 📥 Étape 1 : Télécharger les Données Ciqual

### Source Officielle

**Table Ciqual 2020** (ANSES - Agence nationale de sécurité sanitaire)
- URL : https://ciqual.anses.fr/
- Format : Fichier Excel ou CSV
- Contenu : ~3000 aliments avec ~60 nutriments

### Fichiers Nécessaires

```bash
# Télécharger depuis le site ANSES Ciqual
# Fichier principal : Table_Ciqual_2020.xlsx
# OU version CSV : ciqual_composition_nutritionnelle.csv
```

**Colonnes importantes :**
- `alim_code` : Code unique de l'aliment (ex: 11058)
- `alim_nom_fr` : Nom en français (ex: "Pomme de terre, cuite à l'eau")
- `energie_kcal` : Énergie en kcal/100g
- `proteines` : Protéines en g/100g
- `glucides` : Glucides en g/100g
- `lipides` : Lipides en g/100g
- `fibres` : Fibres alimentaires en g/100g
- `sel` : Sel en g/100g
- `calcium`, `fer`, `vitamine_c`, etc.

---

## 🗂️ Étape 2 : Structure de la Base de Données

### Tables Existantes

#### `nutritional_data`
```sql
CREATE TABLE nutritional_data (
    id BIGSERIAL PRIMARY KEY,
    source_id VARCHAR(50) UNIQUE,           -- Code Ciqual (ex: "11058")
    calories_kcal NUMERIC(10,2),            -- Énergie en kcal/100g
    proteines_g NUMERIC(10,2),              -- Protéines en g/100g
    glucides_g NUMERIC(10,2),               -- Glucides en g/100g
    lipides_g NUMERIC(10,2)                 -- Lipides en g/100g
    -- TODO: Ajouter fibres_g, sel_g, vitamines, minéraux
);
```

#### `canonical_foods`
```sql
CREATE TABLE canonical_foods (
    id BIGSERIAL PRIMARY KEY,
    canonical_name TEXT NOT NULL,
    nutrition_id INTEGER REFERENCES nutritional_data(id),
    -- ... autres colonnes
);
```

#### `cooking_nutrition_factors`
```sql
CREATE TABLE cooking_nutrition_factors (
    id SERIAL PRIMARY KEY,
    cooking_method VARCHAR(100) NOT NULL,    -- 'ebullition', 'vapeur', 'friture'
    nutrient_name VARCHAR(100) NOT NULL,     -- 'vitamine_c', 'proteines'
    factor_type factor_type_enum NOT NULL,   -- 'RETENTION' ou 'MULTIPLICATION'
    factor_value NUMERIC(5,4) NOT NULL       -- 0.7 = 70% de rétention
);
```

### Enrichissement Proposé

```sql
-- Ajouter colonnes à nutritional_data
ALTER TABLE nutritional_data
ADD COLUMN fibres_g NUMERIC(10,2),
ADD COLUMN sel_g NUMERIC(10,2),
ADD COLUMN calcium_mg NUMERIC(10,2),
ADD COLUMN fer_mg NUMERIC(10,2),
ADD COLUMN vitamine_c_mg NUMERIC(10,2),
ADD COLUMN vitamine_d_ug NUMERIC(10,2),
ADD COLUMN folates_ug NUMERIC(10,2);
```

---

## 🔗 Étape 3 : Mapping Canonical Foods ↔ Ciqual

### Stratégie de Mapping

1. **Mapping Manuel** (fichier CSV)
   - Créer `mapping_canonical_ciqual.csv`
   - Colonnes : `canonical_food_id`, `ciqual_code`, `alim_nom_fr`, `confidence`

2. **Mapping Automatique** (script Python)
   - Utiliser la similarité de noms (fuzzy matching)
   - Valider manuellement les correspondances douteuses

### Exemple de Mapping

| canonical_name | ciqual_code | alim_nom_fr | confidence |
|----------------|-------------|-------------|------------|
| Pomme de terre | 11058 | Pomme de terre, cuite à l'eau | HIGH |
| Carotte | 20009 | Carotte, crue | HIGH |
| Tomate | 20047 | Tomate, crue | HIGH |
| Beurre | 19106 | Beurre doux | HIGH |

---

## 🐍 Étape 4 : Script d'Import Python

### Fichier : `tools/import_ciqual_nutrition.py`

```python
#!/usr/bin/env python3
"""
Import des données nutritionnelles Ciqual dans la base de données
"""
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
CIQUAL_FILE = "data/ciqual_composition_nutritionnelle.csv"
MAPPING_FILE = "data/mapping_canonical_ciqual.csv"
DATABASE_URL = os.getenv("DATABASE_URL_TX")

def load_ciqual_data():
    """Charger les données Ciqual depuis le CSV"""
    df = pd.read_csv(CIQUAL_FILE, encoding='utf-8', sep=';')
    
    # Colonnes attendues
    required_cols = [
        'alim_code', 'alim_nom_fr', 
        'Energie, Règlement UE N° 1169/2011 (kcal/100 g)',
        'Protéines, N x 6.25 (g/100 g)',
        'Glucides (g/100 g)',
        'Lipides (g/100 g)'
    ]
    
    return df

def load_mapping():
    """Charger le mapping canonical_foods ↔ Ciqual"""
    df = pd.read_csv(MAPPING_FILE)
    return df

def import_nutritional_data(conn, ciqual_df, mapping_df):
    """Importer les données dans nutritional_data"""
    cursor = conn.cursor()
    
    # Joindre Ciqual + Mapping
    merged = pd.merge(
        mapping_df, 
        ciqual_df, 
        left_on='ciqual_code', 
        right_on='alim_code'
    )
    
    values = []
    for _, row in merged.iterrows():
        values.append((
            str(row['ciqual_code']),                    # source_id
            float(row.get('Energie, Règlement UE N° 1169/2011 (kcal/100 g)', 0)),
            float(row.get('Protéines, N x 6.25 (g/100 g)', 0)),
            float(row.get('Glucides (g/100 g)', 0)),
            float(row.get('Lipides (g/100 g)', 0))
        ))
    
    # Insert avec RETURNING id
    query = """
        INSERT INTO nutritional_data (source_id, calories_kcal, proteines_g, glucides_g, lipides_g)
        VALUES %s
        ON CONFLICT (source_id) DO UPDATE SET
            calories_kcal = EXCLUDED.calories_kcal,
            proteines_g = EXCLUDED.proteines_g,
            glucides_g = EXCLUDED.glucides_g,
            lipides_g = EXCLUDED.lipides_g
        RETURNING id, source_id
    """
    
    execute_values(cursor, query, values, template='(%s, %s, %s, %s, %s)')
    results = cursor.fetchall()
    
    # Créer dictionnaire source_id -> nutrition_id
    nutrition_mapping = {source_id: nutr_id for nutr_id, source_id in results}
    
    return nutrition_mapping

def link_canonical_foods(conn, mapping_df, nutrition_mapping):
    """Lier canonical_foods à nutritional_data"""
    cursor = conn.cursor()
    
    for _, row in mapping_df.iterrows():
        canonical_id = row['canonical_food_id']
        ciqual_code = str(row['ciqual_code'])
        nutrition_id = nutrition_mapping.get(ciqual_code)
        
        if nutrition_id:
            cursor.execute("""
                UPDATE canonical_foods
                SET nutrition_id = %s
                WHERE id = %s
            """, (nutrition_id, canonical_id))
    
    conn.commit()
    print(f"✅ {len(mapping_df)} canonical_foods liés à nutritional_data")

def main():
    print("🍎 Import des données nutritionnelles Ciqual")
    
    # 1. Charger les données
    print("\n📥 Chargement des fichiers...")
    ciqual_df = load_ciqual_data()
    print(f"   - Ciqual: {len(ciqual_df)} aliments")
    
    mapping_df = load_mapping()
    print(f"   - Mapping: {len(mapping_df)} correspondances")
    
    # 2. Connexion DB
    conn = psycopg2.connect(DATABASE_URL)
    
    try:
        # 3. Import nutritional_data
        print("\n💾 Import dans nutritional_data...")
        nutrition_mapping = import_nutritional_data(conn, ciqual_df, mapping_df)
        print(f"   ✅ {len(nutrition_mapping)} entrées créées/mises à jour")
        
        # 4. Lier canonical_foods
        print("\n🔗 Liaison canonical_foods ↔ nutritional_data...")
        link_canonical_foods(conn, mapping_df, nutrition_mapping)
        
        conn.commit()
        print("\n✅ Import terminé avec succès!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Erreur: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    main()
```

---

## 🔥 Étape 5 : Coefficients de Cuisson

### Données Scientifiques

Les coefficients de rétention des nutriments lors de la cuisson proviennent de :
- USDA (United States Department of Agriculture)
- ANSES (études françaises)
- Publications scientifiques

### Fichier : `data/cooking_factors.csv`

```csv
cooking_method,nutrient_name,factor_type,factor_value,source
ebullition,vitamine_c,RETENTION,0.50,USDA
ebullition,folates,RETENTION,0.60,USDA
ebullition,proteines,RETENTION,0.98,USDA
vapeur,vitamine_c,RETENTION,0.75,ANSES
vapeur,folates,RETENTION,0.80,ANSES
friture,lipides,MULTIPLICATION,1.15,ANSES
gril,proteines,RETENTION,0.95,USDA
roti,vitamine_b1,RETENTION,0.70,USDA
```

### Script d'Import

```sql
-- Importer les coefficients de cuisson
COPY cooking_nutrition_factors (cooking_method, nutrient_name, factor_type, factor_value)
FROM '/path/to/cooking_factors.csv'
WITH (FORMAT csv, HEADER true);
```

---

## 🧮 Étape 6 : Calcul Nutritionnel pour Recettes

### Logique de Calcul

```
Pour chaque recette:
  1. Pour chaque ingrédient:
     - Récupérer les valeurs nutritionnelles de base (100g)
     - Ajuster à la quantité de l'ingrédient
     
  2. Appliquer les coefficients de cuisson:
     - Identifier la méthode de cuisson (recipe.cooking_method)
     - Multiplier par les facteurs de rétention/multiplication
     
  3. Sommer tous les ingrédients
  
  4. Diviser par le nombre de portions
```

### Fonction PostgreSQL

```sql
CREATE OR REPLACE FUNCTION calculate_recipe_nutrition(recipe_id_param INTEGER)
RETURNS TABLE (
    nutrient_name TEXT,
    value_per_serving NUMERIC,
    unit TEXT
) AS $$
DECLARE
    cooking_method_var TEXT;
    servings_var INTEGER;
BEGIN
    -- Récupérer la méthode de cuisson et portions
    SELECT cooking_method, servings 
    INTO cooking_method_var, servings_var
    FROM recipes 
    WHERE id = recipe_id_param;
    
    RETURN QUERY
    WITH ingredient_nutrition AS (
        -- Nutrition de chaque ingrédient (ajusté à la quantité)
        SELECT 
            ri.quantity,
            ri.unit,
            nd.calories_kcal * (ri.quantity / 100.0) AS calories,
            nd.proteines_g * (ri.quantity / 100.0) AS proteines,
            nd.glucides_g * (ri.quantity / 100.0) AS glucides,
            nd.lipides_g * (ri.quantity / 100.0) AS lipides
        FROM recipe_ingredients ri
        LEFT JOIN canonical_foods cf ON cf.id = ri.canonical_food_id
        LEFT JOIN nutritional_data nd ON nd.id = cf.nutrition_id
        WHERE ri.recipe_id = recipe_id_param
          AND nd.id IS NOT NULL
    ),
    totals AS (
        -- Somme de tous les ingrédients
        SELECT 
            SUM(calories) AS total_calories,
            SUM(proteines) AS total_proteines,
            SUM(glucides) AS total_glucides,
            SUM(lipides) AS total_lipides
        FROM ingredient_nutrition
    )
    SELECT 
        'Calories'::TEXT,
        (total_calories / servings_var)::NUMERIC,
        'kcal'::TEXT
    FROM totals
    UNION ALL
    SELECT 
        'Protéines'::TEXT,
        (total_proteines / servings_var)::NUMERIC,
        'g'::TEXT
    FROM totals
    UNION ALL
    SELECT 
        'Glucides'::TEXT,
        (total_glucides / servings_var)::NUMERIC,
        'g'::TEXT
    FROM totals
    UNION ALL
    SELECT 
        'Lipides'::TEXT,
        (total_lipides / servings_var)::NUMERIC,
        'g'::TEXT
    FROM totals;
END;
$$ LANGUAGE plpgsql;
```

### Utilisation

```sql
-- Calculer les valeurs nutritionnelles de la recette #142
SELECT * FROM calculate_recipe_nutrition(142);

-- Résultat attendu:
--  nutrient_name | value_per_serving | unit
-- ---------------+-------------------+------
--  Calories      |            285.50 | kcal
--  Protéines     |             12.30 | g
--  Glucides      |             35.20 | g
--  Lipides       |              8.90 | g
```

---

## 🖥️ Étape 7 : Interface Utilisateur

### Composant React : `NutritionFacts.jsx`

```jsx
// components/NutritionFacts.jsx
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function NutritionFacts({ recipeId, servings = 1 }) {
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNutrition() {
      try {
        // Appeler la fonction PostgreSQL
        const { data, error } = await supabase.rpc(
          'calculate_recipe_nutrition', 
          { recipe_id_param: recipeId }
        );
        
        if (error) throw error;
        
        // Transformer en objet
        const nutritionData = {};
        data.forEach(item => {
          nutritionData[item.nutrient_name] = {
            value: parseFloat(item.value_per_serving) * servings,
            unit: item.unit
          };
        });
        
        setNutrition(nutritionData);
      } catch (error) {
        console.error('Erreur chargement nutrition:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchNutrition();
  }, [recipeId, servings]);

  if (loading) return <div>Calcul des valeurs nutritionnelles...</div>;
  if (!nutrition) return <div>Données nutritionnelles non disponibles</div>;

  return (
    <div className="nutrition-facts">
      <h3>Informations Nutritionnelles</h3>
      <p className="servings-info">Par portion ({servings} portion{servings > 1 ? 's' : ''})</p>
      
      <div className="nutrition-grid">
        <div className="nutrient-row">
          <span className="nutrient-name">Énergie</span>
          <span className="nutrient-value">
            {nutrition.Calories?.value.toFixed(0)} {nutrition.Calories?.unit}
          </span>
        </div>
        
        <div className="nutrient-row">
          <span className="nutrient-name">Protéines</span>
          <span className="nutrient-value">
            {nutrition.Protéines?.value.toFixed(1)} {nutrition.Protéines?.unit}
          </span>
        </div>
        
        <div className="nutrient-row">
          <span className="nutrient-name">Glucides</span>
          <span className="nutrient-value">
            {nutrition.Glucides?.value.toFixed(1)} {nutrition.Glucides?.unit}
          </span>
        </div>
        
        <div className="nutrient-row">
          <span className="nutrient-name">Lipides</span>
          <span className="nutrient-value">
            {nutrition.Lipides?.value.toFixed(1)} {nutrition.Lipides?.unit}
          </span>
        </div>
      </div>
    </div>
  );
}
```

### CSS

```css
/* app/recipes/[id]/nutrition-facts.css */
.nutrition-facts {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.nutrition-facts h3 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 1.2rem;
}

.servings-info {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 16px;
}

.nutrition-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nutrient-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.nutrient-name {
  font-weight: 500;
  color: #374151;
}

.nutrient-value {
  font-weight: 600;
  color: #059669;
}
```

---

## 📋 Checklist d'Implémentation

- [ ] **Télécharger** la table Ciqual 2020 (CSV/Excel)
- [ ] **Créer** le fichier `mapping_canonical_ciqual.csv` (mapping manuel)
- [ ] **Enrichir** la table `nutritional_data` (ajout colonnes vitamines/minéraux)
- [ ] **Exécuter** le script `import_ciqual_nutrition.py`
- [ ] **Vérifier** que les `canonical_foods` ont leur `nutrition_id` renseigné
- [ ] **Importer** les coefficients dans `cooking_nutrition_factors`
- [ ] **Créer** la fonction PostgreSQL `calculate_recipe_nutrition()`
- [ ] **Tester** le calcul sur quelques recettes
- [ ] **Implémenter** le composant `NutritionFacts.jsx`
- [ ] **Ajouter** l'affichage dans `/app/recipes/[id]/page.js`

---

## 🚀 Commandes Rapides

```bash
# 1. Télécharger Ciqual
wget https://ciqual.anses.fr/cms/sites/default/files/inline-files/TableCiqual2020_2020_07_07.xls

# 2. Convertir en CSV
libreoffice --convert-to csv TableCiqual2020_2020_07_07.xls

# 3. Créer mapping (manuel ou script)
# Éditer data/mapping_canonical_ciqual.csv

# 4. Import
cd /workspaces/garde-manger-app
python3 tools/import_ciqual_nutrition.py

# 5. Vérifier
psql "$DATABASE_URL_TX" -c "SELECT COUNT(*) FROM nutritional_data;"
psql "$DATABASE_URL_TX" -c "SELECT COUNT(*) FROM canonical_foods WHERE nutrition_id IS NOT NULL;"
```

---

## 📚 Ressources

- **Ciqual** : https://ciqual.anses.fr/
- **USDA FoodData Central** : https://fdc.nal.usda.gov/
- **Coefficients de rétention** : USDA Table of Nutrient Retention Factors
- **Documentation technique** : `SCHEMA_DATABASE.md`

---

**Auteur** : Assistant AI  
**Date** : 26 octobre 2025  
**Version** : 1.0
