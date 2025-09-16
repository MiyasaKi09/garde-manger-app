import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, X } from 'lucide-react';

const AddForm = ({ 
  onClose, 
  onSubmit, 
  locations = [], 
  canonicalFoods = [], // Données de canonical_foods
  categories = [] // Données de reference_categories
}) => {
  const [formData, setFormData] = useState({
    canonical_food_id: null,
    foodItemName: '',
    quantity: 1,
    unit: '',
    storage_method: 'Réfrigérateur',
    storage_place: '',
    acquired_on: new Date().toISOString().split('T')[0],
    expiration_date: '',
    notes: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  
  // Traite les données des aliments canoniques pour la recherche
  const processedFoods = useMemo(() => {
    return canonicalFoods.map(item => {
      // Parse les keywords selon leur format dans Supabase
      let keywordsArray = [];
      
      if (item.keywords) {
        if (Array.isArray(item.keywords)) {
          keywordsArray = item.keywords;
        } else if (typeof item.keywords === 'string') {
          try {
            if (item.keywords.startsWith('[')) {
              keywordsArray = JSON.parse(item.keywords);
            } else if (item.keywords.startsWith('{')) {
              keywordsArray = item.keywords.slice(1, -1).split(',');
            } else {
              keywordsArray = [item.keywords];
            }
          } catch (e) {
            keywordsArray = [item.keywords];
          }
        }
      }
      
      // Créer un champ de recherche unifié
      const searchField = `${item.canonical_name} ${keywordsArray.join(' ')} ${item.subcategory || ''}`.toLowerCase();
      
      return {
        ...item,
        keywords_parsed: keywordsArray,
        search_field: searchField
      };
    });
  }, [canonicalFoods]);

  // Fonction de recherche améliorée qui recherche dans TOUTE la base
  const searchFoods = useCallback((query) => {
    if (!query || query.length < 1) return [];
    
    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    
    // Score chaque aliment
    const scored = processedFoods.map(food => {
      let score = 0;
      const name = food.canonical_name?.toLowerCase() || '';
      
      // Recherche dans le nom
      searchTerms.forEach(term => {
        if (name === term) score += 100;
        else if (name.startsWith(term)) score += 50;
        else if (name.includes(term)) score += 25;
        
        // Recherche dans les keywords
        food.keywords_parsed.forEach(keyword => {
          const kw = keyword.toLowerCase();
          if (kw === term) score += 80;
          else if (kw.startsWith(term)) score += 40;
          else if (kw.includes(term)) score += 20;
        });
        
        // Recherche dans la sous-catégorie
        const subcat = (food.subcategory || '').toLowerCase();
        if (subcat.includes(term)) score += 15;
      });
      
      // Bonus si tous les termes matchent
      const allTermsMatch = searchTerms.every(term => 
        food.search_field.includes(term)
      );
      if (allTermsMatch) score += 30;
      
      return { food, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
    
    // Retourne TOUS les résultats trouvés
    return scored.map(({ food }) => food);
  }, [processedFoods]);

  // Obtenir les suggestions filtrées
  const filteredSuggestions = useMemo(() => {
    return searchFoods(searchQuery);
  }, [searchQuery, searchFoods]);

  // Calculer la date d'expiration par défaut
  const calculateDefaultExpiry = (food, storageMethod) => {
    const today = new Date();
    let daysToAdd = 7; // Par défaut
    
    if (food) {
      const method = storageMethod?.toLowerCase();
      if (method?.includes('réfrig') || method?.includes('frigo')) {
        daysToAdd = food.shelf_life_days_fridge || 7;
      } else if (method?.includes('congél') || method?.includes('freez')) {
        daysToAdd = food.shelf_life_days_freezer || 90;
      } else if (method?.includes('garde') || method?.includes('pantry')) {
        daysToAdd = food.shelf_life_days_pantry || 30;
      }
    }
    
    today.setDate(today.getDate() + daysToAdd);
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    setShowSuggestions(searchQuery.length > 0 && filteredSuggestions.length > 0);
  }, [searchQuery, filteredSuggestions]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setFormData(prev => ({
      ...prev,
      foodItemName: value,
      canonical_food_id: null
    }));
    setSelectedFood(null);
  };

  const selectFoodItem = (food) => {
    setFormData(prev => ({
      ...prev,
      canonical_food_id: food.id,
      foodItemName: food.canonical_name,
      unit: food.primary_unit || 'unité',
      expiration_date: calculateDefaultExpiry(food, prev.storage_method)
    }));
    setSearchQuery(food.canonical_name);
    setSelectedFood(food);
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      canonical_food_id: formData.canonical_food_id,
      qty_remaining: parseFloat(formData.quantity),
      initial_qty: parseFloat(formData.quantity),
      unit: formData.unit || 'unité',
      storage_method: formData.storage_method.toLowerCase().replace('é', 'e').replace('î', 'i'),
      storage_place: formData.storage_place,
      acquired_on: formData.acquired_on,
      expiration_date: formData.expiration_date || null,
      notes: formData.notes || null,
      isCustom: !formData.canonical_food_id,
      customName: !formData.canonical_food_id ? formData.foodItemName : null
    };
    
    onSubmit(submitData);
  };

  return (
    <>
      {/* Overlay sombre */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Formulaire avec le style original */}
      <div 
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
        style={{
          backgroundColor: '#f5e6c8',
          borderRadius: '20px',
          padding: '24px',
          width: '450px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: '#2d3436' }}>
            Ajouter à l'inventaire
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:opacity-70 transition-opacity"
            style={{ background: 'none', border: 'none' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Champ de recherche avec icône */}
          <div className="relative mb-4">
            <Search 
              size={16} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Aliment
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Rechercher un aliment..."
              className="w-full pl-10 pr-3 py-2 rounded-lg border-0"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                outline: 'none'
              }}
              autoFocus
            />
            
            {/* Liste des suggestions */}
            {showSuggestions && (
              <div 
                className="absolute w-full mt-1 max-h-48 overflow-y-auto rounded-lg shadow-lg z-10"
                style={{ backgroundColor: 'white' }}
              >
                {filteredSuggestions.slice(0, 50).map(item => (
                  <div
                    key={item.id}
                    onClick={() => selectFoodItem(item)}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-sm">{item.canonical_name}</div>
                    {item.subcategory && (
                      <div className="text-xs text-gray-500">{item.subcategory}</div>
                    )}
                  </div>
                ))}
                {filteredSuggestions.length > 50 && (
                  <div className="px-3 py-2 text-xs text-gray-500 text-center border-t">
                    ... et {filteredSuggestions.length - 50} autres résultats
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantité */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Quantité
            </label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border-0"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                outline: 'none'
              }}
              required
            />
          </div>

          {/* Unité */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Unité
            </label>
            <input
              type="text"
              value={formData.unit}
              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              placeholder="kg, L, unité..."
              className="w-full px-3 py-2 rounded-lg border-0"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                outline: 'none'
              }}
            />
          </div>

          {/* Méthode de stockage */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Méthode de stockage
            </label>
            <select
              value={formData.storage_method}
              onChange={(e) => {
                setFormData(prev => ({ 
                  ...prev, 
                  storage_method: e.target.value,
                  expiration_date: selectedFood ? calculateDefaultExpiry(selectedFood, e.target.value) : prev.expiration_date
                }));
              }}
              className="w-full px-3 py-2 rounded-lg border-0"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                outline: 'none'
              }}
            >
              <option value="Réfrigérateur">Réfrigérateur</option>
              <option value="Congélateur">Congélateur</option>
              <option value="Garde-manger">Garde-manger</option>
            </select>
          </div>

          {/* Emplacement */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Emplacement
            </label>
            <select
              value={formData.storage_place}
              onChange={(e) => setFormData(prev => ({ ...prev, storage_place: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border-0"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                outline: 'none'
              }}
              required
            >
              <option value="">Sélectionner un emplacement</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date d'acquisition */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Date d'acquisition
            </label>
            <input
              type="date"
              value={formData.acquired_on}
              onChange={(e) => setFormData(prev => ({ ...prev, acquired_on: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border-0"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                outline: 'none'
              }}
            />
          </div>

          {/* Date d'expiration */}
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Date d'expiration
            </label>
            <input
              type="date"
              value={formData.expiration_date}
              onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border-0"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                outline: 'none'
              }}
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Notes (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Informations supplémentaires..."
              rows="2"
              className="w-full px-3 py-2 rounded-lg border-0 resize-none"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                outline: 'none'
              }}
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg font-medium transition-all"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.6)',
                color: '#2d3436'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-all"
              style={{
                backgroundColor: '#6b9b7b'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a8a6a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6b9b7b'}
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AddForm;
