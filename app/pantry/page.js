// ========================================
// FICHIER: app/pantry/page.js
// ========================================

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import './pantry.css';
// ⬇️ Choisis UN des deux imports selon l'emplacement réel du fichier :
import SmartAddForm from '@/components/SmartAddForm'; 
// import SmartAddForm from './components/SmartAddForm';


export default function PantryPage() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Charger les données au montage
  useEffect(() => {
    loadPantryItems();
  }, []);

  // Filtrer les items
  useEffect(() => {
    let filtered = [...items];

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(item => item.category_name === categoryFilter);
    }

    if (locationFilter) {
      filtered = filtered.filter(item => item.storage_place === locationFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(item => item.expiration_status === statusFilter);
    }

    setFilteredItems(filtered);
  }, [items, searchTerm, categoryFilter, locationFilter, statusFilter]);

  async function loadPantryItems() {
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

  function getExpirationStatus(date) {
    if (!date) return 'no_date';
    const days = getDaysUntilExpiration(date);
    if (days < 0) return 'expired';
    if (days <= 7) return 'expiring_soon';
    return 'good';
  }

  function getDaysUntilExpiration(date) {
    if (!date) return null;
    const expDate = new Date(date);
    const today = new Date();
    const diffTime = expDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  function getDemoData() {
    return [
      {
        id: 1,
        product_name: 'Tomates Cerises Bio',
        category_name: 'Légumes',
        qty_remaining: 500,
        unit: 'g',
        storage_place: 'Frigo',
        expiration_date: '2025-09-25',
        expiration_status: 'expiring_soon',
        days_until_expiration: 6
      },
      {
        id: 2,
        product_name: 'Farine de Blé T55',
        category_name: 'Céréales',
        qty_remaining: 2,
        unit: 'kg',
        storage_place: 'Garde-manger',
        expiration_date: '2026-03-15',
        expiration_status: 'good',
        days_until_expiration: 177
      },
      {
        id: 3,
        product_name: 'Haricots Verts',
        category_name: 'Légumes',
        qty_remaining: 300,
        unit: 'g',
        storage_place: 'Congélateur',
        expiration_date: '2026-01-15',
        expiration_status: 'good',
        days_until_expiration: 118
      }
    ];
  }

  async function handleConsume(id, currentQty) {
    const qty = prompt(`Quantité à consommer ? (Max: ${currentQty})`);
    if (!qty || isNaN(qty)) return;

    try {
      const newQty = Math.max(0, currentQty - parseFloat(qty));
      
      const { error } = await supabase
        .from('inventory_lots')
        .update({ qty_remaining: newQty })
        .eq('id', id);

      if (error) throw error;
      
      await loadPantryItems();
      alert('Article mis à jour !');
    } catch (error) {
      console.error('Erreur:', error);
      // Mise à jour locale en cas d'erreur
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, qty_remaining: Math.max(0, currentQty - parseFloat(qty)) } : item
      ));
    }
  }

  async function handleEdit(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newQty = prompt(`Nouvelle quantité pour ${item.product_name} ?`, item.qty_remaining);
    if (!newQty || isNaN(newQty)) return;

    try {
      const { error } = await supabase
        .from('inventory_lots')
        .update({ qty_remaining: parseFloat(newQty) })
        .eq('id', id);

      if (error) throw error;
      
      await loadPantryItems();
      alert('Quantité mise à jour !');
    } catch (error) {
      console.error('Erreur:', error);
      // Mise à jour locale en cas d'erreur
      setItems(prev => prev.map(i => 
        i.id === id ? { ...i, qty_remaining: parseFloat(newQty) } : i
      ));
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cet article ?')) return;

    try {
      const { error } = await supabase
        .from('inventory_lots')
        .update({ qty_remaining: 0 })
        .eq('id', id);

      if (error) throw error;
      
      await loadPantryItems();
      alert('Article supprimé');
    } catch (error) {
      console.error('Erreur:', error);
      // Suppression locale en cas d'erreur
      setItems(prev => prev.filter(item => item.id !== id));
    }
  }

  // Obtenir les valeurs uniques pour les filtres
  const categories = [...new Set(items.map(i => i.category_name))].filter(Boolean);
  const locations = [...new Set(items.map(i => i.storage_place))].filter(Boolean);

  // État pour gérer le filtre rapide depuis les stats
  const [quickFilter, setQuickFilter] = useState('');

  // Calculer les statistiques
  const stats = {
    total: filteredItems.length,
    expiring: filteredItems.filter(i => 
      i.expiration_status === 'expiring_soon' || i.expiration_status === 'expired'
    ).length,
    categories: categories.length,
    locations: locations.length
  };

  // Fonction pour les filtres rapides via les cartes de stats
  const handleQuickFilter = (filterType) => {
    switch(filterType) {
      case 'all':
        setStatusFilter('');
        setCategoryFilter('');
        setLocationFilter('');
        setQuickFilter('all');
        break;
      case 'expiring':
        setStatusFilter('expiring_soon');
        setQuickFilter('expiring');
        break;
      case 'categories':
        // Afficher un modal ou dropdown pour choisir une catégorie
        setQuickFilter('categories');
        break;
      case 'locations':
        // Afficher un modal ou dropdown pour choisir un emplacement
        setQuickFilter('locations');
        break;
    }
  };

  if (loading) {
    return (
      <div className="pantry-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de votre garde-manger...</p>
      </div>
    );
  }

  return (
    <div className="pantry-container">
      {/* Statistiques CLIQUABLES */}
      <div className="stats-container">
        <div 
          className={`stat-card ${quickFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleQuickFilter('all')}
          style={{cursor: 'pointer'}}
        >
          <div className="stat-number">{items.length}</div>
          <div className="stat-label">Articles Total</div>
        </div>
        <div 
          className={`stat-card ${quickFilter === 'expiring' ? 'active' : ''}`}
          onClick={() => handleQuickFilter('expiring')}
          style={{cursor: 'pointer'}}
        >
          <div className="stat-number">{stats.expiring}</div>
          <div className="stat-label">Expirent bientôt</div>
        </div>
        <div 
          className="stat-card"
          style={{cursor: 'pointer'}}
        >
          <div className="stat-number">{stats.categories}</div>
          <div className="stat-label">Catégories</div>
        </div>
        <div 
          className="stat-card"
          style={{cursor: 'pointer'}}
        >
          <div className="stat-number">{stats.locations}</div>
          <div className="stat-label">Emplacements</div>
        </div>
      </div>

      {/* Filtres */}
      <div className="filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="🔍 Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">📁 Toutes catégories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select 
            value={locationFilter} 
            onChange={(e) => setLocationFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">📍 Tous emplacements</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">⏰ Tous statuts</option>
            <option value="good">✅ Bon état</option>
            <option value="expiring_soon">⚠️ Expire bientôt</option>
            <option value="expired">❌ Expiré</option>
            <option value="no_date">📅 Sans date</option>
          </select>
        </div>
      </div>

      {/* Grille de produits */}
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

           {/* Modal d’ajout (glassmorphisme) */}
      {showForm && (
        <SmartAddForm onClose={() => setShowForm(false)} />
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
          {item.expiration_date && (
            <div className="info-row">
              <span className="info-icon">📅</span>
              <span className="info-value">{formatDate(item.expiration_date)}</span>
            </div>
          )}

          {item.expiration_date && (
            <div className={`expiration-status ${getStatusClass(item.expiration_status)}`}>
              {getStatusText(item.expiration_status, item.days_until_expiration)}
            </div>
          )}
        </div>

        {/* Indicateur visuel qu'on peut cliquer */}
        <div className="card-click-indicator">
          <span>Cliquez pour actions</span>
        </div>
      </div>

      {/* Modal d'actions */}
      {showActions && (
        <div className="action-modal-overlay" onClick={() => setShowActions(false)}>
          <div className="action-modal" onClick={(e) => e.stopPropagation()}>
            <h4>{item.product_name}</h4>
            <div className="modal-actions">
              <button 
                className="modal-btn consume" 
                onClick={(e) => handleAction(onConsume, e)}
              >
                🍽️ Consommer
              </button>
              <button 
                className="modal-btn edit" 
                onClick={(e) => handleAction(onEdit, e)}
              >
                ✏️ Modifier
              </button>
              <button 
                className="modal-btn delete" 
                onClick={(e) => handleAction(onDelete, e)}
              >
                🗑️ Supprimer
              </button>
            </div>
            <button className="modal-close" onClick={() => setShowActions(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
