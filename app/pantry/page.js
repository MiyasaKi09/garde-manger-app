'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import SmartAddForm from './components/SmartAddForm';
import ProductCard from './components/PantryProductCard';
import { capitalizeProduct } from './components/pantryUtils';
import ConfirmDialog from '../../components/ConfirmDialog';
import EditLotForm from './components/EditLotForm';
import './pantry.css';


export default function PantryPage() {
  const router = useRouter();
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
    });
  }, [router]);

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
      

      
      // Maintenant essayons d'enrichir avec les canonical_foods seulement
      if (data && data.length > 0) {
        const canonicalIds = data
          .filter(item => item.product_type === 'canonical' && item.product_id)
          .map(item => item.product_id);
        

        
        if (canonicalIds.length > 0) {
          // Utiliser les vrais noms de colonnes de la base
          const { data: canonicalData, error: canonicalError } = await supabase
            .from('canonical_foods')
            .select('id, canonical_name, density_g_per_ml, unit_weight_grams, shelf_life_days_pantry')
            .in('id', canonicalIds);
          

          
          if (!canonicalError && canonicalData) {
            const canonicalMap = {};
            canonicalData.forEach(item => {
              canonicalMap[item.id] = item;
            });
            
            data = data.map(item => {
              if (item.product_type === 'canonical' && canonicalMap[item.product_id]) {
                return {
                  ...item,
                  canonical_foods: canonicalMap[item.product_id]
                };
              }
              return item;
            });
          }
        }
      }
      

      
      // Transformer les données - version simple d'abord
      const transformedData = (data || []).map(item => {
        let productName = 'Produit sans nom';
        
        // Déterminer le nom selon le type
        if (item.product_type === 'canonical' && item.canonical_foods?.canonical_name) {
          productName = item.canonical_foods.canonical_name;
        } else if (item.product_type === 'custom' && item.notes) {
          productName = item.notes;
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
        
        console.log(`Produit transformé: "${transformed.product_name}" (${item.product_type})`);
        
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



  // Fonction de consommation intelligente
  async function handleConsume(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    let reduction;
    const currentQty = item.qty_remaining;
    
    // Logique de réduction intelligente selon l'unité et la quantité
    if (item.unit === 'u') {
      reduction = 1;
    } else if (item.unit === 'kg') {
      if (currentQty >= 2) reduction = 0.5;      // 500g si on a plus de 2kg
      else if (currentQty >= 1) reduction = 0.2; // 200g si on a plus de 1kg
      else reduction = 0.1;                      // 100g sinon
    } else if (item.unit === 'g') {
      if (currentQty >= 1000) reduction = 100;   // 100g si on a plus de 1kg
      else if (currentQty >= 500) reduction = 50; // 50g si on a plus de 500g
      else if (currentQty >= 100) reduction = 20; // 20g si on a plus de 100g
      else reduction = 10;                       // 10g sinon
    } else if (item.unit === 'L') {
      if (currentQty >= 2) reduction = 0.5;      // 500ml si on a plus de 2L
      else if (currentQty >= 1) reduction = 0.2; // 200ml si on a plus de 1L
      else reduction = 0.1;                      // 100ml sinon
    } else if (item.unit === 'mL') {
      if (currentQty >= 1000) reduction = 100;   // 100ml si on a plus de 1L
      else if (currentQty >= 500) reduction = 50; // 50ml si on a plus de 500ml
      else reduction = 25;                       // 25ml sinon
    } else {
      reduction = 0.1; // Défaut
    }
    
    const newQty = Math.max(0, Math.round((currentQty - reduction) * 100) / 100);
    
    // Si la quantité devient 0, proposer la suppression
    if (newQty === 0) {
      handleDeleteClick(id);
      return;
    }
    
    // Mise à jour optimiste
    setItems(prev => prev.map(i => 
      i.id === id ? { ...i, qty_remaining: newQty } : i
    ));
    
    try {
      const { error } = await supabase
        .from('inventory_lots')
        .update({ qty_remaining: newQty })
        .eq('id', id);

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
