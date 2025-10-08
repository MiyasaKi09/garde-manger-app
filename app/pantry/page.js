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
      // Charger tous les lots d'abord
      const { data: lotsData, error: lotsError } = await supabase
        .from('inventory_lots')
        .select('*')
        .order('expiration_date', { ascending: true, nullsLast: true });

      if (lotsError) {
        console.error('Erreur lors du chargement des lots:', lotsError);
        throw lotsError;
      }
      
      console.log('Nombre de lots trouvés:', lotsData?.length);
      
      let data = lotsData || [];
      
      // Enrichir avec les métadonnées selon le type de produit
      if (data.length > 0) {
        // Récupérer les IDs par type de produit
        const canonicalIds = data.filter(item => item.product_type === 'canonical' && item.product_id).map(item => item.product_id);
        const cultivarIds = data.filter(item => item.product_type === 'cultivar' && item.product_id).map(item => item.product_id);
        const archetypeIds = data.filter(item => item.product_type === 'archetype' && item.product_id).map(item => item.product_id);
        
        // Charger les métadonnées en parallèle avec héritage depuis canonical
        const [canonicalData, cultivarData, archetypeData] = await Promise.all([
          canonicalIds.length > 0 ? supabase
            .from('canonical_foods')
            .select('id, canonical_name, density_g_per_ml, grams_per_unit, primary_unit')
            .in('id', canonicalIds) : { data: [], error: null },
          cultivarIds.length > 0 ? supabase
            .from('cultivars')
            .select(`
              id, cultivar_name, density_g_per_ml, grams_per_unit, primary_unit,
              canonical_foods!canonical_food_id (
                canonical_name, density_g_per_ml, grams_per_unit, primary_unit
              )
            `)
            .in('id', cultivarIds) : { data: [], error: null },
          archetypeIds.length > 0 ? supabase
            .from('archetypes')
            .select(`
              id, archetype_name, density_g_per_ml, grams_per_unit, primary_unit,
              canonical_foods!canonical_food_id (
                canonical_name, density_g_per_ml, grams_per_unit, primary_unit
              )
            `)
            .in('id', archetypeIds) : { data: [], error: null }
        ]);
        
        // Créer des maps pour un accès rapide
        const canonicalMap = {};
        const cultivarMap = {};
        const archetypeMap = {};
        
        (canonicalData.data || []).forEach(item => canonicalMap[item.id] = item);
        (cultivarData.data || []).forEach(item => {
          // Pour les cultivars, fusionner avec les données canonical en héritant
          const canonical = item.canonical_foods;
          cultivarMap[item.id] = {
            ...item,
            // Utiliser les valeurs du cultivar si présentes, sinon hériter du canonical
            density_g_per_ml: item.density_g_per_ml || canonical?.density_g_per_ml,
            grams_per_unit: item.grams_per_unit || canonical?.grams_per_unit,
            primary_unit: item.primary_unit || canonical?.primary_unit,
            canonical_foods: canonical
          };
        });
        (archetypeData.data || []).forEach(item => {
          // Pour les archetypes, même logique d'héritage
          const canonical = item.canonical_foods;
          archetypeMap[item.id] = {
            ...item,
            density_g_per_ml: item.density_g_per_ml || canonical?.density_g_per_ml,
            grams_per_unit: item.grams_per_unit || canonical?.grams_per_unit,
            primary_unit: item.primary_unit || canonical?.primary_unit,
            canonical_foods: canonical
          };
        });
        
        // Enrichir les données des lots
        data = data.map(item => {
          if (item.product_type === 'canonical' && canonicalMap[item.product_id]) {
            return { ...item, canonical_foods: canonicalMap[item.product_id] };
          } else if (item.product_type === 'cultivar' && cultivarMap[item.product_id]) {
            return { ...item, cultivars: cultivarMap[item.product_id] };
          } else if (item.product_type === 'archetype' && archetypeMap[item.product_id]) {
            return { ...item, archetypes: archetypeMap[item.product_id] };
          }
          return item;
        });
      }
      
      console.log('Exemple de données enrichies:', data?.[0]);
      
      // Transformer les données si nécessaire
      const transformedData = (data || []).map(item => {
        // Déterminer le nom du produit selon le type
        let productName = 'Produit sans nom';
        let productMeta = null;
        
        if (item.product_type === 'canonical' && item.canonical_foods?.canonical_name) {
          productName = item.canonical_foods.canonical_name;
          productMeta = item.canonical_foods;
        } else if (item.product_type === 'cultivar' && item.cultivars?.cultivar_name) {
          productName = item.cultivars.cultivar_name;
          productMeta = item.cultivars;
        } else if (item.product_type === 'archetype' && item.archetypes?.archetype_name) {
          productName = item.archetypes.archetype_name;
          productMeta = item.archetypes;
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
          // Utiliser les métadonnées avec héritage
          grams_per_unit: productMeta?.grams_per_unit || item.unit_weight_grams || item.grams_per_unit,
          density_g_per_ml: productMeta?.density_g_per_ml || item.density_g_per_ml,
          primary_unit: productMeta?.primary_unit || item.primary_unit || item.unit
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
