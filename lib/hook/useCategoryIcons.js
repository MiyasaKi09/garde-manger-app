// lib/hooks/useCategoryIcons.js
import { useState, useEffect, useCallback } from 'react';
import { categoryIconService } from '@/lib/categoryIconService';

/**
 * Hook React pour gérer les icônes de catégories
 */
export function useCategoryIcons() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger les catégories au montage
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const categoriesData = await categoryIconService.getAllCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
      setError(err.message || 'Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir une icône par ID de catégorie
  const getIconById = useCallback(async (categoryId) => {
    try {
      return await categoryIconService.getIconById(categoryId);
    } catch (err) {
      return '📦';
    }
  }, []);

  // Obtenir une icône par nom de catégorie
  const getIconByName = useCallback(async (categoryName) => {
    try {
      return await categoryIconService.getIconByName(categoryName);
    } catch (err) {
      return '📦';
    }
  }, []);

  // Obtenir les informations complètes d'une catégorie
  const getCategoryInfo = useCallback(async (categoryId) => {
    try {
      return await categoryIconService.getCategoryById(categoryId);
    } catch (err) {
      return null;
    }
  }, []);

  // Enrichir un objet produit avec l'icône de sa catégorie
  const enrichProductWithIcon = useCallback(async (product) => {
    if (!product) return product;

    let icon = product.icon || '📦';
    
    // Essayer d'abord par category_id
    if (product.category_id) {
      const categoryIcon = await getIconById(product.category_id);
      if (categoryIcon && categoryIcon !== '📦') {
        icon = categoryIcon;
      }
    }
    
    // Fallback sur le nom de catégorie
    if (icon === '📦' && product.category?.name) {
      const categoryIcon = await getIconByName(product.category.name);
      if (categoryIcon && categoryIcon !== '📦') {
        icon = categoryIcon;
      }
    }

    return {
      ...product,
      icon
    };
  }, [getIconById, getIconByName]);

  // Enrichir une liste de produits avec leurs icônes
  const enrichProductsWithIcons = useCallback(async (products) => {
    if (!Array.isArray(products)) return products;
    
    return await Promise.all(
      products.map(product => enrichProductWithIcon(product))
    );
  }, [enrichProductWithIcon]);

  // Vider le cache
  const clearCache = useCallback(() => {
    categoryIconService.clearCache();
    loadCategories();
  }, [loadCategories]);

  return {
    // État
    categories,
    loading,
    error,
    
    // Actions
    loadCategories,
    getIconById,
    getIconByName,
    getCategoryInfo,
    enrichProductWithIcon,
    enrichProductsWithIcons,
    clearCache
  };
}

/**
 * Hook simplifié pour obtenir juste une icône
 */
export function useCategoryIcon(categoryId, categoryName) {
  const [icon, setIcon] = useState('📦');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId && !categoryName) {
      setIcon('📦');
      return;
    }

    let isCancelled = false;
    
    const fetchIcon = async () => {
      setLoading(true);
      try {
        let fetchedIcon = '📦';
        
        // Essayer d'abord par ID
        if (categoryId) {
          fetchedIcon = await categoryIconService.getIconById(categoryId);
        }
        
        // Fallback sur le nom
        if (fetchedIcon === '📦' && categoryName) {
          fetchedIcon = await categoryIconService.getIconByName(categoryName);
        }
        
        if (!isCancelled) {
          setIcon(fetchedIcon);
        }
      } catch (error) {
        if (!isCancelled) {
          setIcon('📦');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchIcon();
    
    return () => {
      isCancelled = true;
    };
  }, [categoryId, categoryName]);

  return { icon, loading };
}

/**
 * Hook pour obtenir les informations complètes d'une catégorie
 */
export function useCategoryInfo(categoryId) {
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!categoryId) {
      setCategoryInfo(null);
      return;
    }

    let isCancelled = false;
    
    const fetchCategoryInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        const info = await categoryIconService.getCategoryById(categoryId);
        if (!isCancelled) {
          setCategoryInfo(info);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Erreur lors de la récupération');
          setCategoryInfo(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchCategoryInfo();
    
    return () => {
      isCancelled = true;
    };
  }, [categoryId]);

  return { categoryInfo, loading, error };
}
