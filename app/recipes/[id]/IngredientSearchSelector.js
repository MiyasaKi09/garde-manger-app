'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';

// Fonction pour calculer la distance de Levenshtein (détection des fautes de frappe)
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
};

// Fonction de recherche intelligente
const searchIngredients = (query, ingredients) => {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase().trim();
  const results = [];
  
  ingredients.forEach(ingredient => {
    const name = ingredient.name.toLowerCase();
    const category = ingredient.category?.toLowerCase() || '';
    const subcategory = ingredient.subcategory?.toLowerCase() || '';
    
    let score = 0;
    let matchType = '';
    
    // Correspondance exacte
    if (name === searchTerm) {
      score = 100;
      matchType = 'exact';
    }
    // Commence par
    else if (name.startsWith(searchTerm)) {
      score = 90;
      matchType = 'prefix';
    }
    // Contient le terme
    else if (name.includes(searchTerm)) {
      score = 80;
      matchType = 'contains';
    }
    // Recherche par catégorie
    else if (category.includes(searchTerm) || subcategory.includes(searchTerm)) {
      score = 70;
      matchType = 'category';
    }
    // Faute de frappe (distance de Levenshtein)
    else {
      const distance = levenshteinDistance(searchTerm, name);
      if (distance <= 2 && searchTerm.length > 3) {
        score = 60 - (distance * 10);
        matchType = 'fuzzy';
      }
    }
    
    if (score > 0) {
      results.push({
        ...ingredient,
        score,
        matchType
      });
    }
  });
  
  // Trier par score descendant
  return results.sort((a, b) => b.score - a.score).slice(0, 20);
};

export default function IngredientSearchSelector({ 
  availableIngredients, 
  selectedIngredientId, 
  onIngredientSelect,
  placeholder = "Rechercher un ingrédient..."
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Charger l'ingrédient sélectionné
  useEffect(() => {
    if (selectedIngredientId) {
      const ingredient = availableIngredients.find(ing => ing.id === parseInt(selectedIngredientId));
      if (ingredient) {
        setSelectedIngredient(ingredient);
        setSearchTerm(ingredient.name);
      }
    } else {
      setSelectedIngredient(null);
      setSearchTerm('');
    }
  }, [selectedIngredientId, availableIngredients]);

  // Recherche intelligente
  const handleSearch = useCallback((query) => {
    setSearchTerm(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setIsOpen(false);
      return;
    }
    
    const results = searchIngredients(query, availableIngredients);
    setSearchResults(results);
    setIsOpen(true);
  }, [availableIngredients]);

  // Sélectionner un ingrédient
  const handleSelectIngredient = (ingredient) => {
    setSelectedIngredient(ingredient);
    setSearchTerm(ingredient.name);
    setIsOpen(false);
    onIngredientSelect(ingredient.id);
  };

  // Effacer la sélection
  const handleClear = () => {
    setSelectedIngredient(null);
    setSearchTerm('');
    setIsOpen(false);
    onIngredientSelect('');
    searchInputRef.current?.focus();
  };

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="ingredient-search-selector" ref={dropdownRef}>
      <div className="search-input-container">
        <Search className="search-icon" size={16} />
        <input
          ref={searchInputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (searchTerm.length >= 2) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className="search-input"
        />
        {selectedIngredient && (
          <button
            type="button"
            onClick={handleClear}
            className="clear-button"
            title="Effacer la sélection"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && searchResults.length > 0 && (
        <div className="search-dropdown">
          <div className="search-results">
            {searchResults.map((ingredient) => (
              <div
                key={ingredient.id}
                className="search-result-item"
                onClick={() => handleSelectIngredient(ingredient)}
              >
                <div className="ingredient-info">
                  <div className="ingredient-name">
                    {ingredient.name}
                  </div>
                  <div className="ingredient-details">
                    {ingredient.category}
                    {ingredient.subcategory && ` • ${ingredient.subcategory}`}
                  </div>
                </div>
                <div className="match-indicator">
                  {ingredient.matchType === 'exact' && '🎯'}
                  {ingredient.matchType === 'prefix' && '📍'}
                  {ingredient.matchType === 'contains' && '🔍'}
                  {ingredient.matchType === 'category' && '📂'}
                  {ingredient.matchType === 'fuzzy' && '💡'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isOpen && searchTerm.length >= 2 && searchResults.length === 0 && (
        <div className="search-dropdown">
          <div className="no-results">
            <div className="no-results-text">
              Aucun ingrédient trouvé pour "{searchTerm}"
            </div>
          </div>
        </div>
      )}
    </div>
  );
}