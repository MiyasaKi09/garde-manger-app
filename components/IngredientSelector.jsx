'use client';

import { useState, useEffect } from 'react';
import './IngredientSelector.css';

/**
 * Composant pour sélectionner les lots d'inventaire à utiliser pour chaque ingrédient
 * Permet de choisir quels lots utiliser et quelle quantité de chaque lot
 */
export default function IngredientSelector({ recipeId, portions, onSelectionChange }) {
  const [ingredients, setIngredients] = useState([]);
  const [selectedLots, setSelectedLots] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (recipeId) {
      loadAvailableIngredients();
    }
  }, [recipeId]);

  const loadAvailableIngredients = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recipes/${recipeId}/available-ingredients`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement des ingrédients');
      }

      setIngredients(data.ingredients || []);
      
      // Auto-sélectionner le premier lot disponible pour chaque ingrédient
      const autoSelection = {};
      data.ingredients.forEach(ing => {
        if (ing.available_lots && ing.available_lots.length > 0) {
          const firstLot = ing.available_lots[0];
          autoSelection[ing.ingredient_id] = [{
            lot_id: firstLot.lot_id,
            product_name: firstLot.product_name,
            quantity_to_use: Math.min(ing.quantity_needed, firstLot.quantity_available),
            unit: firstLot.unit
          }];
        }
      });
      setSelectedLots(autoSelection);

    } catch (err) {
      console.error('Erreur chargement ingrédients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Notifier le parent quand la sélection change
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedLots);
    }
  }, [selectedLots]);

  const handleLotSelection = (ingredientId, lot) => {
    setSelectedLots(prev => {
      const current = prev[ingredientId] || [];
      const exists = current.find(l => l.lot_id === lot.lot_id);
      
      if (exists) {
        // Retirer le lot
        return {
          ...prev,
          [ingredientId]: current.filter(l => l.lot_id !== lot.lot_id)
        };
      } else {
        // Ajouter le lot
        const ingredient = ingredients.find(i => i.ingredient_id === ingredientId);
        return {
          ...prev,
          [ingredientId]: [...current, {
            lot_id: lot.lot_id,
            product_name: lot.product_name,
            quantity_to_use: Math.min(ingredient.quantity_needed, lot.quantity_available),
            unit: lot.unit
          }]
        };
      }
    });
  };

  const handleQuantityChange = (ingredientId, lotId, newQuantity) => {
    setSelectedLots(prev => {
      const current = prev[ingredientId] || [];
      return {
        ...prev,
        [ingredientId]: current.map(lot =>
          lot.lot_id === lotId
            ? { ...lot, quantity_to_use: parseFloat(newQuantity) || 0 }
            : lot
        )
      };
    });
  };

  const isLotSelected = (ingredientId, lotId) => {
    const selected = selectedLots[ingredientId] || [];
    return selected.some(l => l.lot_id === lotId);
  };

  const getTotalSelected = (ingredientId) => {
    const selected = selectedLots[ingredientId] || [];
    return selected.reduce((sum, lot) => sum + lot.quantity_to_use, 0);
  };

  const getStatusIcon = (ingredient) => {
    const totalSelected = getTotalSelected(ingredient.ingredient_id);
    const needed = ingredient.quantity_needed;
    
    if (totalSelected === 0) return '❌';
    if (totalSelected < needed * 0.9) return '⚠️';
    if (totalSelected >= needed) return '✅';
    return '🔶';
  };

  if (loading) {
    return (
      <div className="ingredient-selector-loading">
        <div className="spinner"></div>
        <p>Chargement des ingrédients disponibles...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ingredient-selector-error">
        ⚠️ {error}
      </div>
    );
  }

  if (ingredients.length === 0) {
    return (
      <div className="ingredient-selector-empty">
        ℹ️ Aucun ingrédient trouvé pour cette recette
      </div>
    );
  }

  return (
    <div className="ingredient-selector">
      <div className="selector-header">
        <h3>🥕 Ingrédients nécessaires</h3>
        <p className="hint">Sélectionnez les lots à utiliser pour chaque ingrédient</p>
      </div>

      <div className="ingredients-list">
        {ingredients.map(ingredient => {
          const totalSelected = getTotalSelected(ingredient.ingredient_id);
          const needed = ingredient.quantity_needed;
          const percentage = needed > 0 ? Math.min(100, (totalSelected / needed) * 100) : 0;

          return (
            <div key={ingredient.ingredient_id} className="ingredient-item">
              <div className="ingredient-header">
                <div className="ingredient-info">
                  <span className="status-icon">{getStatusIcon(ingredient)}</span>
                  <span className="ingredient-name">{ingredient.name}</span>
                  <span className="quantity-badge">
                    {ingredient.quantity_needed} {ingredient.unit_needed}
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              {ingredient.available_lots.length === 0 ? (
                <div className="no-lots">
                  ⚠️ Aucun lot disponible dans l'inventaire
                </div>
              ) : (
                <div className="lots-list">
                  {ingredient.available_lots.map(lot => {
                    const selected = isLotSelected(ingredient.ingredient_id, lot.lot_id);
                    const selectedLot = selectedLots[ingredient.ingredient_id]?.find(
                      l => l.lot_id === lot.lot_id
                    );

                    return (
                      <div 
                        key={lot.lot_id} 
                        className={`lot-item ${selected ? 'selected' : ''}`}
                      >
                        <label className="lot-checkbox">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => handleLotSelection(ingredient.ingredient_id, lot)}
                          />
                          <div className="lot-details">
                            <span className="lot-name">{lot.product_name}</span>
                            <span className="lot-stock">
                              Stock: {lot.quantity_available} {lot.unit}
                            </span>
                            {lot.days_until_expiry !== null && (
                              <span className={`lot-expiry ${lot.days_until_expiry <= 3 ? 'urgent' : ''}`}>
                                {lot.days_until_expiry <= 0 
                                  ? '🔴 Expiré' 
                                  : lot.days_until_expiry <= 3
                                  ? `🟠 ${lot.days_until_expiry}j restants`
                                  : `🟢 ${lot.days_until_expiry}j restants`
                                }
                              </span>
                            )}
                          </div>
                        </label>

                        {selected && (
                          <div className="quantity-input-group">
                            <label>Utiliser:</label>
                            <input
                              type="number"
                              min="0"
                              max={lot.quantity_available}
                              step="0.1"
                              value={selectedLot?.quantity_to_use || 0}
                              onChange={(e) => handleQuantityChange(
                                ingredient.ingredient_id,
                                lot.lot_id,
                                e.target.value
                              )}
                              className="quantity-input"
                            />
                            <span className="unit-label">{lot.unit}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="ingredient-summary">
                <span className={totalSelected >= needed ? 'sufficient' : 'insufficient'}>
                  Sélectionné: {totalSelected.toFixed(2)} / {needed} {ingredient.unit_needed}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
