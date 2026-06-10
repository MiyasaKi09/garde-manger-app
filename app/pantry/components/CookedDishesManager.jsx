'use client';

import { useState, useEffect } from 'react';
import CookedDishCard from './CookedDishCard';
import { toast } from '@/components/Toast';
import './CookedDishesManager.css';

// portions_cooked / portions_remaining sont numeric en base (demi-portions) :
// on normalise en nombre arrondi au 0,5 pour un affichage propre
// (« 1.5 », jamais « 1.5000 » si la valeur arrive sérialisée en chaîne).
const toHalfPortion = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 2) / 2 : 0;
};

export default function CookedDishesManager({ userId, onActionComplete }) {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, expiring, active

  useEffect(() => {
    if (userId) {
      loadDishes();
    }
  }, [userId, filter]);

  const loadDishes = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('onlyWithPortions', 'true'); // Ne charger que les plats avec portions restantes

      if (filter === 'expiring') {
        params.append('expiringInDays', '3'); // Expirant dans 3 jours
      }

      const response = await fetch(`/api/cooked-dishes?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setDishes((data.dishes || []).map(d => ({
          ...d,
          portions_cooked: toHalfPortion(d.portions_cooked),
          portions_remaining: toHalfPortion(d.portions_remaining),
        })));
      } else {
        console.error('Erreur chargement plats:', data.error);
        setDishes([]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setDishes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConsume = async (dishId, portions) => {
    try {
      const response = await fetch(`/api/cooked-dishes/${dishId}/consume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portions })
      });

      const data = await response.json();

      if (data.success) {
        await loadDishes();
        if (onActionComplete) onActionComplete();
        


      } else {
        toast.error(data.error || 'Erreur lors de la consommation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la consommation');
    }
  };

  const handleChangeStorage = async (dishId, newStorageMethod) => {
    try {
      const response = await fetch(`/api/cooked-dishes/${dishId}/storage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storageMethod: newStorageMethod })
      });

      const data = await response.json();

      if (data.success) {
        await loadDishes();
        if (onActionComplete) onActionComplete();
      } else {
        toast.error(data.error || 'Erreur lors du changement de stockage');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du changement de stockage');
    }
  };

  const handleDelete = async (dishId) => {
    try {
      const response = await fetch(`/api/cooked-dishes/${dishId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await loadDishes();
        if (onActionComplete) onActionComplete();
      } else {
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="cooked-dishes-loading">
        <div className="spinner"></div>
        <p>Chargement des plats cuisinés...</p>
      </div>
    );
  }

  return (
    <div className="cooked-dishes-manager">
      {/* Header avec filtres */}
      <div className="cooked-dishes-header">
        <div className="header-title">
          <h2>🍽️ Plats Cuisinés</h2>
          <span className="dishes-count">
            {dishes.length} {dishes.length > 1 ? 'plats' : 'plat'}
          </span>
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tous
          </button>
          <button
            className={`filter-btn ${filter === 'expiring' ? 'active' : ''}`}
            onClick={() => setFilter('expiring')}
          >
            ⚠️ À finir (3j)
          </button>
        </div>
      </div>

      {/* Liste des plats */}
      {dishes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <h3>Aucun plat cuisiné</h3>
          <p>
            {filter === 'expiring' 
              ? 'Aucun plat ne périme dans les 3 prochains jours'
              : 'Commencez par cuisiner un plat et il apparaîtra ici'}
          </p>
        </div>
      ) : (
        <div className="dishes-grid">
          {dishes.map(dish => (
            <CookedDishCard
              key={dish.id}
              dish={dish}
              onConsume={handleConsume}
              onChangeStorage={handleChangeStorage}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
