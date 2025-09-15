// app/pantry/page.js
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { SmartAddForm } from './components/SmartAddForm';
import { ProductCard } from './components/ProductCard';
import { 
  groupLotsByProduct, 
  sortLotsByFEFO, 
  getExpirationStatus, 
  daysUntil,
  filterAndSortItems,
  PantryStyles 
} from './components/pantryUtils';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  Settings,
  RefreshCw
} from 'lucide-react';

// Hook personnalisé pour la gestion des données du garde-manger
function usePantryData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lots, setLots] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Chargement des lots via la vue unifiée
      const { data: lotsData, error: lotsError } = await supabase
        .from('v_inventory_display')
        .select('*')
        .gt('qty_remaining', 0) // Seulement les lots avec stock
        .order('effective_expiration', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      
      if (lotsError) throw lotsError;
      
      setLots(lotsData || []);
      
    } catch (err) {
      console.error('Erreur chargement données:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return {
    loading,
    error,
    lots,
    refresh
  };
}

// Composant principal
export default function PantryPage() {
  const { loading, error, lots, refresh } = usePantryData();
  
  // États de l'interface
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [sortBy, setSortBy] = useState('expiry'); // 'expiry', 'name', 'quantity', 'category'

  // Données calculées et filtrées
  const groupedProducts = useMemo(() => {
    return groupLotsByProduct(lots);
  }, [lots]);

  const filteredProducts = useMemo(() => {
    let filtered = groupedProducts;

    // Filtrage par recherche
    if (searchQuery.trim()) {
      filtered = filterAndSortItems(
        filtered,
        searchQuery,
        (product) => [
          product.productName,
          product.category?.name || '',
          ...(product.lots.flatMap(lot => [
            lot.notes || '',
            lot.storage_place || ''
          ]))
        ]
      );
    }

    // Filtrage par statut
    filtered = filtered.filter(product => {
      if (selectedFilter === 'all') return true;
      
      const daysToExpiry = daysUntil(product.nextExpiry);
      const status = getExpirationStatus(daysToExpiry);
      
      switch (selectedFilter) {
        case 'expired':
          return status.status === 'expired';
        case 'expiring':
          return ['today', 'critical'].includes(status.status);
        case 'fresh':
          return ['good', 'attention'].includes(status.status);
        case 'no-date':
          return status.status === 'unknown';
        default:
          return true;
      }
    });

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'expiry':
          const daysA = daysUntil(a.nextExpiry);
          const daysB = daysUntil(b.nextExpiry);
          
          // Priorité : expiré > bientôt expiré > sans date > frais
          if (daysA === null && daysB === null) return 0;
          if (daysA === null) return 1;
          if (daysB === null) return -1;
          
          return daysA - daysB;
          
        case 'name':
          return a.productName.localeCompare(b.productName, 'fr');
          
        case 'quantity':
          return b.totalQuantity - a.totalQuantity;
          
        case 'category':
          const catA = a.category?.name || 'ZZZ';
          const catB = b.category?.name || 'ZZZ';
          return catA.localeCompare(catB, 'fr');
          
        default:
          return 0;
      }
    });

    return filtered;
  }, [groupedProducts, searchQuery, selectedFilter, sortBy]);

  // Statistiques
  const stats = useMemo(() => {
    const totalProducts = groupedProducts.length;
    const totalLots = lots.length;
    
    let expiredCount = 0;
    let expiringCount = 0;
    
    groupedProducts.forEach(product => {
      const days = daysUntil(product.nextExpiry);
      const status = getExpirationStatus(days);
      
      if (status.status === 'expired') expiredCount++;
      else if (['today', 'critical'].includes(status.status)) expiringCount++;
    });

    return {
      totalProducts,
      totalLots,
      expiredCount,
      expiringCount,
      freshCount: totalProducts - expiredCount - expiringCount
    };
  }, [groupedProducts, lots]);

  // Gestion des actions sur les lots
  const handleUpdateLot = useCallback(async (lotId, updates) => {
    try {
      const updateData = {};
      if (updates.qty !== undefined) updateData.qty_remaining = parseFloat(updates.qty);
      if (updates.expiration_date !== undefined) updateData.expiration_date = updates.expiration_date || null;
      if (updates.notes !== undefined) updateData.notes = updates.notes || null;

      const { error } = await supabase
        .from('inventory_lots')
        .update(updateData)
        .eq('id', lotId);

      if (error) throw error;

      refresh();
      return true;
    } catch (err) {
      console.error('Erreur mise à jour lot:', err);
      return false;
    }
  }, [refresh]);

  const handleDeleteLot = useCallback(async (lotId) => {
    try {
      const { error } = await supabase
        .from('inventory_lots')
        .delete()
        .eq('id', lotId);

      if (error) throw error;

      refresh();
      return true;
    } catch (err) {
      console.error('Erreur suppression lot:', err);
      return false;
    }
  }, [refresh]);

  const handleAddLot = useCallback((newLot) => {
    refresh();
    setShowAddForm(false);
  }, [refresh]);

  if (loading) {
    return (
      <div className="pantry-loading">
        <RefreshCw className="loading-spinner" size={32} />
        <p>Chargement du garde-manger...</p>
      </div>
    );
  }

  return (
    <div className="pantry-page">
      {/* En-tête avec statistiques */}
      <div className="pantry-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Mon garde-manger</h1>
            <p>Gérez votre stock alimentaire intelligemment</p>
          </div>
          
          <div className="header-stats">
            <div className="stat-card">
              <Package size={20} />
              <div>
                <div className="stat-number">{stats.totalProducts}</div>
                <div className="stat-label">Produits</div>
              </div>
            </div>
            
            <div className="stat-card warning">
              <AlertTriangle size={20} />
              <div>
                <div className="stat-number">{stats.expiredCount + stats.expiringCount}</div>
                <div className="stat-label">À surveiller</div>
              </div>
            </div>
            
            <div className="stat-card success">
              <Calendar size={20} />
              <div>
                <div className="stat-number">{stats.freshCount}</div>
                <div className="stat-label">Frais</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions principales */}
        <div className="header-actions">
          <button 
            onClick={refresh}
            className="btn-action secondary"
            disabled={loading}
          >
            <RefreshCw size={16} />
            Actualiser
          </button>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn-action primary"
          >
            <Plus size={16} />
            Ajouter un produit
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="pantry-controls">
        <div className="search-section">
          <div className="search-input-group">
            <Search size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit..."
              className="search-input"
            />
          </div>
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <Filter size={16} />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tous les produits</option>
              <option value="expiring">À consommer rapidement</option>
              <option value="expired">Expirés</option>
