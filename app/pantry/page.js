'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import SmartAddForm from './components/SmartAddForm';
import { getQuickConversions } from '../../lib/quickConversions';
import { capitalizeProduct } from './components/pantryUtils';
import './pantry.css';

// Composant ProductCard amélioré - CLIQUABLE
function ProductCard({ item, onConsume, onEdit, onDelete, onUpdateQuantity }) {
  const [showActions, setShowActions] = useState(false);
  
  // Calculer les conversions rapides possibles
  const productMeta = { 
    productName: item.product_name,
    grams_per_unit: item.grams_per_unit,
    density_g_per_ml: item.density_g_per_ml
  };
  const quickConversions = getQuickConversions(item.qty_remaining, item.unit, productMeta);

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
    <div className="product-card" onClick={handleCardClick} style={{cursor: 'pointer'}}>
      <div className="card-header">
        <h3>{capitalizeProduct(item.product_name) || 'Sans nom'}</h3>
        {item.category_name && (
          <span className="category-badge">{item.category_name}</span>
        )}
      </div>

      <div className="card-body">
        <div className="info-row">
          <span className="info-icon">📦</span>
          <div className="quantity-section">
            <span className="info-value">{item.qty_remaining || 0} {item.unit || 'unité'}</span>
            {quickConversions.length > 0 && (
              <div className="quick-conversions">
                {quickConversions.map((conversion, index) => (
                  <button
                    key={index}
                    className="conversion-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUpdateQuantity && typeof onUpdateQuantity === 'function') {
                        onUpdateQuantity(item.id, conversion.qty, conversion.unit);
                      }
                    }}
                    title={`Convertir en ${conversion.label}`}
                  >
                    ↔ {conversion.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
  );
}

export default function PantryPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
    });
  }, [router]);

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
      // Utiliser la nouvelle vue pantry_view
      let { data, error } = await supabase
        .from('pantry_view')
        .select('*')
        .order('expiration_date', { ascending: true, nullsLast: true });

      // Fallback vers l'ancienne vue pantry si elle existe encore
      if (error && error.code === '42P01') {
        console.log('Vue pantry_view non trouvée, essai avec pantry');
        const result = await supabase
          .from('pantry')
          .select('*')
          .order('expiration_date', { ascending: true });
        
        data = result.data;
        error = result.error;
      }
      
      // Si ça ne marche toujours pas, utiliser inventory_lots directement
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
        product_name: 'Bananes',
        category_name: 'Fruits',
        qty_remaining: 5,
        unit: 'u',
        grams_per_unit: 120,
        storage_place: 'Garde-manger',
        expiration_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiration_status: 'expiring_soon',
        days_until_expiration: 3
      },
      {
        id: 'demo-2',
        product_name: 'Pommes',
        category_name: 'Fruits',
        qty_remaining: 3,
        unit: 'u',
        grams_per_unit: 150,
        storage_place: 'Réfrigérateur',
        expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiration_status: 'good',
        days_until_expiration: 7
      },
      {
        id: 'demo-3',
        product_name: 'Lait',
        category_name: 'Produits laitiers',
        qty_remaining: 500,
        unit: 'ml',
        density_g_per_ml: 1.03,
        storage_place: 'Réfrigérateur',
        expiration_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        expiration_status: 'expiring_soon',
        days_until_expiration: 2
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

  async function handleUpdateQuantity(id, newQty, newUnit) {
    try {
      const { error } = await supabase
        .from('inventory_lots')
        .update({ 
          qty_remaining: parseFloat(newQty),
          unit: newUnit
        })
        .eq('id', id);

      if (error) throw error;
      
      await loadPantryItems();
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      // Mise à jour locale en cas d'erreur
      setItems(prev => prev.map(i => 
        i.id === id ? { ...i, qty_remaining: parseFloat(newQty), unit: newUnit } : i
      ));
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
      <div className="pantry-loading">
        <div className="loading-spinner"></div>
        <p>Chargement du garde-manger...</p>
      </div>
    );
  }

  return (
    <div className="pantry-container">
      {/* Filtres et stats sur une ligne compacte */}
      <div className="top-controls">
        <div className="search-filters">
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

        {/* Stats inline compactes */}
        <div className="stats-inline">
          <div className="stat-item">
            <span className="stat-number">{items.length}</span>
            <span className="stat-label">ARTICLES</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{items.filter(i => i.expiration_status === 'expired').length}</span>
            <span className="stat-label">EXPIRÉS</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{items.filter(i => i.expiration_status === 'expiring_soon').length}</span>
            <span className="stat-label">EXPIRE BIENTÔT</span>
          </div>
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
              onUpdateQuantity={handleUpdateQuantity}
            />
          ))
        )}
      </div>

      {/* Modal d'ajout */}
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
