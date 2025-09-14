// app/pantry/components/SmartAddForm.js - Version mise à jour pour la nouvelle structure

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PantryStyles } from './pantryUtils';

export function SmartAddForm({ onSave, onCancel, locations }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Recherche et sélection de produit
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Données du lot
  const [lotData, setLotData] = useState({
    qty: '',
    unit: 'g',
    storage_method: 'fridge',
    storage_place: '',
    expiration_date: '',
    notes: ''
  });

  // Recherche unifiée dans tous les types de produits
  const searchProducts = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;

      // Recherche dans les aliments canoniques
      const { data: canonicalResults } = await supabase
        .from('canonical_foods')
        .select(`
          id, canonical_name, 
          category:reference_categories(name, icon, color_hex),
          primary_unit, unit_weight_grams, density_g_per_ml,
          keywords
        `)
        .or(`canonical_name.ilike.%${query}%,keywords.cs.{${query}}`)
        .or(`owner_id.is.null,owner_id.eq.${userId}`)
        .limit(10);

      // Recherche dans les variétés
      const { data: cultivarResults } = await supabase
        .from('cultivars')
        .select(`
          id, cultivar_name, synonyms,
          canonical_food:canonical_foods(
            canonical_name, primary_unit, unit_weight_grams, density_g_per_ml,
            category:reference_categories(name, icon, color_hex)
          )
        `)
        .or(`cultivar_name.ilike.%${query}%,synonyms.cs.{${query}}`)
        .or(`owner_id.is.null,owner_id.eq.${userId}`)
        .limit(10);

      // Recherche dans les produits génériques
      const { data: genericResults } = await supabase
        .from('generic_products')
        .select(`
          id, name, keywords,
          category:reference_categories(name, icon, color_hex),
          primary_unit, unit_weight_grams, density_g_per_ml
        `)
        .or(`name.ilike.%${query}%,keywords.cs.{${query}}`)
        .or(`owner_id.is.null,owner_id.eq.${userId}`)
        .limit(10);

      // Recherche dans les produits dérivés
      const { data: derivedResults } = await supabase
        .from('derived_products')
        .select(`
          id, derived_name, process_method,
          cultivar:cultivars(
            cultivar_name,
            canonical_food:canonical_foods(
              canonical_name, primary_unit, unit_weight_grams, density_g_per_ml,
              category:reference_categories(name, icon, color_hex)
            )
          )
        `)
        .ilike('derived_name', `%${query}%`)
        .eq('owner_id', userId)
        .limit(5);

      // Recherche dans les alias
      const { data: aliasResults } = await supabase
        .from('product_aliases')
        .select(`
          alias_name, popularity_score,
          canonical_food:canonical_foods(
            id, canonical_name, primary_unit, unit_weight_grams, density_g_per_ml,
            category:reference_categories(name, icon, color_hex)
          ),
          cultivar:cultivars(
            id, cultivar_name,
            canonical_food:canonical_foods(
              canonical_name, primary_unit, unit_weight_grams, density_g_per_ml,
              category:reference_categories(name, icon, color_hex)
            )
          ),
          generic_product:generic_products(
            id, name, primary_unit, unit_weight_grams, density_g_per_ml,
            category:reference_categories(name, icon, color_hex)
          )
        `)
        .ilike('alias_name', `%${query}%`)
        .or(`owner_id.is.null,owner_id.eq.${userId}`)
        .order('popularity_score', { ascending: false })
        .limit(5);

      // Formatage des résultats
      const results = [];

      // Aliments canoniques
      (canonicalResults || []).forEach(item => {
        results.push({
          id: item.id,
          type: 'canonical',
          name: item.canonical_name,
          display_name: item.canonical_name,
          category: item.category,
          primary_unit: item.primary_unit,
          unit_weight_grams: item.unit_weight_grams,
          density_g_per_ml: item.density_g_per_ml,
          source: 'Aliment de base'
        });
      });

      // Variétés
      (cultivarResults || []).forEach(item => {
        results.push({
          id: item.id,
          type: 'cultivar',
          name: item.cultivar_name,
          display_name: `${item.cultivar_name} (${item.canonical_food?.canonical_name})`,
          category: item.canonical_food?.category,
          primary_unit: item.canonical_food?.primary_unit,
          unit_weight_grams: item.canonical_food?.unit_weight_grams,
          density_g_per_ml: item.canonical_food?.density_g_per_ml,
          source: 'Variété'
        });
      });

      // Produits génériques
      (genericResults || []).forEach(item => {
        results.push({
          id: item.id,
          type: 'generic',
          name: item.name,
          display_name: item.name,
          category: item.category,
          primary_unit: item.primary_unit,
          unit_weight_grams: item.unit_weight_grams,
          density_g_per_ml: item.density_g_per_ml,
          source: 'Produit commerce'
        });
      });

      // Produits dérivés
      (derivedResults || []).forEach(item => {
        results.push({
          id: item.id,
          type: 'derived',
          name: item.derived_name,
          display_name: `${item.derived_name} (${item.cultivar?.cultivar_name || item.cultivar?.canonical_food?.canonical_name})`,
          category: item.cultivar?.canonical_food?.category,
          primary_unit: item.cultivar?.canonical_food?.primary_unit,
          unit_weight_grams: item.cultivar?.canonical_food?.unit_weight_grams,
          density_g_per_ml: item.cultivar?.canonical_food?.density_g_per_ml,
          process_method: item.process_method,
          source: 'Transformation'
        });
      });

      // Résultats via alias
      (aliasResults || []).forEach(alias => {
        const target = alias.canonical_food || alias.cultivar || alias.generic_product;
        if (target) {
          const baseCategory = target.category || target.canonical_food?.category;
          results.push({
            id: target.id,
            type: alias.canonical_food ? 'canonical' 
                : alias.cultivar ? 'cultivar' 
                : 'generic',
            name: target.canonical_name || target.cultivar_name || target.name,
            display_name: `${target.canonical_name || target.cultivar_name || target.name} (via "${alias.alias_name}")`,
            category: baseCategory,
            primary_unit: target.primary_unit || target.canonical_food?.primary_unit,
            unit_weight_grams: target.unit_weight_grams || target.canonical_food?.unit_weight_grams,
            density_g_per_ml: target.density_g_per_ml || target.canonical_food?.density_g_per_ml,
            source: 'Alias'
          });
        }
      });

      // Tri par pertinence (exact match en premier, puis par type)
      results.sort((a, b) => {
        const aExact = a.name.toLowerCase() === query.toLowerCase();
        const bExact = b.name.toLowerCase() === query.toLowerCase();
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        const typeOrder = { canonical: 0, cultivar: 1, generic: 2, derived: 3 };
        return typeOrder[a.type] - typeOrder[b.type];
      });

      setSearchResults(results.slice(0, 15));
    } catch (err) {
      console.error('Erreur de recherche:', err);
      setError('Erreur lors de la recherche');
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounce pour la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchProducts(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  // Sélection d'un produit
  const handleSelectProduct = useCallback((product) => {
    setSelectedProduct(product);
    setLotData(prev => ({
      ...prev,
      unit: product.primary_unit || 'g'
    }));
    setStep(2);
  }, []);

  // Création d'un nouveau produit rapide
  const handleCreateQuickProduct = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      
      // Création d'un produit générique simple
      const { data: newProduct, error } = await supabase
        .from('generic_products')
        .insert([{
          owner_id: user?.user?.id,
          name: searchQuery.trim(),
          primary_unit: 'g'
        }])
        .select
