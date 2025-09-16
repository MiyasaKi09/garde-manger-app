import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Search, X, Plus, Calendar, Package, MapPin, ChevronDown } from 'lucide-react';

// Configuration Supabase - À remplacer par vos vraies clés
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const SmartAddForm = ({ onClose, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // États pour les données depuis Supabase
  const [canonicalFoods, setCanonicalFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [locations, setLocations] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);

  // Charger les données depuis Supabase au montage
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Charger les aliments canoniques
      const { data: foods, error: foodsError } = await supabase
        .from('canonical_foods')
        .select('id, canonical_name, primary_unit, category_id, shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer')
        .order('canonical_name');

      if (foodsError) throw foodsError;
      setCanonicalFoods(foods || []);

      // Charger les locations
      const { data: locs, error: locsError } = await supabase
        .from('locations')
        .select('id, name, icon')
        .order('sort_order');

      if (locsError) throw locsError;
      setLocations(locs || []);
      
      // Définir la location par défaut (Placard)
      if (locs && locs.length > 0) {
        const pantry = locs.find(l => l.name.toLowerCase().includes('placard')) || locs[0];
        setStorageLocation(pantry.id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  // Filtrer les aliments selon la recherche
  useEffect(() => {
    if (searchTerm.length > 1) {
      const filtered = canonicalFoods.filter(food =>
        food.canonical_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFoods(filtered.slice(0, 10)); // Limiter à 10 résultats
      setShowDropdown(true);
    } else {
      setFilteredFoods([]);
      setShowDropdown(false);
    }
  }, [searchTerm, canonicalFoods]);

  // Fermer les dropdowns quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectFood = (food) => {
    setSelectedFood(food);
    setSearchTerm(food.canonical_name);
    setUnit(food.primary_unit || 'u');
    setShowDropdown(false);
    
    // Calculer la date d'expiration par défaut selon le lieu de stockage
    const selectedLoc = locations.find(l => l.id === storageLocation);
    if (selectedLoc) {
      let daysToAdd = 7; // Par défaut
      
      if (selectedLoc.name.toLowerCase().includes('placard')) {
        daysToAdd = food.shelf_life_days_pantry || 30;
      } else if (selectedLoc.name.toLowerCase().includes('frigo')) {
        daysToAdd = food.shelf_life_days_fridge || 7;
      } else if (selectedLoc.name.toLowerCase().includes('congél')) {
        daysToAdd = food.shelf_life_days_freezer || 90;
      }
      
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + daysToAdd);
      setExpirationDate(expDate.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFood || !quantity || !storageLocation) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsLoading(true);
    
    try {
      const inventoryItem = {
        canonical_food_id: selectedFood.id,
        initial_qty: parseFloat(quantity),
        qty_remaining: parseFloat(quantity),
        unit: unit,
        storage_place: storageLocation,
        storage_method: getStorageMethod(storageLocation),
        acquired_on: new Date().toISOString().split('T')[0],
        expiration_date: expirationDate || null,
        notes: notes || null
      };

      const { data, error } = await supabase
        .from('inventory_lots')
        .insert([inventoryItem])
        .select()
        .single();

      if (error) throw error;

      // Appeler le callback parent avec les données complètes
      if (onAdd) {
        const fullData = {
          ...data,
          food_name: selectedFood.canonical_name,
          location_name: locations.find(l => l.id === storageLocation)?.name
        };
        onAdd(fullData);
      }

      // Réinitialiser le formulaire
      resetForm();
      
      // Fermer le formulaire après succès
      if (onClose) {
        setTimeout(() => onClose(), 500);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      alert(`Erreur lors de l'ajout: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStorageMethod = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    if (!location) return 'room_temperature';
    
    const name = location.name.toLowerCase();
    if (name.includes('congél')) return 'frozen';
    if (name.includes('frigo')) return 'refrigerated';
    return 'room_temperature';
  };

  const resetForm = () => {
    setSearchTerm('');
    setSelectedFood(null);
    setQuantity('');
    setUnit('');
    setExpirationDate('');
    setNotes('');
    // Garder la location par défaut
  };

  const selectedLocation = locations.find(l => l.id === storageLocation);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Ajouter un aliment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Recherche d'aliment */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aliment <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un aliment..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            {/* Dropdown des résultats */}
            {showDropdown && filteredFoods.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredFoods.map((food) => (
                  <button
                    key={food.id}
                    type="button"
                    onClick={() => handleSelectFood(food)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-none"
                  >
                    <div className="font-medium">{food.canonical_name}</div>
                    <div className="text-sm text-gray-500">
                      Unité: {food.primary_unit || 'u'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantité et unité */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unité
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg, L, u..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Lieu de stockage */}
          <div className="relative" ref={locationDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lieu de stockage <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span>{selectedLocation ? `${selectedLocation.icon} ${selectedLocation.name}` : 'Sélectionner...'}</span>
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>
            
            {showLocationDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                {locations.map((location) => (
                  <button
                    key={location.id}
                    type="button"
                    onClick={() => {
                      setStorageLocation(location.id);
                      setShowLocationDropdown(false);
                      
                      // Recalculer la date d'expiration si un aliment est sélectionné
                      if (selectedFood) {
                        handleSelectFood(selectedFood);
                      }
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-none flex items-center gap-2"
                  >
                    <span className="text-xl">{location.icon}</span>
                    <span>{location.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date d'expiration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date d'expiration
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes optionnelles..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedFood || !quantity}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Ajout...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Ajouter</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Composant de démonstration
export default function App() {
  const [showForm, setShowForm] = useState(false);
  const [items, setItems] = useState([]);

  const handleAddItem = (newItem) => {
    console.log('Nouvel item ajouté:', newItem);
    setItems([...items, newItem]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mon Pantry</h1>
        
        <button
          onClick={() => setShowForm(true)}
          className="mb-8 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Ajouter un aliment
        </button>

        {items.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Aliments ajoutés récemment</h2>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded">
                  <div className="font-medium">{item.food_name}</div>
                  <div className="text-sm text-gray-500">
                    {item.qty_remaining} {item.unit} - {item.location_name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {showForm && (
          <SmartAddForm 
            onClose={() => setShowForm(false)}
            onAdd={handleAddItem}
          />
        )}
      </div>
      
      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-4xl mx-auto">
        <p className="text-sm text-yellow-800">
          ⚠️ N'oubliez pas de remplacer <code className="bg-yellow-100 px-1">YOUR_SUPABASE_URL</code> et <code className="bg-yellow-100 px-1">YOUR_SUPABASE_ANON_KEY</code> par vos vraies clés Supabase !
        </p>
      </div>
    </div>
  );
}
