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
              canonical_name,
              category_id,
              subcategory,
              primary_unit,
              shelf_life_days_pantry,
              shelf_life_days_fridge,
              shelf_life_days_freezer
            ),
            location:location_id (
              name,
              icon
            )
          `)
          .eq('user_id', user.id)
          .order('expiry_date', { ascending: true })

        // Enrichir les produits avec les infos de catégorie
        const enrichedProducts = await Promise.all(userProducts?.map(async (product) => {
          // Récupérer la catégorie
          const { data: category } = await supabase
            .from('categories')
            .select('*')
            .eq('id', product.canonical_food?.category_id)
            .single()

          // Calculer les jours restants
          const today = new Date()
          const expiryDate = new Date(product.expiry_date)
          const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
          
          // Déterminer la durée de conservation max selon le lieu de stockage
          let maxDays = 30 // par défaut
          if (product.location?.name === 'Frigo') {
            maxDays = product.canonical_food?.shelf_life_days_fridge || 7
          } else if (product.location?.name === 'Congélateur') {
            maxDays = product.canonical_food?.shelf_life_days_freezer || 90
          } else {
            maxDays = product.canonical_food?.shelf_life_days_pantry || 30
          }

          return {
            ...product,
            category: category,
            daysLeft: daysLeft,
            maxDays: maxDays,
            percentage: (daysLeft / maxDays) * 100
          }
        }) || [])

        setProducts(enrichedProducts)
        setCategories(categoriesData || [])
        setLocations(locationsData || [])
        updateStats(enrichedProducts)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fonction pour appliquer les filtres
  function applyFilters() {
    let filtered = [...products]
    
    // Filtrer par catégorie
    if (currentFilter !== 'all' && currentFilter !== 'long') {
      filtered = filtered.filter(p => p.category?.id === currentFilter)
    }
    
    // Filtrer par conservation longue
    if (currentFilter === 'long') {
      filtered = filtered.filter(p => p.daysLeft > 30)
    }
    
    // Filtrer par recherche
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.canonical_food?.canonical_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.custom_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    setFilteredProducts(filtered)
    updateStats(filtered)
  }

  // Fonction pour mettre à jour les statistiques
  function updateStats(productsToCount) {
    const fresh = productsToCount.filter(p => p.percentage > 40).length
    const soon = productsToCount.filter(p => p.percentage <= 40 && p.percentage > 0).length
    const total = productsToCount.length
    
    setStats({ fresh, soon, total })
  }

  // Fonction pour filtrer par fraîcheur
  function filterByFreshness(freshness) {
    if (freshness === 'fresh') {
      setFilteredProducts(products.filter(p => p.percentage > 40))
    } else if (freshness === 'soon') {
      setFilteredProducts(products.filter(p => p.percentage <= 40 && p.percentage > 0))
    } else {
      setFilteredProducts(products)
    }
  }

  // Fonction pour actualiser les données
  async function refreshPantry() {
    await loadAllData()
  }

  // Fonction pour ajouter un produit
  function addProduct() {
    // Rediriger vers la page d'ajout ou ouvrir un modal
    window.location.href = '/add-product'
  }

  // Fonction pour obtenir la classe CSS de péremption
  function getExpiryClass(percentage) {
    if (percentage <= 20) return 'expiry-urgent'
    if (percentage <= 40) return 'expiry-soon'
    return 'expiry-fresh'
  }

  // Fonction pour obtenir le texte et l'icône de péremption
  function getExpiryInfo(product) {
    const percentage = product.percentage
    let text = `${product.daysLeft} jours restants`
    let icon = '✨'
    
    if (product.daysLeft < 0) {
      text = `Périmé depuis ${Math.abs(product.daysLeft)} jours`
      icon = '❌'
    } else if (percentage <= 20) {
      text = `À consommer rapidement (${product.daysLeft}j)`
      icon = '⚠️'
    } else if (percentage <= 40) {
      text = `À consommer bientôt (${product.daysLeft}j)`
      icon = '⏰'
    } else if (product.daysLeft > 365) {
      text = 'Longue conservation'
      icon = '🌟'
    }
    
    return { text, icon }
  }

  // Fonction pour ouvrir les détails d'un produit
  async function openProductDetails(productId) {
    // Rediriger vers la page de détails ou ouvrir un modal
    window.location.href = `/product/${productId}`
  }

  // Fonction pour supprimer un produit
  async function deleteProduct(productId, e) {
    e.stopPropagation() // Empêcher l'ouverture des détails
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      try {
        const { error } = await supabase
          .from('user_food_items')
          .delete()
          .eq('id', productId)
        
        if (!error) {
          await loadAllData() // Recharger les données
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">🌿</div>
        <p>Chargement de votre garde-manger...</p>
      </div>
    )
  }

  return (
    <>
      {/* Formes organiques en arrière-plan */}
      <div className="organic-bg">
        <div className="organic-shape shape1"></div>
        <div className="organic-shape shape2"></div>
        <div className="organic-shape shape3"></div>
        <div className="organic-shape shape4"></div>
      </div>

      {/* Navigation */}
      <nav>
        <div className="nav-container">
          <button className="nav-btn" onClick={() => window.location.href = '/'}>Accueil</button>
          <button className="nav-btn active">Garde-manger</button>
          <button className="nav-btn" onClick={() => window.location.href = '/recipes'}>Recettes</button>
          <button className="nav-btn" onClick={() => window.location.href = '/garden'}>Potager</button>
          <button className="nav-btn" onClick={() => window.location.href = '/planning'}>Planning</button>
          <button className="nav-btn" onClick={() => window.location.href = '/shopping'}>Courses</button>
          <button className="nav-btn" onClick={() => supabase.auth.signOut()}>Déconnexion</button>
        </div>
      </nav>

      {/* Container principal */}
      <div className="container">
        {/* Header avec stats */}
        <div className="header-section">
          <h1 className="header-title">
            <span>🌿</span> Mon garde-manger vivant
          </h1>
          <p className="header-subtitle">Cultivez l'harmonie entre vos réserves et la nature</p>
          
          <div className="stats-container">
            <div className="stat-card" onClick={() => filterByFreshness('fresh')}>
              <div className="stat-number">{stats.fresh}</div>
              <div className="stat-label">Frais</div>
            </div>
            <div className="stat-card" onClick={() => filterByFreshness('soon')}>
              <div className="stat-number">{stats.soon}</div>
              <div className="stat-label">À consommer</div>
            </div>
            <div className="stat-card" onClick={() => filterByFreshness('all')}>
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Produits</div>
            </div>
          </div>

          <div className="actions-container">
            <button className="action-btn btn-refresh" onClick={refreshPantry}>
              <span>🔄</span> Actualiser
            </button>
            <button className="action-btn btn-add" onClick={addProduct}>
              <span>➕</span> Ajouter
            </button>
          </div>
        </div>

        {/* Recherche et filtres */}
        <div className="search-section">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Rechercher dans le garde-manger..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filters-container">
            <button 
              className={`filter-btn ${currentFilter === 'all' ? 'active' : ''}`} 
              onClick={() => setCurrentFilter('all')}
            >
              <span className="filter-icon">📦</span> Tous
            </button>
            {categories.map(category => (
              <button 
                key={category.id}
                className={`filter-btn ${currentFilter === category.id ? 'active' : ''}`} 
                onClick={() => setCurrentFilter(category.id)}
              >
                <span className="filter-icon">{category.icon}</span> {category.name}
              </button>
            ))}
            <button 
              className={`filter-btn ${currentFilter === 'long' ? 'active' : ''}`} 
              onClick={() => setCurrentFilter('long')}
            >
              <span className="filter-icon">⏳</span> Longue conservation
            </button>
          </div>
        </div>

        {/* Grille de produits */}
        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <p>🌱 Aucun produit trouvé</p>
              <button onClick={addProduct} className="btn-add">
                Ajouter votre premier produit
              </button>
            </div>
          ) : (
            filteredProducts.map(product => {
              const expiryInfo = getExpiryInfo(product)
              const displayName = product.custom_name || product.canonical_food?.canonical_name || 'Produit'
              
              return (
                <div key={product.id} className="product-card" onClick={() => openProductDetails(product.id)}>
                  <div className="product-header">
                    <div className="product-info">
                      <h3 className="product-name">{displayName}</h3>
                      <div className="product-details">
                        <span className="product-detail">
                          <span>📦</span> {product.quantity} {product.unit || product.canonical_food?.primary_unit}
                        </span>
                        <span className="product-detail">
                          <span>{product.location?.icon || '📍'}</span> {product.location?.name}
                        </span>
                      </div>
                    </div>
                    <div className={`product-category-icon category-${product.category?.id}`}>
                      <span>{product.category?.icon}</span>
                    </div>
                  </div>
                  <div className="expiry-container">
                    <div className="expiry-visual">
                      <div 
                        className={`expiry-fill ${getExpiryClass(product.percentage)}`} 
                        style={{ width: `${Math.max(10, Math.min(100, product.percentage))}%` }}
                      >
                        <span className="expiry-text">{expiryInfo.text}</span>
                      </div>
                      <span className="expiry-icon">{expiryInfo.icon}</span>
                    </div>
                  </div>
                  <button 
                    className="delete-btn" 
                    onClick={(e) => deleteProduct(product.id, e)}
                    aria-label="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
