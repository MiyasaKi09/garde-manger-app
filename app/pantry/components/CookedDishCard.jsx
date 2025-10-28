'use client';

import { useState } from 'react';
import './CookedDishCard.css';

export default function CookedDishCard({ dish, onConsume, onChangeStorage, onDelete, onRefresh }) {
  const [showActions, setShowActions] = useState(false);
  const [consuming, setConsuming] = useState(false);
  const [changingStorage, setChangingStorage] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getUrgencyClass = () => {
    if (dish.days_until_expiration <= 0) return 'expired';
    if (dish.days_until_expiration <= 1) return 'urgent';
    if (dish.days_until_expiration <= 3) return 'warning';
    return 'good';
  };

  const getStorageIcon = () => {
    switch (dish.storage_method) {
      case 'fridge': return '❄️';
      case 'freezer': return '🧊';
      case 'counter': return '🏠';
      default: return '📦';
    }
  };

  const getStorageLabel = () => {
    switch (dish.storage_method) {
      case 'fridge': return 'Frigo';
      case 'freezer': return 'Congélateur';
      case 'counter': return 'Comptoir';
      default: return 'Inconnu';
    }
  };

  const handleConsume = async (e) => {
    if (!onConsume || consuming) return;
    e.stopPropagation();
    
    setConsuming(true);
    try {
      await onConsume(dish.id, 1);
    } finally {
      setConsuming(false);
    }
  };

  const handleFreeze = async (e) => {
    if (!onChangeStorage || changingStorage) return;
    e.stopPropagation();
    
    const newStorage = dish.storage_method === 'freezer' ? 'fridge' : 'freezer';
    setChangingStorage(true);
    try {
      await onChangeStorage(dish.id, newStorage);
    } finally {
      setChangingStorage(false);
    }
  };

  const handleDelete = async (e) => {
    if (!onDelete) return;
    e.stopPropagation();
    
    if (confirm(`Supprimer le plat "${dish.name}" ?`)) {
      await onDelete(dish.id);
    }
  };

  return (
    <div 
      className="cooked-dish-card"
      onClick={() => setShowActions(!showActions)}
    >
      {/* Header avec image et nom */}
      <div className="dish-header">
        {dish.recipe?.image_url ? (
          <div 
            className="dish-image"
            style={{ backgroundImage: `url(${dish.recipe.image_url})` }}
          />
        ) : (
          <div className="dish-image-placeholder">
            🍽️
          </div>
        )}
        <div className="dish-info">
          <h3 className="dish-name">{dish.name}</h3>
          {dish.recipe?.title && (
            <span className="dish-recipe">📖 {dish.recipe.title}</span>
          )}
        </div>
        <div className={`urgency-badge ${getUrgencyClass()}`}>
          {dish.days_until_expiration <= 0 
            ? 'Expiré' 
            : `${dish.days_until_expiration}j`}
        </div>
      </div>

      {/* Informations du plat */}
      <div className="dish-body">
        <div className="dish-detail">
          <span className="detail-icon">🍽️</span>
          <span className="detail-label">Portions:</span>
          <span className="detail-value portions-indicator">
            {dish.portions_remaining} / {dish.portions_cooked}
          </span>
        </div>

        <div className="dish-detail">
          <span className="detail-icon">{getStorageIcon()}</span>
          <span className="detail-label">Stockage:</span>
          <span className="detail-value">{getStorageLabel()}</span>
        </div>

        <div className="dish-detail">
          <span className="detail-icon">📅</span>
          <span className="detail-label">Cuisiné le:</span>
          <span className="detail-value">{formatDate(dish.cooked_at)}</span>
        </div>

        <div className="dish-detail">
          <span className="detail-icon">⏰</span>
          <span className="detail-label">Expire le:</span>
          <span className={`detail-value ${getUrgencyClass()}`}>
            {formatDate(dish.expiration_date)}
          </span>
        </div>

        {dish.notes && (
          <div className="dish-notes">
            <span className="detail-icon">📝</span>
            <span className="notes-text">{dish.notes}</span>
          </div>
        )}
      </div>

      {/* Barre de progression des portions */}
      <div className="portions-progress">
        <div 
          className="portions-progress-bar"
          style={{ 
            width: `${(dish.portions_remaining / dish.portions_cooked) * 100}%` 
          }}
        />
      </div>

      {/* Actions */}
      {showActions && (
        <div className="dish-actions">
          <button 
            className="action-btn consume"
            onClick={handleConsume}
            disabled={consuming || dish.portions_remaining === 0}
            title="Manger 1 portion"
          >
            {consuming ? '⏳' : '🍴'} {consuming ? 'Manger...' : 'Manger'}
          </button>

          <button 
            className="action-btn freeze"
            onClick={handleFreeze}
            disabled={changingStorage}
            title={dish.storage_method === 'freezer' ? 'Mettre au frigo' : 'Congeler'}
          >
            {changingStorage ? '⏳' : dish.storage_method === 'freezer' ? '❄️' : '🧊'} 
            {changingStorage 
              ? 'Déplacement...' 
              : dish.storage_method === 'freezer' 
                ? 'Décongeler' 
                : 'Congeler'}
          </button>

          <button 
            className="action-btn delete"
            onClick={handleDelete}
            title="Supprimer ce plat"
          >
            🗑️ Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
