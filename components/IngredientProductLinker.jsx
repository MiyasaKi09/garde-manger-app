'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function IngredientProductLinker({ 
  ingredient, 
  onUpdate 
}) {
  const [searchTerm, setSearchTerm] = useState(ingredient.note || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [specificity, setSpecificity] = useState(ingredient.product_specificity || 'any');
  const [currentProduct, setCurrentProduct] = useState(null);

  // Charger le produit actuel s'il existe
  useEffect(() => {
    loadCurrentProduct();
  }, [ingredient]);

  const loadCurrentProduct = async () => {
    if (ingredient.canonical_food_id || ingredient.generic_product_id || 
        ingredient.cultivar_id || ingredient.derived_product_id) {
      // Il y a déjà un produit lié
      setCurrentProduct({
        name: ingredient.note,
        linked: true
      });
    }
  };

  // Rechercher des produits
  const searchProducts = async () => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const results = [];

      // Recherche dans canonical_foods
      const { data: canonical } = await supabase
        .from('canonical_foods')
        .select('id, canonical_name')
        .ilike('canonical_name', `%${searchTerm}%`)
        .limit(5);
      
      if (canonical) {
        results.push(...canonical.map(p => ({
          id: p.id,
          name: p.canonical_name,
          type: 'canonical',
          badge: '🌱'
        })));
      }

      // Recherche dans generic_products
      const { data: generic } = await supabase
        .from('generic_products')
        .select('id, name')
        .ilike('name', `%${searchTerm}%`)
        .limit(5);
      
      if (generic) {
        results.push(...generic.map(p => ({
          id: p.id,
          name: p.name,
          type: 'generic',
          badge: '📦'
        })));
      }

      setSuggestions(results);
      setShowDropdown(true);
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recherche avec délai
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm && !currentProduct?.linked) {
        searchProducts();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Lier un produit
  const linkProduct = async (product) => {
    try {
      const updates = {
        canonical_food_id: null,
        generic_product_id: null,
        cultivar_id: null,
        derived_product_id: null,
        product_specificity: specificity,
        note: product.name
      };

      // Définir le bon ID
      if (product.type === 'canonical') {
        updates.canonical_food_id = product.id;
      } else if (product.type === 'generic') {
        updates.generic_product_id = product.id;
      }

      const { error } = await supabase
        .from('recipe_ingredients')
        .update(updates)
        .eq('id', ingredient.id);

      if (error) throw error;

      setCurrentProduct({ name: product.name, linked: true });
      setShowDropdown(false);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la liaison');
    }
  };

  // Délier le produit
  const unlinkProduct = async () => {
    try {
      const { error } = await supabase
        .from('recipe_ingredients')
        .update({
          canonical_food_id: null,
          generic_product_id: null,
          cultivar_id: null,
          derived_product_id: null,
          product_specificity: null
        })
        .eq('id', ingredient.id);

      if (error) throw error;
      
      setCurrentProduct(null);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {currentProduct?.linked ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          background: '#e8f5e9',
          borderRadius: '8px',
          border: '1px solid #4caf50'
        }}>
          <span>✅ {currentProduct.name}</span>
          <button
            onClick={unlinkProduct}
            style={{
              marginLeft: 'auto',
              padding: '0.25rem 0.5rem',
              background: '#ff5252',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Délier
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => searchTerm && searchProducts()}
              placeholder="Taper pour rechercher un produit..."
              style={{
                flex: 1,
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            />
            <select
              value={specificity}
              onChange={(e) => setSpecificity(e.target.value)}
              style={{
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '8px'
              }}
            >
              <option value="any">Flexible</option>
              <option value="category">Même catégorie</option>
              <option value="exact">Produit exact</option>
            </select>
          </div>

          {showDropdown && suggestions.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 1000
            }}>
              {suggestions.map((product) => (
                <div
                  key={`${product.type}-${product.id}`}
                  onClick={() => linkProduct(product)}
                  style={{
                    padding: '0.75rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'white';
                  }}
                >
                  <span>{product.badge}</span>
                  <span>{product.name}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
