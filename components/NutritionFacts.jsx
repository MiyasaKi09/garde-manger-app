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
        
        console.log('🍎 Calcul nutritionnel pour recette', recipeId);
        
        // Appeler la fonction PostgreSQL
        const { data, error: rpcError } = await supabase.rpc(
          'calculate_recipe_nutrition', 
          { recipe_id_param: recipeId }
        );
        
        if (rpcError) {
          console.error('❌ Erreur RPC:', rpcError);
          throw rpcError;
        }
        
        if (!data || data.length === 0) {
          console.warn('⚠️ Aucune donnée nutritionnelle disponible');
          setError('Données nutritionnelles non disponibles pour cette recette');
          return;
        }
        
        console.log('✅ Données nutritionnelles reçues:', data);
        
        // Transformer en objet pour faciliter l'accès
        const nutritionData = {};
        data.forEach(item => {
          nutritionData[item.nutrient_name] = {
            perServing: parseFloat(item.value_per_serving) * servings,
            total: parseFloat(item.value_total),
            unit: item.unit
          };
        });
        
        setNutrition(nutritionData);
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
