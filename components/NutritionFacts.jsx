// components/NutritionFacts.jsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import './NutritionFacts.css';

export default function NutritionFacts({ recipeId, servings = 1 }) {
  const [nutrition, setNutrition] = useState(null);
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
        
      } catch (error) {
        console.error('❌ Erreur chargement nutrition:', error);
        setError(error.message || 'Erreur lors du calcul nutritionnel');
      } finally {
        setLoading(false);
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
    </div>
  );
}
