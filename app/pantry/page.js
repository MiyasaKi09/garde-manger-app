'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import SmartAddForm from './components/SmartAddForm';
import ProductCard from './components/PantryProductCard';
import ConsumeModal from './components/ConsumeModal';
import { capitalizeProduct } from './components/pantryUtils';
import ConfirmDialog from '../../components/ConfirmDialog';
import EditLotForm from './components/EditLotForm';
import PantryTabs from './components/PantryTabs';
import RestesManager from '@/components/RestesManager';
import './pantry.css';


export default function PantryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('expiration'); // expiration, quantity, name
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showEditLot, setShowEditLot] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [itemToConsume, setItemToConsume] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, waste, stats
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);
      }
    });
  }, [router]);

  useEffect(() => {
    // Vérifier si on doit ouvrir l'onglet "restes" via URL
    const tab = searchParams.get('tab');
    if (tab === 'waste' || tab === 'restes') {
      setActiveTab('waste');
    }
  }, [searchParams]);

  useEffect(() => {
    loadPantryItems();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [items, searchTerm, statusFilter, sortBy, sortOrder]);

  function filterAndSortItems() {
    let filtered = [...items];

    // Filtrage par texte
    if (searchTerm) {
      filtered = filtered.filter(item =>
        (item.product_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut d'expiration
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.expiration_status === statusFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'expiration':
          // Tri par date d'expiration (les sans date à la fin)
          if (!a.expiration_date && !b.expiration_date) comparison = 0;
          else if (!a.expiration_date) comparison = 1;
          else if (!b.expiration_date) comparison = -1;
          else {
            const dateA = new Date(a.expiration_date);
            const dateB = new Date(b.expiration_date);
            comparison = dateA - dateB;
          }
          break;
          
        case 'quantity':
          // Tri par quantité (convertir tout en grammes pour comparer)
          const qtyA = getQuantityInGrams(a);
          const qtyB = getQuantityInGrams(b);
          comparison = qtyA - qtyB;
          break;
          
        case 'name':
          // Tri alphabétique par nom
          comparison = (a.product_name || '').localeCompare(b.product_name || '');
          break;
          
        case 'location':
          // Tri par emplacement
          comparison = (a.storage_place || '').localeCompare(b.storage_place || '');
          break;
          
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredItems(filtered);
  }

  // Fonction helper pour convertir les quantités en grammes pour comparaison
  function getQuantityInGrams(item) {
    const qty = item.qty_remaining || 0;
    const unit = (item.unit || '').toLowerCase();
    
    // Si on a des métadonnées pour conversion
    if (item.grams_per_unit && (unit === 'u' || unit === 'pièce' || unit === 'pièces')) {
      return qty * item.grams_per_unit;
    }
    
    // Conversion standard des unités
    switch (unit) {
      case 'kg': return qty * 1000;
      case 'g': return qty;
      case 'l': return qty * 1000; // Approximation pour liquides
      case 'ml': return qty; // Approximation
      case 'cl': return qty * 10; // Approximation
      default: return qty; // Unités ou autres
    }
  }

  async function loadPantryItems() {
    if (isLoading) return; // Éviter les chargements multiples
    
    setIsLoading(true);
    setLoading(true);
    try {
      
      // D'abord, essayons la version simple qui fonctionnait
      let { data, error } = await supabase
        .from('inventory_lots')
        .select('*')
        .order('expiration_date', { ascending: true, nullsLast: true });

      if (error) {
        console.error('Erreur lors du chargement des lots:', error);
        throw error;
      }
      

      
      // Enrichir avec les canonical_foods ET les archetypes
      if (data && data.length > 0) {
        // Récupérer les canonical_foods
        const canonicalIds = data
          .filter(item => item.canonical_food_id)
          .map(item => item.canonical_food_id);

        // Récupérer les archetypes
        const archetypeIds = data
          .filter(item => item.archetype_id)
          .map(item => item.archetype_id);

        let canonicalMap = {};
        let archetypeMap = {};

        // Charger canonical_foods
        if (canonicalIds.length > 0) {
          const { data: canonicalData, error: canonicalError } = await supabase
            .from('canonical_foods')
            .select('id, canonical_name, density_g_per_ml, unit_weight_grams, shelf_life_days_pantry')
            .in('id', canonicalIds);

          if (!canonicalError && canonicalData) {
            canonicalData.forEach(item => {
              canonicalMap[item.id] = item;
            });
          }
        }

        // Charger archetypes
        if (archetypeIds.length > 0) {
          const { data: archetypeData, error: archetypeError } = await supabase
            .from('archetypes')
            .select('id, name, shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer, open_shelf_life_days_pantry, open_shelf_life_days_fridge, open_shelf_life_days_freezer')
            .in('id', archetypeIds);

          if (!archetypeError && archetypeData) {
            archetypeData.forEach(item => {
              archetypeMap[item.id] = item;
            });
          }
        }

        // Enrichir les données
        data = data.map(item => {
          if (item.canonical_food_id && canonicalMap[item.canonical_food_id]) {
            return {
              ...item,
              canonical_foods: canonicalMap[item.canonical_food_id]
            };
          } else if (item.archetype_id && archetypeMap[item.archetype_id]) {
            return {
              ...item,
              archetypes: archetypeMap[item.archetype_id]
            };
          }
          return item;
        });
      }
      

      
      // Transformer les données - version simple d'abord
      const transformedData = (data || []).map(item => {
        let productName = 'Produit sans nom';

        // Déterminer le nom selon le type
        if (item.canonical_food_id && item.canonical_foods?.canonical_name) {
          productName = item.canonical_foods.canonical_name;
        } else if (item.archetype_id && item.archetypes?.name) {
          productName = item.archetypes.name;
        } else if (item.notes) {
          // Produit custom avec notes
          productName = item.notes.split('\n')[0]; // Première ligne des notes
        } else if (item.product_name) {
          productName = item.product_name;
        }

        const transformed = {
          ...item,
          product_name: productName,
          expiration_status: getExpirationStatus(item.expiration_date),
          days_until_expiration: getDaysUntilExpiration(item.expiration_date),
          // Métadonnées utilisant les vrais noms de colonnes
          grams_per_unit: item.canonical_foods?.unit_weight_grams || null,
          density_g_per_ml: item.canonical_foods?.density_g_per_ml || null,
          primary_unit: item.unit
        };

        // Log pour debug (optionnel)
        // console.log(`Produit transformé: "${transformed.product_name}"`);

        return transformed;
      });
      setItems(transformedData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setItems([]);
    } finally {
      setLoading(false);
      setIsLoading(false);
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



  // Ouvrir le modal de consommation
  function handleConsume(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setItemToConsume(item);
    setShowConsumeModal(true);
  }

  // Fonction de consommation réelle (appelée depuis le modal)
  async function handleConsumeConfirm(quantity, unit) {
    const item = itemToConsume;
    if (!item) return;

    // Si le produit est containerisé, utiliser la fonction de fractionnement
    if (item.is_containerized && item.container_size && item.container_unit) {
      try {
        // Appeler la fonction PostgreSQL pour fractionner le lot
        const { data, error } = await supabase.rpc('split_containerized_lot', {
          p_lot_id: item.id,
          p_quantity_consumed: quantity,
          p_consumed_unit: unit
        });

        if (error) {
          console.error('Erreur lors du fractionnement:', error);
          alert('Erreur lors de la consommation: ' + error.message);
          return;
        }

        // Afficher le message de résultat
        if (data && data.length > 0 && data[0].message) {
          console.log('✅ Consommation:', data[0].message);
          alert(data[0].message);
        }

        // Recharger les items pour refléter les changements
        await loadPantryItems();

      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la consommation');
      }
      return;
    }

    // Logique classique pour produits non-containerisés
    const newQty = Math.max(0, Math.round((item.qty_remaining - quantity) * 100) / 100);

    // Si la quantité devient 0, proposer la suppression
    if (newQty === 0) {
      handleDeleteClick(item.id);
      return;
    }

    // Mise à jour optimiste
    setItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, qty_remaining: newQty } : i
    ));

    try {
      const { error } = await supabase
        .from('inventory_lots')
        .update({ qty_remaining: newQty })
        .eq('id', item.id);

      if (error) {
        console.error('Erreur lors de la consommation:', error);
        // Revertir en cas d'erreur
        await loadPantryItems();
      }
    } catch (error) {
      console.error('Erreur:', error);
      await loadPantryItems();
    }
  }

  function handleEdit(id) {
    const item = items.find(i => i.id === id);
    if (item) {
      setItemToEdit(item);
      setShowEditLot(true);
    }
  }

  async function handleUpdateLot(id, updates) {
    console.log('Mise à jour lot:', { id, updates });
    
    // Fermer le modal d'édition
    setShowEditLot(false);
    setItemToEdit(null);
    
    // Mise à jour locale immédiate pour une UX fluide
    setItems(prev => prev.map(i => 
      i.id === id ? { 
        ...i, 
        qty_remaining: parseFloat(updates.qty_remaining),
        unit: updates.unit,
        storage_place: updates.storage_place,
        expiration_date: updates.expiration_date
      } : i
    ));
    
    try {
      const { error } = await supabase
        .from('inventory_lots')
        .update({
          qty_remaining: parseFloat(updates.qty_remaining),
          unit: updates.unit,
          storage_place: updates.storage_place,
          expiration_date: updates.expiration_date
        })
        .eq('id', id);

      if (error) {
        console.error('Erreur Supabase lors de la mise à jour:', error);
        throw error;
      }
      
      console.log('Mise à jour réussie en base de données');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour: ' + error.message);
      // Revertir la mise à jour locale en cas d'erreur
      await loadPantryItems();
    }
  }

  async function handleUpdateQuantity(id, newQty, newUnit) {
    // Pour les conversions rapides depuis les boutons
    return handleUpdateLot(id, { qty_remaining: newQty, unit: newUnit });
  }

  function handleDeleteClick(id) {
    const item = items.find(i => i.id === id);
    setItemToDelete(item);
    setShowConfirmDelete(true);
  }

  async function handleDeleteConfirm() {
    if (!itemToDelete) return;

    const id = itemToDelete.id;
    
    // Suppression optimiste immédiate
    setItems(prev => prev.filter(i => i.id !== id));

    try {
      const { error } = await supabase
        .from('inventory_lots')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        // Revertir la suppression optimiste en cas d'erreur
        await loadPantryItems();
        alert('Erreur lors de la suppression: ' + error.message);
      } else {
        console.log('Article supprimé avec succès');
      }
    } catch (error) {
      console.error('Erreur:', error);
      // Revertir la suppression optimiste
      await loadPantryItems();
    }
  }

  function handleFormClose() {
    setShowForm(false);
    loadPantryItems();
  }

  // Calculer les stats pour les tabs
  const tabStats = {
    totalProducts: items.length,
    atRiskCount: items.filter(i => 
      i.expiration_status === 'expired' || i.expiration_status === 'expiring_soon'
    ).length
  };

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
      {/* Onglets de navigation */}
      <PantryTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        stats={tabStats}
      />

      {/* Contenu selon l'onglet actif */}
      {activeTab === 'inventory' && (
        <>
          {/* Contrôles améliorés */}
          <div className="pantry-controls">
            {/* Ligne 1: Recherche et stats */}
            <div className="top-row">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              
              {/* Stats cliquables pour filtrage rapide */}
              <div className="stats-filter">
                <button 
                  className={`stat-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                  title="Afficher tous les articles"
                >
                  <span className="stat-number">{items.length}</span>
                  <span className="stat-label">TOUT</span>
                </button>
                <button 
                  className={`stat-filter-btn expired ${statusFilter === 'expired' ? 'active' : ''}`}
                  onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
                  title="Afficher uniquement les produits expirés"
                >
                  <span className="stat-number">{items.filter(i => i.expiration_status === 'expired').length}</span>
                  <span className="stat-label">EXPIRÉS</span>
                </button>
                <button 
                  className={`stat-filter-btn expiring ${statusFilter === 'expiring_soon' ? 'active' : ''}`}
                  onClick={() => setStatusFilter(statusFilter === 'expiring_soon' ? 'all' : 'expiring_soon')}
                  title="Afficher uniquement les produits qui expirent bientôt"
                >
                  <span className="stat-number">{items.filter(i => i.expiration_status === 'expiring_soon').length}</span>
                  <span className="stat-label">EXPIRE BIENTÔT</span>
                </button>
                <button 
                  className={`stat-filter-btn good ${statusFilter === 'good' ? 'active' : ''}`}
                  onClick={() => setStatusFilter(statusFilter === 'good' ? 'all' : 'good')}
                  title="Afficher uniquement les produits en bon état"
                >
                  <span className="stat-number">{items.filter(i => i.expiration_status === 'good').length}</span>
                  <span className="stat-label">BON ÉTAT</span>
                </button>
              </div>
            </div>

            {/* Ligne 2: Options de tri */}
            <div className="sort-controls">
              <span className="sort-label">Trier par :</span>
              
              <div className="sort-options">
                <button
                  className={`sort-btn ${sortBy === 'expiration' ? 'active' : ''}`}
                  onClick={() => {
                    if (sortBy === 'expiration') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('expiration');
                      setSortOrder('asc');
                    }
                  }}
                >
                  📅 Expiration {sortBy === 'expiration' && (sortOrder === 'asc' ? '↗️' : '↘️')}
                </button>
                
                <button
                  className={`sort-btn ${sortBy === 'quantity' ? 'active' : ''}`}
                  onClick={() => {
                    if (sortBy === 'quantity') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('quantity');
                      setSortOrder('desc'); // Par défaut: plus grosse quantité d'abord
                    }
                  }}
                >
                  📦 Quantité {sortBy === 'quantity' && (sortOrder === 'asc' ? '↗️' : '↘️')}
                </button>
                
                <button
                  className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                  onClick={() => {
                    if (sortBy === 'name') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('name');
                      setSortOrder('asc');
                    }
                  }}
                >
                  🔤 Nom {sortBy === 'name' && (sortOrder === 'asc' ? '↗️' : '↘️')}
                </button>
                
                <button
                  className={`sort-btn ${sortBy === 'location' ? 'active' : ''}`}
                  onClick={() => {
                    if (sortBy === 'location') {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy('location');
                      setSortOrder('asc');
                    }
                  }}
                >
                  📍 Emplacement {sortBy === 'location' && (sortOrder === 'asc' ? '↗️' : '↘️')}
                </button>
              </div>

              {/* Indicateur du nombre d'éléments filtrés */}
              {filteredItems.length !== items.length && (
                <span className="filter-count">
                  {filteredItems.length} / {items.length} articles
                </span>
              )}
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
                  onConsume={() => handleConsume(item.id)}
                  onEdit={() => handleEdit(item.id)}
                  onDelete={() => handleDeleteClick(item.id)}
                  onUpdateQuantity={handleUpdateQuantity}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* Onglet Gestion des Restes */}
      {activeTab === 'waste' && userId && (
        <RestesManager userId={userId} onActionComplete={loadPantryItems} />
      )}

      {/* Onglet Statistiques */}
      {activeTab === 'stats' && (
        <div className="stats-view">
          <div className="stats-content" style={{
            background: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <h2 style={{ marginBottom: '2rem', color: 'var(--forest-700)' }}>📊 Vue d'ensemble</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div className="stat-box">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--forest-700)' }}>{items.length}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--earth-600)' }}>Produits total</div>
              </div>
              
              <div className="stat-box">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔥</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                  {items.filter(i => i.expiration_status === 'expired').length}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--earth-600)' }}>Expirés</div>
              </div>
              
              <div className="stat-box">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏰</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f97316' }}>
                  {items.filter(i => i.expiration_status === 'expiring_soon').length}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--earth-600)' }}>Expire bientôt</div>
              </div>
              
              <div className="stat-box">
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>
                  {items.filter(i => i.expiration_status === 'good').length}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--earth-600)' }}>Bon état</div>
              </div>
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(255, 255, 255, 0.5)', borderRadius: '12px' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--forest-700)' }}>💡 Conseil</h3>
              <p style={{ color: 'var(--earth-700)', lineHeight: '1.6' }}>
                {tabStats.atRiskCount > 0 
                  ? `Vous avez ${tabStats.atRiskCount} produit(s) à risque. Consultez l'onglet "À Risque" pour des suggestions anti-gaspillage.`
                  : 'Excellent ! Aucun produit à risque pour le moment. Continuez comme ça ! 🎉'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'ajout - disponible sur tous les onglets */}
      {showForm && (
        <SmartAddForm
          open={showForm}
          onClose={handleFormClose}
          onLotCreated={handleFormClose}
        />
      )}

      {/* Modal de consommation */}
      <ConsumeModal
        item={itemToConsume}
        isOpen={showConsumeModal}
        onClose={() => {
          setShowConsumeModal(false);
          setItemToConsume(null);
        }}
        onConfirm={handleConsumeConfirm}
      />

      {/* Bouton flottant pour ajouter - disponible sur tous les onglets */}
      <button
        className="pantry-fab"
        onClick={() => setShowForm(true)}
        title="Ajouter un article"
      >
        +
      </button>

      {/* Dialog de confirmation de suppression */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => {
          setShowConfirmDelete(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Supprimer l'article"
        message={`Êtes-vous sûr de vouloir supprimer "${itemToDelete?.product_name}" ?`}
        confirmText="Supprimer"
        cancelText="Annuler"
      />

      {/* Modal d'édition complète */}
      {showEditLot && itemToEdit && (
        <EditLotForm
          item={itemToEdit}
          onUpdate={handleUpdateLot}
          onCancel={() => {
            setShowEditLot(false);
            setItemToEdit(null);
          }}
        />
      )}
    </div>
  );
}
