// app/pantry/page.js
'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
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
        .gt('qty_remaining', 0)
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

// Utilitaires simples
const daysUntil = (date) => {
  if (!date) return null;
  const today = new Date();
  const expiry = new Date(date);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

const getExpirationStatus = (days) => {
  if (days === null) return { status: 'unknown', color: '#6b7280', label: 'Sans date' };
  if (days < 0) return { status: 'expired', color: '#dc2626', label: 'Expiré' };
  if (days === 0) return { status: 'today', color: '#ea580c', label: 'Aujourd\'hui' };
  if (days <= 3) return { status: 'critical', color: '#d97706', label: `${days}j` };
  if (days <= 7) return { status: 'warning', color: '#ca8a04', label: `${days}j` };
  return { status: 'good', color: '#059669', label: `${days}j` };
};

// Composant principal
export default function PantryPage() {
  const { loading, error, lots, refresh } = usePantryData();
  
  // États de l'interface
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Groupement des lots par produit
  const groupedProducts = useMemo(() => {
    const groups = new Map();
    
    lots.forEach(lot => {
      const productId = lot.canonical_food_id || lot.cultivar_id || 
                       lot.generic_product_id || lot.derived_product_id;
      const productName = lot.display_name || 'Produit inconnu';
      
      if (!groups.has(productId)) {
        groups.set(productId, {
          productId,
          productName,
          lots: [],
          totalQuantity: 0,
          primaryUnit: lot.unit,
          category: { name: lot.category_name },
          nextExpiry: null
        });
      }
      
      const group = groups.get(productId);
      group.lots.push(lot);
      group.totalQuantity += lot.qty_remaining || 0;
      
      const lotExpiry = lot.effective_expiration;
      if (lotExpiry && (!group.nextExpiry || new Date(lotExpiry) < new Date(group.nextExpiry))) {
        group.nextExpiry = lotExpiry;
      }
    });
    
    return Array.from(groups.values());
  }, [lots]);

  // Filtrage des produits
  const filteredProducts = useMemo(() => {
    let filtered = groupedProducts;

    // Filtrage par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.productName.toLowerCase().includes(query) ||
        product.category?.name?.toLowerCase().includes(query)
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
          return ['good', 'warning'].includes(status.status);
        case 'no-date':
          return status.status === 'unknown';
        default:
          return true;
      }
    });

    // Tri par date d'expiration
    filtered.sort((a, b) => {
      const daysA = daysUntil(a.nextExpiry);
      const daysB = daysUntil(b.nextExpiry);
      
      if (daysA === null && daysB === null) return 0;
      if (daysA === null) return 1;
      if (daysB === null) return -1;
      
      return daysA - daysB;
    });

    return filtered;
  }, [groupedProducts, searchQuery, selectedFilter]);

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

  // Composant ProductCard simplifié
  const ProductCard = ({ product }) => {
    const daysToExpiry = daysUntil(product.nextExpiry);
    const status = getExpirationStatus(daysToExpiry);
    
    return (
      <div className="product-card">
        <div className="product-header">
          <div className="product-info">
            <h3 className="product-name">{product.productName}</h3>
            <div className="product-meta">
              <span className="product-quantity">
                {product.totalQuantity.toFixed(1)} {product.primaryUnit}
              </span>
              <span className="lots-count">
                ({product.lots.length} lot{product.lots.length > 1 ? 's' : ''})
              </span>
            </div>
          </div>
          <div className="expiration-status" style={{ color: status.color }}>
            <div className="status-text">{status.label}</div>
            {product.nextExpiry && (
              <div className="expiry-date">{formatDate(product.nextExpiry)}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
              <option value="fresh">Produits frais</option>
              <option value="no-date">Sans date d'expiration</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={refresh} className="btn-retry">
            Réessayer
          </button>
        </div>
      )}

      {/* Contenu principal */}
      <div className="pantry-content">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            {searchQuery || selectedFilter !== 'all' ? (
              <>
                <Search size={48} />
                <h3>Aucun produit trouvé</h3>
                <p>Essayez de modifier vos critères de recherche ou filtres</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                  className="btn-action secondary"
                >
                  Réinitialiser les filtres
                </button>
              </>
            ) : (
              <>
                <Package size={48} />
                <h3>Votre garde-manger est vide</h3>
                <p>Commencez par ajouter vos premiers produits</p>
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="btn-action primary"
                >
                  <Plus size={16} />
                  Ajouter un produit
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.productId}
                product={product}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .pantry-page {
          min-height: 100vh;
          background: 
            radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
            linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 20%, #f0f9ff 40%, #faf5ff 60%, #f9fafb 80%, #f0fdf4 100%);
          padding: 20px;
          position: relative;
        }

        .pantry-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: 16px;
          color: #6b7280;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          padding: 40px;
          margin: 20px auto;
          max-width: 400px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .pantry-header {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          border-radius: 20px;
          padding: 28px;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .header-title h1 {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #059669 0%, #0891b2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 8px 0;
        }

        .header-title p {
          color: #6b7280;
          margin: 0;
          font-size: 16px;
        }

        .header-stats {
          display: flex;
          gap: 16px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          padding: 18px 22px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.8);
          color: #059669;
          min-width: 130px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          transition: all 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
        }

        .stat-card.warning {
          color: #d97706;
          background: rgba(255, 251, 235, 0.8);
        }

        .stat-card.success {
          color: #059669;
          background: rgba(236, 253, 245, 0.8);
        }

        .stat-number {
          font-size: 24px;
          font-weight: 700;
          line-height: 1;
        }

        .stat-label {
          font-size: 12px;
          opacity: 0.8;
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .btn-action {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .btn-action.primary {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
        }

        .btn-action.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(5, 150, 105, 0.4);
        }

        .btn-action.secondary {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          color: #374151;
          border: 1px solid rgba(255, 255, 255, 0.9);
        }

        .btn-action.secondary:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
        }

        .btn-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .pantry-controls {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }

        .search-section {
          flex: 1;
          min-width: 300px;
        }

        .search-input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-input-group svg {
          position: absolute;
          left: 12px;
          color: #9ca3af;
          z-index: 2;
        }

        .search-input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          border: 2px solid rgba(229, 231, 235, 0.8);
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.2s ease;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
        }

        .search-input:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
          background: rgba(255, 255, 255, 0.95);
        }

        .filters-section {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid rgba(209, 213, 219, 0.8);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-select:focus {
          outline: none;
          border-color: #059669;
          box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(254, 242, 242, 0.9);
          backdrop-filter: blur(8px);
          color: #dc2626;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid rgba(252, 165, 165, 0.5);
          margin-bottom: 24px;
        }

        .btn-retry {
          background: #dc2626;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          margin-left: auto;
        }

        .pantry-content {
          min-height: 400px;
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 60px 30px;
          color: #6b7280;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border-radius: 20px;
          border: 2px dashed rgba(209, 213, 219, 0.6);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }

        .empty-state svg {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px 0;
        }

        .empty-state p {
          margin: 0 0 24px 0;
          max-width: 400px;
        }

        .product-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.9);
          border-radius: 16px;
          padding: 20px;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          border-color: rgba(255, 255, 255, 0.95);
        }

        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .product-info {
          flex: 1;
        }

        .product-name {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 6px 0;
        }

        .product-meta {
          display: flex;
          gap: 10px;
          align-items: center;
          font-size: 14px;
          color: #6b7280;
        }

        .product-quantity {
          font-weight: 600;
          color: #374151;
          background: rgba(59, 130, 246, 0.1);
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }

        .lots-count {
          opacity: 0.7;
          font-size: 12px;
        }

        .expiration-status {
          text-align: right;
          font-weight: 600;
          font-size: 14px;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.8);
        }

        .expiry-date {
          font-size: 11px;
          opacity: 0.8;
          margin-top: 3px;
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .pantry-page {
            padding: 12px;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
          }

          .header-stats {
            width: 100%;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 10px;
          }

          .stat-card {
            flex: 1;
            min-width: 110px;
            padding: 14px 16px;
          }

          .stat-number {
            font-size: 20px;
          }

          .pantry-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-section {
            min-width: 0;
          }

          .products-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .header-stats {
            flex-direction: column;
            gap: 8px;
          }

          .stat-card {
            justify-content: center;
          }

          .header-title h1 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}
