'use client';

import { useState } from 'react';
import IngredientSelector from './IngredientSelector';
import './CreateDishFromRecipeDialog.css';

/**
 * Dialog pour créer un plat cuisiné à partir d'une recette
 * Version complète avec sélection des ingrédients et déduction de l'inventaire
 */
export default function CreateDishFromRecipeDialog({ recipe, onClose, onSuccess }) {
  const [portions, setPortions] = useState(recipe?.servings || 4);
  const [storageMethod, setStorageMethod] = useState('fridge');
  const [notes, setNotes] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Préparer les lots sélectionnés pour l'API
      const ingredientsToUse = Object.entries(selectedIngredients)
        .flatMap(([ingredientId, lots]) => 
          lots.map(lot => ({
            ingredient_id: parseInt(ingredientId),
            lot_id: lot.lot_id,
            quantity_used: lot.quantity_to_use,
            unit: lot.unit,
            product_name: lot.product_name
          }))
        );

      const response = await fetch(`/api/recipes/${recipe.id}/cook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portions,
          storageMethod,
          notes: notes.trim() || null,
          ingredients: ingredientsToUse // Envoyer les lots sélectionnés
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création du plat');
      }

      // Succès
      if (onSuccess) {
        onSuccess(data.dish);
      }
      onClose();
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStorageIcon = (method) => {
    switch (method) {
      case 'fridge':
        return '❄️';
      case 'freezer':
        return '🧊';
      case 'counter':
        return '🏠';
      default:
        return '📦';
    }
  };

  const getStorageLabel = (method) => {
    switch (method) {
      case 'fridge':
        return 'Frigo (3 jours)';
      case 'freezer':
        return 'Congélateur (90 jours)';
      case 'counter':
        return 'Comptoir (1 jour)';
      default:
        return method;
    }
  };

  if (!recipe) return null;

  return (
    <div className="dialog-overlay" onClick={onClose} aria-hidden="true">
      <div
        className="dialog-content"
        role="dialog"
        aria-modal="true"
        aria-label={`Cuisiner ${recipe.name}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2>🍳 Cuisiner "{recipe.name}"</h2>
          <button className="close-btn" onClick={onClose} aria-label="Fermer">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="cook-form">
          {/* Portions */}
          <div className="form-group">
            <label htmlFor="portions">
              👥 Nombre de portions cuisinées
            </label>
            <div className="portions-control">
              <button
                type="button"
                className="portions-btn"
                onClick={() => setPortions(Math.max(1, portions - 1))}
                disabled={portions <= 1}
              >
                −
              </button>
              <input
                id="portions"
                type="number"
                min="1"
                max="99"
                value={portions}
                onChange={(e) => setPortions(Math.max(1, parseInt(e.target.value) || 1))}
                className="portions-input"
              />
              <button
                type="button"
                className="portions-btn"
                onClick={() => setPortions(Math.min(99, portions + 1))}
                disabled={portions >= 99}
              >
                +
              </button>
            </div>
            <small className="hint">
              Recette originale : {recipe.servings} portions
            </small>
          </div>

          {/* Stockage */}
          <div className="form-group">
            <label>📦 Mode de stockage</label>
            <div className="storage-options">
              {['fridge', 'freezer', 'counter'].map((method) => (
                <button
                  key={method}
                  type="button"
                  className={`storage-btn ${storageMethod === method ? 'active' : ''}`}
                  onClick={() => setStorageMethod(method)}
                >
                  <span className="storage-icon">{getStorageIcon(method)}</span>
                  <span className="storage-label">{getStorageLabel(method)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes">
              📝 Notes (optionnel)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Préparé ce midi, avec des légumes du jardin..."
              rows="3"
              maxLength="500"
              className="notes-input"
            />
            <small className="hint">
              {notes.length}/500 caractères
            </small>
          </div>

          {/* Sélection des ingrédients */}
          <div className="form-group">
            <IngredientSelector 
              recipeId={recipe.id}
              portions={portions}
              onSelectionChange={setSelectedIngredients}
            />
          </div>

          {/* Erreur */}
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {/* Résumé */}
          <div className="summary-box">
            <h3>📋 Résumé</h3>
            <ul>
              <li>
                <strong>Plat :</strong> {recipe.name}
              </li>
              <li>
                <strong>Portions :</strong> {portions} portion{portions > 1 ? 's' : ''}
              </li>
              <li>
                <strong>Stockage :</strong> {getStorageIcon(storageMethod)} {getStorageLabel(storageMethod)}
              </li>
              <li>
                <strong>DLC :</strong> {' '}
                {storageMethod === 'fridge' && 'Dans 3 jours'}
                {storageMethod === 'freezer' && 'Dans 90 jours'}
                {storageMethod === 'counter' && 'Dans 1 jour'}
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="dialog-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn-cancel"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? '⏳ Création...' : '✅ Ajouter au garde-manger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
