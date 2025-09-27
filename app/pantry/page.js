'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import SmartAddForm from '@/components/SmartAddForm';
import './pantry.css';

// Composant ProductCard amélioré - CLIQUABLE
function ProductCard({ item, onConsume, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false);

  const getStatusClass = (status) => {
    switch(status) {
      case 'expired': return 'status-expired';
      case 'expiring_soon': return 'status-expiring';
      default: return 'status-good';
    }
  };

  const getStatusText = (status, days) => {
    if (!status || status === 'no_date') return '📅 Pas de date';
    if (status === 'expired') return `Expiré depuis ${Math.abs(days)}j`;
    if (status === 'expiring_soon') return `Expire dans ${days}j`;
    return `${days}j restants`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    });
  };

  const handleCardClick = () => {
    setShowActions(!showActions);
  };

  const handleAction = (action, e) => {
    e.stopPropagation();
    action();
    setShowActions(false);
  };

  return (
    <>
      <div className="product-card" onClick={handleCardClick} style={{cursor: 'pointer'}}>
        <div className="card-header">
          <h3>{item.product_name || 'Sans nom'}</h3>
          {item.category_name && (
            <span className="category-badge">{item.category_name}</span>
          )}
        </div>

        <div className="card-body">
          <div className="info-row">
            <span className="info-icon">📦</span>
            <span className="info-value">{item.qty_remaining || 0} {item.unit || 'unité'}</span>
          </div>
          <div className="info-row">
            <span className="info-icon">📍</span>
            <span className="info-value">{item.storage_place || 'Non spécifié'}</span>
          </div>
          <div className="info-row">
            <span className={`status-badge ${getStatusClass(item.expiration_status)}`}>
              {getStatusText(item.expiration_status, item.days_until_expiration)}
            </span>
          </div>
          {item.expiration_date && (
            <div className="info-row">
              <span className="info-icon">🗓️</span>
              <span className="info-value">{formatDate(item.expiration_date)}</span>
            </div>
          )}
        </div>

        {showActions && (
          <div className="card-actions">
            <button 
              className="action-btn consume"
              onClick={(e) => handleAction(onConsume, e)}
            >
              ✓ Consommer
            </button>
            <button 
              className="action-btn edit"
              onClick={(e) => handleAction(onEdit, e)}
            >
              ✏️ Modifier
            </button>
            <button 
              className="action-btn delete"
              onClick={(e) => handleAction(onDelete, e)}
            >
              🗑️ Supprimer
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function PantryPage() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadPantryItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, statusFilter]);

  function filterItems() {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        (item.product_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.expiration_status === statusFilter);
    }

    setFilteredItems(filtered);
  }

  async function loadPantryItems() {
    setLoading(true);
    try {
      // Essayer d'abord avec la vue pantry
      let { data, error } = await supabase
        .from('pantry')
        .select('*')
        .order('expiration_date', { ascending: true });

      // Si la vue n'existe pas, essayer avec inventory_lots
      if (error && error.code === '42P01') {
        console.log('Vue pantry non trouvée, utilisation de inventory_lots');
        const result = await supabase
          .from('inventory_lots')
          .select('*')
          .order('expiration_date', { ascending: true });
        
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      
      // Transformer les données si nécessaire
      const transformedData = (data || []).map(item => ({
        ...item,
        product_name: item.product_name || item.notes || 'Produit sans nom',
        expiration_status: getExpirationStatus(item.expiration_date),
        days_until_expiration: getDaysUntilExpiration(item.expiration_date)
      }));
      
      setItems(transformedData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      // Utiliser des données de démo en cas d'erreur
      setItems(getDemoData());
    } finally {
      setLoading(false);
    }
  }

  function getExpirationStatus(dateString) {
    if (!dateString) return 'no_date';
    
    const today = new Date();
    const expirationDate = new Date(dateString);
    const diffTime = expirationDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 3) return 'expiring_soon';
    return 'good';
  }

  function getDaysUntilExpiration(dateString) {
    if (!dateString) return null;
    
    const today = new Date();
    const expirationDate = new Date(dateString);
    const diffTime = expirationDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function getDemoData() {
    return [
      {
        id: 'demo-1',
        product_name: 'Tomates',
        category_name: 'Légumes',
        qty_remaining: 5,
        unit: 'pièces',
        storage_place: 'Réfrigérateur',
        expiration_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiration_status: 'expiring_soon',
        days_until_expiration: 2
      },
      {
        id: 'demo-2',
        product_name: 'Pâtes',
        category_name: 'Féculents',
        qty_remaining: 500,
        unit: 'g',
        storage_place: 'Placard',
        expiration_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiration_status: 'good',
        days_until_expiration: 180
      }
    ];
  }

  async function handleConsume(id, currentQty) {
    const newQty = prompt(`Nouvelle quantité (actuel: ${currentQty}):`, currentQty);
    if (newQty === null) return;

    try {
      const { error } = await supabase
        .from('inventory_lots')
        .update({ qty_remaining: parseFloat(newQty) })
        .eq('id', id);

      if (error) throw error;
      
      await loadPantryItems();
      alert('Quantité mise à jour');
    } catch (error) {
      console.error('Erreur:', error);
      // Mise à jour locale en cas d'erreur
      setItems(prev => prev.map(i => 
        i.id === id ? { ...i, qty_remaining: parseFloat(newQty) } : i
      ));
    }
  }

  async function handleEdit(id) {
    // Pour l'instant, rediriger vers la consommation
    const item = items.find(i => i.id === id);
    if (item) {
      handleConsume(id, item.qty_remaining);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cet article ?')) return;

    try {
      const { error } = await supabase
        .from('inventory_lots')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadPantryItems();
      alert('Article supprimé');
    } catch (error) {
      console.error('Erreur:', error);
      // Suppression locale en cas d'erreur
      setItems(prev => prev.filter(i => i.id !== id));
    }
  }

  function handleFormClose() {
    setShowForm(false);
    loadPantryItems();
  }

  if (loading) {
    return (
      <div className="pantry-container">
        <div className="loading-state">
          <h2>Chargement du garde-manger...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="pantry-container">
      {/* En-tête */}
      <div className="pantry-header">
        <h1>🏠 Garde-Manger</h1>
        <p>Gérez vos stocks et dates de péremption</p>
      </div>

      {/* Filtres */}
      <div className="pantry-filters">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tous les statuts</option>
          <option value="expired">Expirés</option>
          <option value="expiring_soon">Expire bientôt</option>
          <option value="good">En bon état</option>
        </select>
      </div>

      {/* Statistiques rapides */}
      <div className="pantry-stats">
        <div className="stat-card">
          <span className="stat-number">{items.length}</span>
          <span className="stat-label">Articles</span>
        </div>
        <div className="stat-card danger">
          <span className="stat-number">
            {items.filter(i => i.expiration_status === 'expired').length}
          </span>
          <span className="stat-label">Expirés</span>
        </div>
        <div className="stat-card warning">
          <span className="stat-number">
            {items.filter(i => i.expiration_status === 'expiring_soon').length}
          </span>
          <span className="stat-label">Expire bientôt</span>
        </div>
      </div>

      {/* Grille des produits */}
      <div className="pantry-grid">
        {filteredItems.length === 0 ? (
          <div className="empty-state">
            <h2>Aucun article trouvé</h2>
            <p>Ajustez vos filtres ou ajoutez des articles</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <ProductCard 
              key={item.id} 
              item={item}
              onConsume={() => handleConsume(item.id, item.qty_remaining)}
              onEdit={() => handleEdit(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          ))
        )}
      </div>

      {/* Modal d'ajout (glassmorphisme) */}
      {showForm && (
        <SmartAddForm 
          open={showForm}
          onClose={handleFormClose}
          onLotCreated={handleFormClose}
        />
      )}

      {/* Bouton flottant pour ajouter */}
      <button
        className="pantry-fab"
        onClick={() => setShowForm(true)}
        title="Ajouter un article"
      >
        +
      </button>
    </div>
  );
}
