// components/NutritionFacts.jsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import './NutritionFacts.css';

export default function NutritionFacts({ recipeId, servings = 1 }) {
  const [nutrition, setNutrition] = useState(null);
  const [micronutrients, setMicronutrients] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchNutrition() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🍎 Chargement nutritionnel pour recette', recipeId);
        
        // 1️⃣ Vérifier d'abord si le cache existe
        const { data: cacheData, error: cacheError } = await supabase
          .from('recipe_nutrition_cache')
          .select('*')
          .eq('recipe_id', recipeId)
          .maybeSingle();
        
        if (cacheError) {
          console.error('❌ Erreur lecture cache:', cacheError);
        }
        
        // 2️⃣ Si pas de cache, déclencher le calcul via API
        if (!cacheData) {
          console.log('🔄 Pas de cache, déclenchement du calcul...');
          
          const response = await fetch(`/api/recipes/${recipeId}/nutrition/calculate`, {
            method: 'POST',
          });
          
          if (!response.ok) {
            throw new Error('Erreur lors du calcul nutritionnel');
          }
          
          console.log('✅ Calcul terminé');
          
          // Relire le cache après calcul
          const { data: newCacheData, error: newError } = await supabase
            .from('recipe_nutrition_cache')
            .select('*')
            .eq('recipe_id', recipeId)
            .single();
          
          if (newError || !newCacheData) {
            setError('Données nutritionnelles non disponibles');
            return;
          }
          
          setNutrition({
            Calories: {
              perServing: newCacheData.calories_per_serving * servings,
              total: newCacheData.calories_total,
              unit: 'kcal'
            },
            Protéines: {
              perServing: newCacheData.proteines_per_serving * servings,
              total: newCacheData.proteines_total,
              unit: 'g'
            },
            Glucides: {
              perServing: newCacheData.glucides_per_serving * servings,
              total: newCacheData.glucides_total,
              unit: 'g'
            },
            Lipides: {
              perServing: newCacheData.lipides_per_serving * servings,
              total: newCacheData.lipides_total,
              unit: 'g'
            }
          });
        } else {
          // 3️⃣ Cache existe, lecture directe
          console.log('⚡ Chargé depuis le cache');
          
          setNutrition({
            Calories: {
              perServing: cacheData.calories_per_serving * servings,
              total: cacheData.calories_total,
              unit: 'kcal'
            },
            Protéines: {
              perServing: cacheData.proteines_per_serving * servings,
              total: cacheData.proteines_total,
              unit: 'g'
            },
            Glucides: {
              perServing: cacheData.glucides_per_serving * servings,
              total: cacheData.glucides_total,
              unit: 'g'
            },
            Lipides: {
              perServing: cacheData.lipides_per_serving * servings,
              total: cacheData.lipides_total,
              unit: 'g'
            }
          });
        }

        // 4️⃣ Charger les micronutriments depuis les ingrédients
        await fetchMicronutrients();

      } catch (error) {
        console.error('❌ Erreur chargement nutrition:', error);
        setError(error.message || 'Erreur lors du calcul nutritionnel');
      } finally {
        setLoading(false);
      }
    }

    async function fetchMicronutrients() {
      try {
        console.log('🥕 Chargement des micronutriments...');

        // Charger les ingrédients de la recette avec leurs données nutritionnelles
        const { data: ingredients, error: ingError } = await supabase
          .from('recipe_ingredients')
          .select(`
            quantity,
            unit,
            canonical_food_id,
            archetype_id,
            canonical_foods (
              nutrition_id,
              nutritional_data (
                fibres_g,
                sucres_g,
                ag_satures_g,
                calcium_mg,
                fer_mg,
                magnesium_mg,
                potassium_mg,
                sodium_mg,
                zinc_mg,
                vitamine_a_ug,
                vitamine_c_mg,
                vitamine_d_ug,
                vitamine_e_mg,
                vitamine_k_ug,
                vitamine_b1_mg,
                vitamine_b2_mg,
                vitamine_b3_mg,
                vitamine_b6_mg,
                vitamine_b9_ug,
                vitamine_b12_ug
              )
            ),
            archetypes (
              canonical_food_id
            )
          `)
          .eq('recipe_id', recipeId);

        if (ingError) {
          console.error('❌ Erreur chargement ingrédients:', ingError);
          return;
        }

        if (!ingredients || ingredients.length === 0) {
          console.log('⚠️ Aucun ingrédient trouvé');
          return;
        }

        // Agréger les micronutriments
        const micro = {
          fibres: 0,
          sucres: 0,
          ag_satures: 0,
          calcium: 0,
          fer: 0,
          magnesium: 0,
          potassium: 0,
          sodium: 0,
          zinc: 0,
          vitamine_a: 0,
          vitamine_c: 0,
          vitamine_d: 0,
          vitamine_e: 0,
          vitamine_k: 0,
          vitamine_b1: 0,
          vitamine_b2: 0,
          vitamine_b3: 0,
          vitamine_b6: 0,
          vitamine_b9: 0,
          vitamine_b12: 0,
        };

        let ingredientsWithNutrition = 0;

        ingredients.forEach(ing => {
          const nutritionData = ing.canonical_foods?.nutritional_data;
          if (nutritionData) {
            ingredientsWithNutrition++;
            // Quantité de l'ingrédient (on suppose que c'est en grammes ou on normalise)
            const qty = parseFloat(ing.quantity) || 100;
            const factor = qty / 100; // Facteur pour 100g

            micro.fibres += (nutritionData.fibres_g || 0) * factor;
            micro.sucres += (nutritionData.sucres_g || 0) * factor;
            micro.ag_satures += (nutritionData.ag_satures_g || 0) * factor;
            micro.calcium += (nutritionData.calcium_mg || 0) * factor;
            micro.fer += (nutritionData.fer_mg || 0) * factor;
            micro.magnesium += (nutritionData.magnesium_mg || 0) * factor;
            micro.potassium += (nutritionData.potassium_mg || 0) * factor;
            micro.sodium += (nutritionData.sodium_mg || 0) * factor;
            micro.zinc += (nutritionData.zinc_mg || 0) * factor;
            micro.vitamine_a += (nutritionData.vitamine_a_ug || 0) * factor;
            micro.vitamine_c += (nutritionData.vitamine_c_mg || 0) * factor;
            micro.vitamine_d += (nutritionData.vitamine_d_ug || 0) * factor;
            micro.vitamine_e += (nutritionData.vitamine_e_mg || 0) * factor;
            micro.vitamine_k += (nutritionData.vitamine_k_ug || 0) * factor;
            micro.vitamine_b1 += (nutritionData.vitamine_b1_mg || 0) * factor;
            micro.vitamine_b2 += (nutritionData.vitamine_b2_mg || 0) * factor;
            micro.vitamine_b3 += (nutritionData.vitamine_b3_mg || 0) * factor;
            micro.vitamine_b6 += (nutritionData.vitamine_b6_mg || 0) * factor;
            micro.vitamine_b9 += (nutritionData.vitamine_b9_ug || 0) * factor;
            micro.vitamine_b12 += (nutritionData.vitamine_b12_ug || 0) * factor;
          }
        });

        console.log(`✅ Micronutriments calculés depuis ${ingredientsWithNutrition} ingrédients`);

        if (ingredientsWithNutrition > 0) {
          setMicronutrients(micro);
        }

      } catch (error) {
        console.error('❌ Erreur chargement micronutriments:', error);
      }
    }
    
    if (recipeId) {
      fetchNutrition();
    }
  }, [recipeId, servings]);

  if (loading) {
    return (
      <div className="nutrition-facts loading">
        <div className="loading-spinner">⏳</div>
        <p>Calcul des valeurs nutritionnelles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nutrition-facts error">
        <div className="error-icon">ℹ️</div>
        <p className="error-message">{error}</p>
        <p className="error-hint">
          Les données nutritionnelles seront disponibles une fois que 
          les ingrédients auront été liés à la base Ciqual.
        </p>
      </div>
    );
  }

  if (!nutrition || Object.keys(nutrition).length === 0) {
    return (
      <div className="nutrition-facts empty">
        <p>Données nutritionnelles non disponibles</p>
      </div>
    );
  }

  return (
    <div className="nutrition-facts">
      <div className="nutrition-header">
        <h3>📊 Informations Nutritionnelles</h3>
        <p className="servings-info">
          Par portion {servings > 1 && `(×${servings})`}
        </p>
      </div>
      
      <div className="nutrition-grid">
        {nutrition.Calories && (
          <div className="nutrient-row calories">
            <span className="nutrient-icon">🔥</span>
            <span className="nutrient-name">Énergie</span>
            <span className="nutrient-value">
              <strong>{nutrition.Calories.perServing.toFixed(0)}</strong>
              <span className="unit">{nutrition.Calories.unit}</span>
            </span>
          </div>
        )}
        
        {nutrition.Protéines && (
          <div className="nutrient-row protein">
            <span className="nutrient-icon">🥩</span>
            <span className="nutrient-name">Protéines</span>
            <span className="nutrient-value">
              <strong>{nutrition.Protéines.perServing.toFixed(1)}</strong>
              <span className="unit">{nutrition.Protéines.unit}</span>
            </span>
          </div>
        )}
        
        {nutrition.Glucides && (
          <div className="nutrient-row carbs">
            <span className="nutrient-icon">🌾</span>
            <span className="nutrient-name">Glucides</span>
            <span className="nutrient-value">
              <strong>{nutrition.Glucides.perServing.toFixed(1)}</strong>
              <span className="unit">{nutrition.Glucides.unit}</span>
            </span>
          </div>
        )}
        
        {nutrition.Lipides && (
          <div className="nutrient-row fat">
            <span className="nutrient-icon">🧈</span>
            <span className="nutrient-name">Lipides</span>
            <span className="nutrient-value">
              <strong>{nutrition.Lipides.perServing.toFixed(1)}</strong>
              <span className="unit">{nutrition.Lipides.unit}</span>
            </span>
          </div>
        )}
      </div>
      
      {/* Totaux pour toute la recette */}
      <div className="nutrition-total">
        <details>
          <summary>Voir les totaux pour toute la recette</summary>
          <div className="total-grid">
            {nutrition.Calories && (
              <div className="total-item">
                <span>Énergie totale:</span>
                <span>{nutrition.Calories.total.toFixed(0)} kcal</span>
              </div>
            )}
            {nutrition.Protéines && (
              <div className="total-item">
                <span>Protéines totales:</span>
                <span>{nutrition.Protéines.total.toFixed(1)} g</span>
              </div>
            )}
            {nutrition.Glucides && (
              <div className="total-item">
                <span>Glucides totaux:</span>
                <span>{nutrition.Glucides.total.toFixed(1)} g</span>
              </div>
            )}
            {nutrition.Lipides && (
              <div className="total-item">
                <span>Lipides totaux:</span>
                <span>{nutrition.Lipides.total.toFixed(1)} g</span>
              </div>
            )}
          </div>
        </details>
      </div>
      
      <div className="nutrition-disclaimer">
        <small>
          ⚡ Valeurs calculées automatiquement en tenant compte de la méthode de cuisson
        </small>
      </div>

      {/* Section Micronutriments */}
      {micronutrients && (
        <div className="micronutrients-section">
          <details>
            <summary>🔬 Micronutriments détaillés</summary>

            <div className="micronutrients-grid">
              {/* Autres nutriments */}
              {(micronutrients.fibres > 0 || micronutrients.sucres > 0 || micronutrients.ag_satures > 0) && (
                <div className="micronutrient-category">
                  <h4>Autres nutriments</h4>
                  <div className="micronutrient-list">
                    {micronutrients.fibres > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Fibres</span>
                        <span className="micro-value">{micronutrients.fibres.toFixed(1)} g</span>
                      </div>
                    )}
                    {micronutrients.sucres > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Sucres</span>
                        <span className="micro-value">{micronutrients.sucres.toFixed(1)} g</span>
                      </div>
                    )}
                    {micronutrients.ag_satures > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Acides gras saturés</span>
                        <span className="micro-value">{micronutrients.ag_satures.toFixed(1)} g</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Minéraux */}
              {(micronutrients.calcium > 0 || micronutrients.fer > 0 || micronutrients.magnesium > 0 ||
                micronutrients.potassium > 0 || micronutrients.sodium > 0 || micronutrients.zinc > 0) && (
                <div className="micronutrient-category">
                  <h4>⚡ Minéraux</h4>
                  <div className="micronutrient-list">
                    {micronutrients.calcium > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Calcium</span>
                        <span className="micro-value">{micronutrients.calcium.toFixed(1)} mg</span>
                      </div>
                    )}
                    {micronutrients.fer > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Fer</span>
                        <span className="micro-value">{micronutrients.fer.toFixed(2)} mg</span>
                      </div>
                    )}
                    {micronutrients.magnesium > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Magnésium</span>
                        <span className="micro-value">{micronutrients.magnesium.toFixed(1)} mg</span>
                      </div>
                    )}
                    {micronutrients.potassium > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Potassium</span>
                        <span className="micro-value">{micronutrients.potassium.toFixed(1)} mg</span>
                      </div>
                    )}
                    {micronutrients.sodium > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Sodium</span>
                        <span className="micro-value">{micronutrients.sodium.toFixed(1)} mg</span>
                      </div>
                    )}
                    {micronutrients.zinc > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Zinc</span>
                        <span className="micro-value">{micronutrients.zinc.toFixed(2)} mg</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vitamines */}
              {(micronutrients.vitamine_a > 0 || micronutrients.vitamine_c > 0 || micronutrients.vitamine_d > 0 ||
                micronutrients.vitamine_e > 0 || micronutrients.vitamine_k > 0 || micronutrients.vitamine_b1 > 0 ||
                micronutrients.vitamine_b2 > 0 || micronutrients.vitamine_b3 > 0 || micronutrients.vitamine_b6 > 0 ||
                micronutrients.vitamine_b9 > 0 || micronutrients.vitamine_b12 > 0) && (
                <div className="micronutrient-category">
                  <h4>🌈 Vitamines</h4>
                  <div className="micronutrient-list">
                    {micronutrients.vitamine_a > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Vitamine A</span>
                        <span className="micro-value">{micronutrients.vitamine_a.toFixed(1)} µg</span>
                      </div>
                    )}
                    {micronutrients.vitamine_c > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Vitamine C</span>
                        <span className="micro-value">{micronutrients.vitamine_c.toFixed(1)} mg</span>
                      </div>
                    )}
                    {micronutrients.vitamine_d > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Vitamine D</span>
                        <span className="micro-value">{micronutrients.vitamine_d.toFixed(1)} µg</span>
                      </div>
                    )}
                    {micronutrients.vitamine_e > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Vitamine E</span>
                        <span className="micro-value">{micronutrients.vitamine_e.toFixed(1)} mg</span>
                      </div>
                    )}
                    {micronutrients.vitamine_k > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Vitamine K</span>
                        <span className="micro-value">{micronutrients.vitamine_k.toFixed(1)} µg</span>
                      </div>
                    )}
                    {micronutrients.vitamine_b1 > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Vitamine B1 (Thiamine)</span>
                        <span className="micro-value">{micronutrients.vitamine_b1.toFixed(2)} mg</span>
                      </div>
                    )}
                    {micronutrients.vitamine_b2 > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Vitamine B2 (Riboflavine)</span>
                        <span className="micro-value">{micronutrients.vitamine_b2.toFixed(2)} mg</span>
                      </div>
                    )}
                    {micronutrients.vitamine_b3 > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Vitamine B3 (Niacine)</span>
                        <span className="micro-value">{micronutrients.vitamine_b3.toFixed(2)} mg</span>
                      </div>
                    )}
                    {micronutrients.vitamine_b6 > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Vitamine B6</span>
                        <span className="micro-value">{micronutrients.vitamine_b6.toFixed(2)} mg</span>
                      </div>
                    )}
                    {micronutrients.vitamine_b9 > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Vitamine B9 (Folates)</span>
                        <span className="micro-value">{micronutrients.vitamine_b9.toFixed(1)} µg</span>
                      </div>
                    )}
                    {micronutrients.vitamine_b12 > 0 && (
                      <div className="micronutrient-item">
                        <span className="micro-name">Vitamine B12</span>
                        <span className="micro-value">{micronutrients.vitamine_b12.toFixed(2)} µg</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="micronutrients-disclaimer">
              <small>
                💡 Valeurs approximatives calculées à partir des ingrédients. Les valeurs réelles peuvent varier.
              </small>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
