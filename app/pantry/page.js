'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import SmartAddForm from './components/SmartAddForm';
import ProductCard from './components/PantryProductCard';
import { capitalizeProduct } from './components/pantryUtils';
import ConfirmDialog from '../../components/ConfirmDialog';
import './pantry.css';


export default function PantryPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

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
      console.log('Début du chargement des données...');
      
      // D'abord, essayons la version simple qui fonctionnait
      let { data, error } = await supabase
        .from('inventory_lots')
        .select('*')
        .order('expiration_date', { ascending: true, nullsLast: true });

      if (error) {
        console.error('Erreur lors du chargement des lots:', error);
        throw error;
      }
      
      console.log('Nombre de lots trouvés:', data?.length);
      console.log('Premier lot:', data?.[0]);
      
      // Maintenant essayons d'enrichir avec les canonical_foods seulement
      if (data && data.length > 0) {
        const canonicalIds = data
          .filter(item => item.product_type === 'canonical' && item.product_id)
          .map(item => item.product_id);
        
        console.log('IDs canoniques à récupérer:', canonicalIds);
        
        if (canonicalIds.length > 0) {
          // Utiliser les vrais noms de colonnes de la base
          const { data: canonicalData, error: canonicalError } = await supabase
            .from('canonical_foods')
            .select('id, canonical_name, density_g_per_ml, unit_weight_grams')
            .in('id', canonicalIds);
          
          console.log('Données canonical_foods:', canonicalData);
          console.log('Erreur canonical_foods détaillée:', canonicalError);
          
          if (canonicalError) {
            console.error('Détails de l\'erreur:', {
              message: canonicalError.message,
              details: canonicalError.details,
              hint: canonicalError.hint,
              code: canonicalError.code
            });
          }
          
          if (!canonicalError && canonicalData) {
            console.log('Détail des données canonical récupérées:', canonicalData);
            
            const canonicalMap = {};
            canonicalData.forEach(item => {
              canonicalMap[item.id] = item;
              console.log(`Canonical ${item.id} (${item.canonical_name}):`, {
                density_g_per_ml: item.density_g_per_ml,
                unit_weight_grams: item.unit_weight_grams
              });
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
      
      
      console.log('Données après enrichissement:', data?.[0]);
      
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
      
      console.log('Données transformées:', transformedData.length);
      setItems(transformedData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setItems([]);
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
    console.log('Mise à jour quantité:', { id, newQty, newUnit });
    
    // Mise à jour locale immédiate pour une UX fluide
    setItems(prev => prev.map(i => 
      i.id === id ? { ...i, qty_remaining: parseFloat(newQty), unit: newUnit } : i
    ));
    
    try {
      const { error } = await supabase
        .from('inventory_lots')
        .update({ 
          qty_remaining: parseFloat(newQty),
          unit: newUnit
        })
        .eq('id', id);

      if (error) {
        console.error('Erreur Supabase lors de la mise à jour:', error);
        throw error;
      }
      
      console.log('Mise à jour réussie en base de données');
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      alert('Erreur lors de la conversion: ' + error.message);
      // Revertir la mise à jour locale en cas d'erreur
      await loadPantryItems();
    }
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
    </div>
  );
}
