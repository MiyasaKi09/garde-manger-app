'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import './pantry.css'

export default function PantryPage() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentFilter, setCurrentFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({ fresh: 0, soon: 0, total: 0 })
  
  const supabase = createClientComponentClient()

  // Charger les données au démarrage
  useEffect(() => {
    loadAllData()
  }, [])

  // Mettre à jour les produits filtrés quand les filtres changent
  useEffect(() => {
    applyFilters()
  }, [products, currentFilter, searchTerm])

  // Fonction pour charger toutes les données
  async function loadAllData() {
    setLoading(true)
    try {
      // Récupérer les catégories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('sort_priority')

      // Récupérer les locations
      const { data: locationsData } = await supabase
        .from('locations')
        .select('*')
        .order('sort_order')

      // Récupérer les produits de l'utilisateur avec leurs informations canoniques
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: userProducts } = await supabase
          .from('user_food_items')
          .select(`
            *,
            canonical_food:canonical_food_item_id (
              *,
              category:categories(*)
            ),
            location:locations(*)
          `)
          .eq('user_id', user.id)
          .order('expiry_date', { ascending: true })

        setProducts(userProducts || [])
        calculateStats(userProducts || [])
      }

      setCategories(categoriesData || [])
      setLocations(locationsData || [])
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
    setLoading(false)
  }

  // Calculer les statistiques
  function calculateStats(productList) {
    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    
    const fresh = productList.filter(p => {
      if (!p.expiry_date) return true
      return new Date(p.expiry_date) > threeDaysFromNow
    }).length

    const soon = productList.filter(p => {
      if (!p.expiry_date) return false
      const expiryDate = new Date(p.expiry_date)
      return expiryDate <= threeDaysFromNow && expiryDate >= now
    }).length

    setStats({ fresh, soon, total: productList.length })
  }

  // Appliquer les filtres
  function applyFilters() {
    let filtered = [...products]

    // Filtre par catégorie
    if (currentFilter !== 'all') {
      if (currentFilter === 'soon') {
        const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(p => 
          p.expiry_date && new Date(p.expiry_date) <= threeDaysFromNow
        )
      } else if (currentFilter === 'expired') {
        filtered = filtered.filter(p => 
          p.expiry_date && new Date(p.expiry_date) < new Date()
        )
      } else {
        filtered = filtered.filter(p => 
          p.canonical_food?.category?.name === currentFilter
        )
      }
    }

    // Filtre par recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.product_name?.toLowerCase().includes(term) ||
        p.canonical_food?.canonical_name?.toLowerCase().includes(term) ||
        p.location?.name?.toLowerCase().includes(term)
      )
    }

    setFilteredProducts(filtered)
  }

  // Supprimer un produit
  async function deleteProduct(productId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return

    try {
      const { error } = await supabase
        .from('user_food_items')
        .delete()
        .eq('id', productId)

      if (error) throw error

      // Recharger les données
      loadAllData()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression du produit')
    }
  }

  // Formater la date d'expiration
  function formatExpiryDate(dateString) {
    if (!dateString) return 'Pas de DLC'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `Expiré depuis ${Math.abs(diffDays)} jour(s)`
    } else if (diffDays === 0) {
      return 'Expire aujourd\'hui'
    } else if (diffDays <= 3) {
      return `Expire dans ${diffDays} jour(s)`
    } else {
      return date.toLocaleDateString('fr-FR')
    }
  }

  // Obtenir la classe CSS pour l'urgence
  function getUrgencyClass(dateString) {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'expired'
    if (diffDays <= 3) return 'soon'
    return 'fresh'
  }

  if (loading) {
    return (
      <div className="pantry-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Chargement de votre garde-manger...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pantry-page">
      {/* En-tête avec statistiques */}
      <div className="pantry-header">
        <h1>🥫 Mon garde-manger</h1>
        <div className="stats-bar">
          <div className="stat fresh">
            <span className="number">{stats.fresh}</span>
            <span className="label">Frais</span>
          </div>
          <div className="stat soon">
            <span className="number">{stats.soon}</span>
            <span className="label">À consommer</span>
          </div>
          <div className="stat total">
            <span className="number">{stats.total}</span>
            <span className="label">Total</span>
          </div>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="filters-bar">
        <div className="filter-tabs">
          <button 
            className={currentFilter === 'all' ? 'active' : ''}
            onClick={() => setCurrentFilter('all')}
          >
            Tous ({stats.total})
          </button>
          <button 
            className={currentFilter === 'soon' ? 'active' : ''}
            onClick={() => setCurrentFilter('soon')}
          >
            À consommer ({stats.soon})
          </button>
          <button 
            className={currentFilter === 'expired' ? 'active' : ''}
            onClick={() => setCurrentFilter('expired')}
          >
            Expirés
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={currentFilter === cat.name ? 'active' : ''}
              onClick={() => setCurrentFilter(cat.name)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Liste des produits */}
      <div className="products-grid">
        {filteredProducts.length === 0 ? (
          <div className="empty-state">
            <p>Aucun produit trouvé.</p>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="btn-secondary">
                Effacer la recherche
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map(product => (
            <div key={product.id} className={`product-card ${getUrgencyClass(product.expiry_date)}`}>
              <div className="product-header">
                <h3 className="product-name">
                  {product.product_name || product.canonical_food?.canonical_name}
                </h3>
                <button 
                  onClick={() => deleteProduct(product.id)}
                  className="delete-btn"
                  title="Supprimer ce produit"
                >
                  ×
                </button>
              </div>

              <div className="product-info">
                <div className="quantity">
                  <strong>{product.quantity} {product.unit}</strong>
                </div>
                
                <div className="expiry">
                  {formatExpiryDate(product.expiry_date)}
                </div>

                <div className="location">
                  📍 {product.location?.name || 'Non défini'}
                </div>

                {product.canonical_food?.category && (
                  <div className="category">
                    🏷️ {product.canonical_food.category.name}
                  </div>
                )}

                {product.notes && (
                  <div className="notes">
                    💬 {product.notes}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
