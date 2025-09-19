// ========================================
// FICHIER: app/pantry/page.js
// OÙ: app → pantry → page.js
// ========================================

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import './pantry.css';

export default function PantryPage() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Charger les données
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
      const { data, error } = await supabase
        .from('pantry')
        .select('*')
        .order('expiration_date', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }

  async function handleConsume(id, currentQty) {
    const qty = prompt(`Quantité à consommer ? (Max: ${currentQty})`);
    if (!qty) return;

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
      alert('Erreur lors de la mise à jour');
    }
  }

  async function handleEdit(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newQty = prompt(`Nouvelle quantité pour ${item.product_name} ?`, item.qty_remaining);
    if (!newQty) return;

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
      alert('Erreur lors de la mise à jour');
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
      alert('Erreur lors de la suppression');
    }
  }

  // Obtenir les valeurs uniques pour les filtres
  const categories = [...new Set(items.map(i => i.category_name))].filter(Boolean);
  const locations = [...new Set(items.map(i => i.storage_place))].filter(Boolean);

  // Calculer les statistiques
  const stats = {
    total: filteredItems.length,
    expiring: filteredItems.filter(i => 
      i.expiration_status === 'expiring_soon' || i.expiration_status === 'expired'
    ).length,
    categories: categories.length,
    locations: locations.length
  };

  if (loading) {
    return (
      <div className="pantry-loading">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="pantry-container">
      {/* Header */}
      <header className="pantry-header">
        <h1>🌿 Mon Garde-Manger Nature 🌿</h1>
      </header>

      {/* Statistiques */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Articles</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.expiring}</div>
          <div className="stat-label">Expirent bientôt</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.categories}</div>
          <div className="stat-label">Catégories</div>
        </div>
        <div className="stat-card">
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
    </div>
  );
}

// Composant ProductCard
function ProductCard({ item, onConsume, onEdit, onDelete }) {
  const getStatusClass = (status) => {
    switch(status) {
      case 'expired': return 'status-expired';
      case 'expiring_soon': return 'status-expiring';
      default: return 'status-good';
    }
  };

  const getStatusText = (status, days) => {
    if (!status || status === 'no_date') return 'Pas de date';
    if (status === 'expired') return `Expiré depuis ${Math.abs(days)}j`;
    if (status === 'expiring_soon') return `Expire dans ${days}j`;
    return `${days}j restants`;
  };

  return (
    <div className="product-card">
      <div className="card-header">
        <h3>{item.product_name || 'Sans nom'}</h3>
        {item.category_name && (
          <span className="category-badge">{item.category_name}</span>
        )}
      </div>

      <div className="card-body">
        <div className="info-row">
          <span>📦 {item.qty_remaining} {item.unit}</span>
        </div>
        <div className="info-row">
          <span>📍 {item.storage_place || 'Non spécifié'}</span>
        </div>

        {item.expiration_date && (
          <div className={`expiration-status ${getStatusClass(item.expiration_status)}`}>
            {getStatusText(item.expiration_status, item.days_until_expiration)}
          </div>
        )}
      </div>

      <div className="card-actions">
        <button onClick={onConsume} className="btn-action">🍽️</button>
        <button onClick={onEdit} className="btn-action">✏️</button>
        <button onClick={onDelete} className="btn-action btn-delete">🗑️</button>
      </div>
    </div>
  );
}
