import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Search, Calendar, Package, MapPin, ChevronDown, Info } from 'lucide-react';

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
    qty_remaining: 1,
    initial_qty: 1,
    unit: '',
    storage_place: '',
    storage_method: 'fridge',
    acquired_on: new Date().toISOString().split('T')[0],
    expiration_date: '',
    notes: ''
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isCustomItem, setIsCustomItem] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);
  
  // Traite les données des aliments canoniques pour la recherche
  const processedFoods = useMemo(() => {
    return canonicalFoods.map(item => {
      // Parse les keywords selon leur format dans Supabase
      let keywordsArray = [];
      
      if (item.keywords) {
        if (Array.isArray(item.keywords)) {
          // Si c'est déjà un array (depuis Supabase)
          keywordsArray = item.keywords;
        } else if (typeof item.keywords === 'string') {
          // Si c'est une string JSON (depuis CSV export)
          try {
            if (item.keywords.startsWith('[')) {
              keywordsArray = JSON.parse(item.keywords);
            } else if (item.keywords.startsWith('{')) {
              // Format PostgreSQL array {mot1,mot2}
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
      
      // Recherche floue pour les fautes de frappe (3+ caractères)
      if (score === 0 && query.length >= 3) {
        const similarity = calculateSimilarity(name, query.toLowerCase());
        if (similarity > 0.6) {
          score += Math.floor(similarity * 20);
        }
      }
      
      return { food, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score);
    
    // Retourne TOUS les résultats trouvés, pas de limite artificielle
    return scored.map(({ food }) => food);
  }, [processedFoods]);

  // Calcul de similarité simple (Dice coefficient)
  const calculateSimilarity = (str1, str2) => {
    const getBigrams = (str) => {
      const bigrams = [];
      for (let i = 0; i < str.length - 1; i++) {
        bigrams.push(str.slice(i, i + 2));
      }
      return bigrams;
    };
    
    const bigrams1 = getBigrams(str1);
    const bigrams2 = getBigrams(str2);
    
    if (bigrams1.length === 0 || bigrams2.length === 0) return 0;
    
    let matches = 0;
    bigrams1.forEach(bigram => {
      if (bigrams2.includes(bigram)) matches++;
    });
    
    return (2 * matches) / (bigrams1.length + bigrams2.length);
  };

  // Obtenir les suggestions filtrées
  const filteredSuggestions = useMemo(() => {
    const results = searchFoods(searchQuery);
    console.log(`Recherche "${searchQuery}": ${results.length} résultats trouvés`);
    return results;
  }, [searchQuery, searchFoods]);

  // Obtenir la catégorie d'un aliment
  const getFoodCategory = (food) => {
    return categories.find(cat => cat.id === food.category_id);
  };

  // Calculer la date d'expiration par défaut
  const calculateDefaultExpiry = (food, storageMethod) => {
    const today = new Date();
    let daysToAdd = 7; // Par défaut
    
    if (food) {
      switch(storageMethod) {
        case 'pantry':
          daysToAdd = food.shelf_life_days_pantry || 30;
          break;
        case 'fridge':
          daysToAdd = food.shelf_life_days_fridge || 7;
          break;
        case 'freezer':
          daysToAdd = food.shelf_life_days_freezer || 90;
          break;
      }
    }
    
    today.setDate(today.getDate() + daysToAdd);
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    setShowSuggestions(searchQuery.length > 0);
    setHighlightedIndex(-1);
  }, [searchQuery]);

  // Mettre à jour la date d'expiration quand on change de méthode de stockage
  useEffect(() => {
    if (selectedFood && formData.storage_method) {
      setFormData(prev => ({
        ...prev,
        expiration_date: calculateDefaultExpiry(selectedFood, formData.storage_method)
      }));
    }
  }, [formData.storage_method, selectedFood]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setFormData(prev => ({
      ...prev,
      foodItemName: value,
      canonical_food_id: null,
      unit: ''
    }));
    setSelectedFood(null);
    setIsCustomItem(true);
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
    setIsCustomItem(false);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < Math.min(filteredSuggestions.length - 1, 19) ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : Math.min(filteredSuggestions.length - 1, 19)
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredSuggestions.length) {
          selectFoodItem(filteredSuggestions[highlightedIndex]);
        } else if (filteredSuggestions.length === 1) {
          selectFoodItem(filteredSuggestions[0]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.foodItemName.trim()) {
      alert('Veuillez entrer un nom d\'aliment');
      return;
    }
    
    if (!formData.storage_place) {
      alert('Veuillez sélectionner un emplacement');
      return;
    }
    
    // Préparer les données pour Supabase
    const submitData = {
      canonical_food_id: formData.canonical_food_id,
      qty_remaining: parseFloat(formData.qty_remaining),
      initial_qty: parseFloat(formData.initial_qty || formData.qty_remaining),
      unit: formData.unit || 'unité',
      storage_method: formData.storage_method,
      storage_place: formData.storage_place,
      acquired_on: formData.acquired_on,
      expiration_date: formData.expiration_date || null,
      notes: formData.notes || null,
      // Si c'est un article personnalisé, on devra le gérer différemment
      isCustom: isCustomItem,
      customName: isCustomItem ? formData.foodItemName : null
    };
    
    onSubmit(submitData);
  };

  // Fonction pour mettre en surbrillance les termes recherchés
  const highlightMatch = (text, query) => {
    if (!query) return text;
    
    const terms = query.toLowerCase().split(/\s+/);
    let result = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    });
    
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Ajouter à l'inventaire</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recherche d'aliment */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="inline w-4 h-4 mr-1" />
              Aliment
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Rechercher un aliment..."
              autoFocus
            />
            
            {/* Suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="p-2 text-xs text-gray-500 border-b">
                  {filteredSuggestions.length} résultat{filteredSuggestions.length > 1 ? 's' : ''} trouvé{filteredSuggestions.length > 1 ? 's' : ''}
                </div>
                {filteredSuggestions.slice(0, 20).map((item, index) => {
                  const category = getFoodCategory(item);
                  return (
                    <div
                      key={item.id}
                      onClick={() => selectFoodItem(item)}
                      className={`px-3 py-2 cursor-pointer transition-colors ${
                        highlightedIndex === index ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">
                        {highlightMatch(item.canonical_name, searchQuery)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {category && (
                          <span className="inline-block px-2 py-0.5 bg-gray-100 rounded mr-2">
                            {category.name}
                          </span>
                        )}
                        {item.subcategory && (
                          <span className="text-gray-400">{item.subcategory}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredSuggestions.length > 20 && (
                  <div className="p-2 text-xs text-gray-500 border-t text-center">
                    ... et {filteredSuggestions.length - 20} autres résultats
                  </div>
                )}
              </div>
            )}
            
            {showSuggestions && filteredSuggestions.length === 0 && searchQuery.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3">
                <p className="text-sm text-gray-500">
                  Aucun résultat trouvé. L'article sera ajouté comme produit personnalisé.
                </p>
              </div>
            )}
          </div>

          {/* Info sur l'aliment sélectionné */}
          {selectedFood && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex items-start">
                <Info className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">{selectedFood.canonical_name}</p>
                  <p className="text-blue-700 mt-1">
                    Conservation : {selectedFood.shelf_life_days_pantry && `Garde-manger: ${selectedFood.shelf_life_days_pantry}j`}
                    {selectedFood.shelf_life_days_fridge && ` • Frigo: ${selectedFood.shelf_life_days_fridge}j`}
                    {selectedFood.shelf_life_days_freezer && ` • Congélateur: ${selectedFood.shelf_life_days_freezer}j`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quantité et unité */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantité
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={formData.qty_remaining}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  qty_remaining: e.target.value,
                  initial_qty: e.target.value 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unité
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="kg, L, unité..."
                required
              />
            </div>
          </div>

          {/* Méthode de stockage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Package className="inline w-4 h-4 mr-1" />
              Méthode de stockage
            </label>
            <select
              value={formData.storage_method}
              onChange={(e) => setFormData(prev => ({ ...prev, storage_method: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="fridge">Réfrigérateur</option>
              <option value="freezer">Congélateur</option>
              <option value="pantry">Garde-manger</option>
            </select>
          </div>

          {/* Emplacement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="inline w-4 h-4 mr-1" />
              Emplacement
            </label>
            <select
              value={formData.storage_place}
              onChange={(e) => setFormData(prev => ({ ...prev, storage_place: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'acquisition
              </label>
              <input
                type="date"
                value={formData.acquired_on}
                onChange={(e) => setFormData(prev => ({ ...prev, acquired_on: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />
                Date d'expiration
              </label>
              <input
                type="date"
                value={formData.expiration_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expiration_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows="2"
              placeholder="Informations supplémentaires..."
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddForm;
