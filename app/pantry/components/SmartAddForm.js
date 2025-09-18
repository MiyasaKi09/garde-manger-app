// app/pantry/components/SmartAddForm.js
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, X, Package, Home, Snowflake, Archive, Calendar } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import './SmartAddForm.css';

export default function SmartAddForm({ open, onClose, onLotCreated }) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const [lotData, setLotData] = useState({
    qty_remaining: 1,
    unit: 'unités',
    storage_method: 'pantry',
    storage_place: 'Garde-manger',
    expiration_date: ''
  });

  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const supabase = createClientComponentClient();

  // Reset quand on ouvre le modal
  useEffect(() => {
    if (open) {
      setStep(1);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedProduct(null);
      setLotData({
        qty_remaining: 1,
        unit: 'unités',
        storage_method: 'pantry',
        storage_place: 'Garde-manger',
        expiration_date: ''
      });
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Fonction pour calculer la date d'expiration par défaut
  const getDefaultExpirationDate = useCallback((product, storageMethod) => {
    let days = 7; // Par défaut
    
    if (product) {
      // Utiliser les données de durée de conservation selon le stockage
      if (storageMethod === 'fridge' || storageMethod === 'Réfrigérateur') {
        days = product.shelf_life_days_fridge || 7;
      } else if (storageMethod === 'freezer' || storageMethod === 'Congélateur') {
        days = product.shelf_life_days_freezer || 90;
      } else {
        days = product.shelf_life_days_pantry || 30;
      }
    }
    
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }, []);

  // Fonction d'incrémentation intelligente selon l'unité
  const getIncrementValue = (unit) => {
    switch(unit) {
      case 'kg':
        return 0.1;
      case 'g':
        return 100;
      case 'ml':
      case 'cl':
        return 100;
      case 'L':
        return 0.5;
      case 'unités':
      case 'pièce':
      default:
        return 0.5;
    }
  };

  // Fonction pour ajuster la quantité
  const adjustQuantity = (direction) => {
    const increment = getIncrementValue(lotData.unit);
    const currentQty = parseFloat(lotData.qty_remaining) || 0;
    let newQty;
    
    if (direction === 'up') {
      newQty = currentQty + increment;
    } else {
      newQty = Math.max(increment, currentQty - increment);
    }
    
    // Arrondir selon l'unité
    if (lotData.unit === 'kg') {
      newQty = Math.round(newQty * 10) / 10;
    } else if (lotData.unit === 'unités' || lotData.unit === 'pièce') {
      newQty = Math.round(newQty * 2) / 2; // Multiples de 0.5
    }
    
    setLotData(prev => ({ ...prev, qty_remaining: newQty }));
  };

  // Recherche de produits
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const q = query.trim().toLowerCase();
    
    try {
      // Rechercher dans les aliments canoniques
      const { data: canonicalFoods, error: canonicalError } = await supabase
        .from('canonical_foods')
        .select('*')
        .or(`canonical_name.ilike.%${q}%,keywords.cs.{${q}}`)
        .limit(10);

      if (canonicalError) throw canonicalError;

      const results = (canonicalFoods || []).map(food => ({
        id: food.id,
        name: food.canonical_name,
        type: 'canonical',
        category_id: food.category_id,
        primary_unit: food.primary_unit || 'unités',
        shelf_life_days_pantry: food.shelf_life_days_pantry,
        shelf_life_days_fridge: food.shelf_life_days_fridge,
        shelf_life_days_freezer: food.shelf_life_days_freezer,
        ...food
      }));

      setSearchResults(results);
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [supabase]);

  // Debounce de la recherche
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    
    // Mettre à jour avec l'unité préférée du produit
    const preferredUnit = product.primary_unit || 'unités';
    
    // Calculer la date d'expiration par défaut
    const defaultExpiration = getDefaultExpirationDate(product, lotData.storage_method);
    
    setLotData(prev => ({
      ...prev,
      unit: preferredUnit,
      qty_remaining: 1,
      expiration_date: defaultExpiration
    }));
    
    setStep(2);
  };

  const handleStorageMethodChange = (method) => {
    let place = 'Garde-manger';
    if (method === 'fridge') place = 'Réfrigérateur';
    if (method === 'freezer') place = 'Congélateur';
    
    // Recalculer la date d'expiration selon le nouveau mode de stockage
    const newExpiration = getDefaultExpirationDate(selectedProduct, method);
    
    setLotData(prev => ({
      ...prev,
      storage_method: method,
      storage_place: place,
      expiration_date: newExpiration
    }));
  };

  const handleCreateLot = async () => {
    if (!selectedProduct || !lotData.qty_remaining) {
      alert('Veuillez sélectionner un produit et entrer une quantité');
      return;
    }

    setLoading(true);
    
    try {
      // Obtenir l'utilisateur courant
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      const quantity = parseFloat(lotData.qty_remaining) || 0;
      
      // Préparer les données pour inventory_lots
      const lotDataToInsert = {
        qty_remaining: quantity,
        initial_qty: quantity,
        unit: lotData.unit,
        storage_method: lotData.storage_method,
        storage_place: lotData.storage_place,
        expiration_date: lotData.expiration_date || null,
        acquired_on: new Date().toISOString().split('T')[0],
        opened_on: null,
        produced_on: null,
        notes: '',
        source: 'manual',
        owner_id: user.id // Utiliser l'ID de l'utilisateur connecté
      };
      
      // Ajouter l'ID du produit selon le type
      if (selectedProduct.type === 'canonical') {
        lotDataToInsert.canonical_food_id = selectedProduct.id;
      }

      console.log('Création du lot avec owner_id:', lotDataToInsert);

      const { data: createdLot, error } = await supabase
        .from('inventory_lots')
        .insert([lotDataToInsert])
        .select()
        .single();

      if (error) {
        console.error('Erreur création:', error);
        // Message d'erreur plus spécifique selon le type d'erreur
        if (error.message.includes('row-level security')) {
          alert('Erreur de sécurité: Assurez-vous d\'être connecté pour ajouter des produits.');
        } else {
          alert(`Erreur: ${error.message}`);
        }
      } else {
        console.log('Lot créé avec succès:', createdLot);
        
        // Appeler la callback
        if (onLotCreated) {
          onLotCreated(createdLot);
        }
        
        // Fermer le modal
        onClose();
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title">
            <Plus size={20} />
            Ajouter un produit
          </div>
          <button onClick={onClose} className="close-btn">
            <X size={18} />
          </button>
        </div>

        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Produit</div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Quantité</div>
        </div>

        {step === 1 && (
          <div className="modal-body">
            <div className="search-section">
              <div className="search-input-wrapper">
                <Search size={18} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>

              {searchLoading && (
                <div className="search-loading">Recherche...</div>
              )}

              <div className="search-results">
                {searchResults.map((product) => (
                  <div
                    key={`${product.type}-${product.id}`}
                    className="product-item"
                    onClick={() => handleProductSelect(product)}
                  >
                    <Package size={16} />
                    <span>{product.name}</span>
                    <span className="product-category">
                      {product.subcategory || 'Général'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && selectedProduct && (
          <div className="modal-body">
            <div className="selected-product-card">
              <Package size={20} />
              <div>
                <div className="product-name">{selectedProduct.name}</div>
                <div className="product-category">
                  {selectedProduct.subcategory || 'Général'}
                </div>
              </div>
              <button onClick={() => setStep(1)} className="change-btn">
                Changer
              </button>
            </div>

            <div className="form-group">
              <label>Quantité actuelle</label>
              <div className="quantity-input-group">
                <button 
                  onClick={() => adjustQuantity('down')}
                  className="qty-btn"
                  type="button"
                >
                  −
                </button>
                <input
                  type="number"
                  value={lotData.qty_remaining}
                  onChange={(e) => setLotData(prev => ({
                    ...prev,
                    qty_remaining: parseFloat(e.target.value) || 0
                  }))}
                  className="qty-input"
                  step={getIncrementValue(lotData.unit)}
                  min={getIncrementValue(lotData.unit)}
                />
                <button 
                  onClick={() => adjustQuantity('up')}
                  className="qty-btn"
                  type="button"
                >
                  +
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Unité</label>
              <select
                value={lotData.unit}
                onChange={(e) => setLotData(prev => ({
                  ...prev,
                  unit: e.target.value,
                  qty_remaining: 1
                }))}
                className="unit-select"
              >
                <option value="unités">Unités</option>
                <option value="kg">Kilogrammes</option>
                <option value="g">Grammes</option>
                <option value="L">Litres</option>
                <option value="ml">Millilitres</option>
                <option value="cl">Centilitres</option>
              </select>
            </div>

            <div className="form-group">
              <label>📍 Méthode de stockage</label>
              <div className="storage-methods">
                <button
                  type="button"
                  className={`storage-btn ${lotData.storage_method === 'pantry' ? 'active' : ''}`}
                  onClick={() => handleStorageMethodChange('pantry')}
                >
                  <Home size={18} />
                  Garde-manger
                </button>
                <button
                  type="button"
                  className={`storage-btn ${lotData.storage_method === 'fridge' ? 'active' : ''}`}
                  onClick={() => handleStorageMethodChange('fridge')}
                >
                  <Archive size={18} />
                  Réfrigérateur
                </button>
                <button
                  type="button"
                  className={`storage-btn ${lotData.storage_method === 'freezer' ? 'active' : ''}`}
                  onClick={() => handleStorageMethodChange('freezer')}
                >
                  <Snowflake size={18} />
                  Congélateur
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>
                <Calendar size={16} />
                Date de péremption
              </label>
              <input
                type="date"
                value={lotData.expiration_date}
                onChange={(e) => setLotData(prev => ({
                  ...prev,
                  expiration_date: e.target.value
                }))}
                className="date-input"
              />
            </div>
          </div>
        )}

        <div className="modal-footer">
          {step === 2 && (
            <>
              <button onClick={() => setStep(1)} className="btn-secondary">
                Retour
              </button>
              <button 
                onClick={handleCreateLot} 
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Création...' : 'Créer le lot'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

