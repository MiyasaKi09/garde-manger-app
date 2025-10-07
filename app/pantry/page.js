'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import SmartAddForm from './components/SmartAddForm';
import ProductCard from './components/PantryProductCard';
import { capitalizeProduct } from './components/pantryUtils';
import './pantry.css';


export default function PantryPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
      // Utiliser la vue pantry_view qui fonctionne déjà
      let { data, error } = await supabase
        .from('pantry_view')
        .select('*, unit_weight_grams, density_g_per_ml')
        .order('expiration_date', { ascending: true, nullsLast: true });

      // Fallback vers inventory_lots si pantry_view n'existe pas
      if (error && error.code === '42P01') {
        console.log('Vue pantry_view non trouvée, utilisation de inventory_lots');
        const result = await supabase
          .from('inventory_lots')
          .select('*, unit_weight_grams, density_g_per_ml')
          .order('expiration_date', { ascending: true, nullsLast: true });
        
        data = result.data;
        error = result.error;
        
        // Si on a des données, essayer d'enrichir avec les métadonnées
        if (data && data.length > 0) {
          const canonicalIds = data
            .filter(item => item.product_type === 'canonical' && item.product_id)
            .map(item => item.product_id);
          
          if (canonicalIds.length > 0) {
            const { data: canonicalData, error: canonicalError } = await supabase
              .from('canonical_foods')
              .select('id, canonical_name, density_g_per_ml, grams_per_unit, primary_unit')
              .in('id', canonicalIds);
            
            if (!canonicalError && canonicalData) {
              const metaMap = {};
              canonicalData.forEach(item => {
                metaMap[item.id] = item;
              });
              
              data = data.map(item => {
                if (item.product_type === 'canonical' && item.product_id && metaMap[item.product_id]) {
                  return {
                    ...item,
                    canonical_foods: metaMap[item.product_id]
                  };
                }
                return item;
              });
            }
          }
        }
      }
      
      // Fallback vers l'ancienne vue pantry si elle existe encore
      if (error && error.code === '42P01') {
        console.log('Vue pantry_view non trouvée, essai avec pantry');
        const result = await supabase
          .from('pantry')
          .select('*')
          .order('expiration_date', { ascending: true });
        
        data = result.data;
        error = result.error;
      }
      
      // Si ça ne marche toujours pas, utiliser inventory_lots directement
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
      
      // Debug : voir les données brutes
      console.log('Nombre de produits trouvés:', data?.length);
      console.log('Données brutes (première):', data?.[0]);
      
      // Transformer les données si nécessaire
      const transformedData = (data || []).map(item => {
        // Déterminer le nom du produit selon le type
        let productName = 'Produit sans nom';
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
          // Utiliser les vraies colonnes de la base de données
          grams_per_unit: item.unit_weight_grams || item.grams_per_unit || item.canonical_foods?.grams_per_unit,
          density_g_per_ml: item.density_g_per_ml || item.canonical_foods?.density_g_per_ml,
          primary_unit: item.primary_unit || item.canonical_foods?.primary_unit || item.unit
        };
        
        // Debug détaillé des métadonnées
        console.log(`Produit: "${transformed.product_name}"`, {
          unit_weight_grams: item.unit_weight_grams,
          density_g_per_ml: item.density_g_per_ml,
          unit: item.unit,
          qty_remaining: item.qty_remaining,
          final_grams_per_unit: transformed.grams_per_unit,
          final_density: transformed.density_g_per_ml
        });
        
        return transformed;
      });
      
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
      
      console.log('Mise à jour réussie, rechargement des données...');
      await loadPantryItems();
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      alert('Erreur lors de la conversion: ' + error.message);
      // Mise à jour locale en cas d'erreur
      setItems(prev => prev.map(i => 
        i.id === id ? { ...i, qty_remaining: parseFloat(newQty), unit: newUnit } : i
      ));
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cet article ?')) return;

    try {
      const { error } = await supabase
        .from('inventory_lots')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadPantryItems();
      alert('Article supprimé');
    } catch (error) {
      console.error('Erreur:', error);
      // Suppression locale en cas d'erreur
      setItems(prev => prev.filter(i => i.id !== id));
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
              onDelete={() => handleDelete(item.id)}
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
    </div>
  );
}
