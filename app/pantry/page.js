'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  AlertTriangle, 
  Calendar,
  RefreshCw,
  Leaf,
  Droplets,
  Sun
} from 'lucide-react';

// Hook personnalisé pour la gestion des données
function usePantryData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lots, setLots] = useState([]);

  // Données de démonstration
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLots([
        {
          id: 1,
          display_name: 'Tomates cerises bio',
          canonical_food_id: 'tomatoes',
          category_name: 'Légumes',
          unit: 'g',
          qty_remaining: 250,
          effective_expiration: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          display_name: 'Basilic frais',
          canonical_food_id: 'basil',
          category_name: 'Herbes',
          unit: 'g',
          qty_remaining: 30,
          effective_expiration: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          display_name: 'Miel de lavande',
          canonical_food_id: 'honey',
          category_name: 'Condiments',
          unit: 'ml',
          qty_remaining: 500,
          effective_expiration: null
        },
        {
          id: 4,
          display_name: 'Champignons shiitake',
          canonical_food_id: 'mushrooms',
          category_name: 'Légumes',
          unit: 'g',
          qty_remaining: 150,
          effective_expiration: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const refresh = useCallback(() => {
    // Logique de rafraîchissement
  }, []);

  return { loading, error, lots, refresh };
}

// Utilitaires
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
    month: 'short'
  });
};

const getExpirationStatus = (days) => {
  if (days === null) return { emoji: '🌿', label: 'Stable', color: 'var(--earth-600)' };
  if (days < 0) return { emoji: '🍂', label: 'Périmé', color: '#dc2626' };
  if (days === 0) return { emoji: '⏰', label: "Aujourd'hui", color: '#ea580c' };
  if (days <= 3) return { emoji: '🍊', label: `${days}j`, color: 'var(--autumn-orange)' };
  if (days <= 7) return { emoji: '🌾', label: `${days}j`, color: 'var(--mushroom)' };
  return { emoji: '🌱', label: `${days}j`, color: 'var(--forest-500)' };
};

export default function PantryPage() {
  const { loading, error, lots, refresh } = usePantryData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Groupement des produits
  const groupedProducts = useMemo(() => {
    const groups = new Map();
    
    lots.forEach(lot => {
      const productId = lot.canonical_food_id;
      const productName = lot.display_name;
      
      if (!groups.has(productId)) {
        groups.set(productId, {
          productId,
          productName,
          lots: [],
          totalQuantity: 0,
          unit: lot.unit,
          category: lot.category_name,
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

  // Filtrage
  const filteredProducts = useMemo(() => {
    let filtered = groupedProducts;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.productName.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query)
      );
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(product => {
        const days = daysUntil(product.nextExpiry);
        const status = getExpirationStatus(days);
        
        switch (selectedFilter) {
          case 'expiring':
            return days !== null && days <= 7;
          case 'fresh':
            return days === null || days > 7;
          default:
            return true;
        }
      });
    }

    return filtered.sort((a, b) => {
      const daysA = daysUntil(a.nextExpiry);
      const daysB = daysUntil(b.nextExpiry);
      
      if (daysA === null && daysB === null) return 0;
      if (daysA === null) return 1;
      if (daysB === null) return -1;
      
      return daysA - daysB;
    });
  }, [groupedProducts, searchQuery, selectedFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalProducts = groupedProducts.length;
    let expiringCount = 0;
    let freshCount = 0;
    
    groupedProducts.forEach(product => {
      const days = daysUntil(product.nextExpiry);
      if (days !== null && days <= 7) expiringCount++;
      else freshCount++;
    });

    return { totalProducts, expiringCount, freshCount };
  }, [groupedProducts]);

  // Composant Card produit
  const ProductCard = ({ product }) => {
    const days = daysUntil(product.nextExpiry);
    const status = getExpirationStatus(days);
    
    return (
      <div className="product-card glass-card">
        <div className="card-accent" />
        <div className="card-content">
          <div className="product-header">
            <span className="product-emoji">{status.emoji}</span>
            <h3 className="product-name">{product.productName}</h3>
          </div>
          
          <div className="product-meta">
            <span className="category-badge">{product.category}</span>
            <span className="quantity">
              {product.totalQuantity.toFixed(0)}{product.unit}
            </span>
          </div>
          
          {product.nextExpiry && (
            <div className="expiry-info" style={{ color: status.color }}>
              <Calendar size={14} />
              <span>{formatDate(product.nextExpiry)}</span>
              <span className="expiry-label">{status.label}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <Leaf className="spin" size={32} />
        </div>
        <p>Chargement du garde-manger...</p>
      </div>
    );
  }

  return (
    <div className="pantry-container">
      {/* En-tête organique */}
      <header className="pantry-header glass-card">
        <div className="header-main">
          <div className="title-section">
            <h1>
              <Leaf className="title-icon" />
              Mon garde-manger vivant
            </h1>
            <p>Cultivez l'harmonie entre vos réserves et la nature</p>
          </div>
          
          <div className="stats-bubbles">
            <div className="stat-bubble fresh">
              <Sun size={20} />
              <div className="stat-content">
                <span className="stat-value">{stats.freshCount}</span>
                <span className="stat-label">Frais</span>
              </div>
            </div>
            
            <div className="stat-bubble warning">
              <Droplets size={20} />
              <div className="stat-content">
                <span className="stat-value">{stats.expiringCount}</span>
                <span className="stat-label">À consommer</span>
              </div>
            </div>
            
            <div className="stat-bubble total">
              <Package size={20} />
              <div className="stat-content">
                <span className="stat-value">{stats.totalProducts}</span>
                <span className="stat-label">Produits</span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button onClick={refresh} className="btn-organic secondary">
            <RefreshCw size={16} />
            Actualiser
          </button>
          
          <button onClick={() => setShowAddForm(true)} className="btn-organic primary">
            <Plus size={16} />
            Ajouter
          </button>
        </div>
      </header>

      {/* Barre de recherche fluide */}
      <div className="search-bar glass-card">
        <div className="search-input-wrapper">
          <Search size={20} />
          <input
            type="text"
            placeholder="Rechercher dans le garde-manger..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filter-pills">
          <button 
            className={`filter-pill ${selectedFilter === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('all')}
          >
            Tous
          </button>
          <button 
            className={`filter-pill ${selectedFilter === 'expiring' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('expiring')}
          >
            À consommer
          </button>
          <button 
            className={`filter-pill ${selectedFilter === 'fresh' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('fresh')}
          >
            Longue conservation
          </button>
        </div>
      </div>

      {/* Grille de produits */}
      <div className="products-garden">
        {filteredProducts.length === 0 ? (
          <div className="empty-state glass-card">
            <Package size={48} style={{ opacity: 0.3 }} />
            <h3>Votre garde-manger attend ses premières réserves</h3>
            <p>Commencez à cultiver votre autonomie alimentaire</p>
            <button onClick={() => setShowAddForm(true)} className="btn-organic primary">
              <Plus size={16} />
              Ajouter un premier produit
            </button>
          </div>
        ) : (
          filteredProducts.map(product => (
            <ProductCard key={product.productId} product={product} />
          ))
        )}
      </div>

      <style jsx>{`
        .pantry-container {
          min-height: 100vh;
          padding: 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        /* Glassmorphisme organique */
        .glass-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(6px) saturate(110%);
          -webkit-backdrop-filter: blur(6px) saturate(110%);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
          border-radius: 24px;
          position: relative;
          overflow: hidden;
        }

        /* Header naturel */
        .pantry-header {
          margin-bottom: 2rem;
          padding: 2rem;
          animation: float-in 0.6s ease-out;
        }

        .header-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 2rem;
          margin-bottom: 1.5rem;
        }

        .title-section h1 {
          font-size: 2rem;
          font-weight: 700;
          color: var(--forest-700, #4a7c4a);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0 0 0.5rem 0;
        }

        .title-icon {
          animation: sway 3s ease-in-out infinite;
        }

        .title-section p {
          color: var(--earth-600, #a39274);
          font-size: 1rem;
          margin: 0;
        }

        /* Bulles de stats organiques */
        .stats-bubbles {
          display: flex;
          gap: 1.5rem;
        }

        .stat-bubble {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          border-radius: 50px;
          border: 2px solid;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stat-bubble:hover {
          transform: translateY(-3px) scale(1.05);
        }

        .stat-bubble.fresh {
          border-color: var(--forest-300, #c8d8c8);
          color: var(--forest-600, #6b9d6b);
        }

        .stat-bubble.warning {
          border-color: var(--mushroom, #d4a574);
          color: var(--autumn-orange, #e67e22);
        }

        .stat-bubble.total {
          border-color: var(--earth-300, #ddd4c4);
          color: var(--earth-700, #8b7a5d);
        }

        .stat-content {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        /* Boutons organiques */
        .header-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-organic {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .btn-organic.primary {
          background: linear-gradient(135deg, var(--forest-500, #8bb58b), var(--forest-600, #6b9d6b));
          color: white;
          box-shadow: 0 4px 12px rgba(139, 181, 139, 0.3);
        }

        .btn-organic.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 181, 139, 0.4);
        }

        .btn-organic.secondary {
          background: rgba(255, 255, 255, 0.8);
          color: var(--forest-700, #4a7c4a);
          border: 2px solid var(--forest-300, #c8d8c8);
        }

        .btn-organic.secondary:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: scale(1.05);
        }

        /* Barre de recherche fluide */
        .search-bar {
          margin-bottom: 2rem;
          padding: 1.5rem;
          animation: float-in 0.7s ease-out 0.1s both;
        }

        .search-input-wrapper {
          position: relative;
          margin-bottom: 1rem;
        }

        .search-input-wrapper svg {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--earth-500, #b8a98e);
        }

        .search-input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          border: 2px solid transparent;
          border-radius: 50px;
          background: rgba(255, 255, 255, 0.8);
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--forest-400, #a8c5a8);
          background: white;
          box-shadow: 0 0 0 3px rgba(168, 197, 168, 0.2);
        }

        /* Filtres en pilules */
        .filter-pills {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .filter-pill {
          padding: 0.5rem 1.25rem;
          border: 2px solid var(--earth-200, #ebe5da);
          border-radius: 50px;
          background: rgba(255, 255, 255, 0.6);
          color: var(--earth-700, #8b7a5d);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-pill:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: scale(1.05);
        }

        .filter-pill.active {
          background: var(--forest-500, #8bb58b);
          color: white;
          border-color: var(--forest-500, #8bb58b);
        }

        /* Grille de produits */
        .products-garden {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
          animation: float-in 0.8s ease-out 0.2s both;
        }

        /* Carte produit organique */
        .product-card {
          padding: 0;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .product-card:hover {
          transform: translateY(-4px) rotate(-0.5deg);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
        }

        .card-accent {
          height: 4px;
          background: linear-gradient(90deg, 
            var(--forest-400, #a8c5a8) 0%, 
            var(--mushroom, #d4a574) 50%, 
            var(--earth-400, #ccc0aa) 100%);
          opacity: 0.7;
        }

        .card-content {
          padding: 1.5rem;
        }

        .product-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .product-emoji {
          font-size: 1.5rem;
        }

        .product-name {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--forest-800, #2d5a2d);
          margin: 0;
        }

        .product-meta {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .category-badge {
          padding: 0.25rem 0.75rem;
          background: rgba(168, 197, 168, 0.2);
          color: var(--forest-700, #4a7c4a);
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .quantity {
          font-weight: 600;
          color: var(--earth-700, #8b7a5d);
        }

        .expiry-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .expiry-label {
          margin-left: auto;
          font-weight: 600;
        }

        /* État vide */
        .empty-state {
          grid-column: 1 / -1;
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .empty-state h3 {
          color: var(--forest-700, #4a7c4a);
          font-size: 1.25rem;
          margin: 0;
        }

        .empty-state p {
          color: var(--earth-600, #a39274);
          max-width: 400px;
          margin: 0;
        }

        /* Loading */
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: 1rem;
          color: var(--forest-600, #6b9d6b);
        }

        .loading-spinner {
          animation: spin 2s linear infinite;
        }

        /* Animations */
        @keyframes float-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .pantry-container {
            padding: 1rem;
          }

          .title-section h1 {
            font-size: 1.5rem;
          }

          .header-main {
            flex-direction: column;
            gap: 1.5rem;
          }

          .stats-bubbles {
            width: 100%;
            justify-content: space-between;
          }

          .stat-bubble {
            padding: 0.75rem 1rem;
          }

          .stat-value {
            font-size: 1.25rem;
          }

          .products-garden {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .stats-bubbles {
            flex-direction: column;
          }

          .filter-pills {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
