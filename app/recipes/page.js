'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { authFetch } from '@/lib/authFetch';
import RecipeListCard from './components/RecipeListCard';
import './recipes.css';

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [inventoryStatus, setInventoryStatus] = useState({});
  const [error, setError] = useState(null);
  const [fetchingImages, setFetchingImages] = useState(false);
  const [fetchResult, setFetchResult] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
    });
  }, [router]);

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    if (recipes.length > 0) {
      checkInventoryAvailability();
    }
  }, [recipes]);

  useEffect(() => {
    filterAndSortRecipes();
  }, [recipes, searchTerm, availabilityFilter, sortBy, sortOrder, inventoryStatus]);

  async function fetchRecipes() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('generated_recipes')
        .select('id, title, description, servings, prep_min, cook_min, ingredients, steps, chef_tips, nutrition_per_serving, source, created_at, rating, cook_count, image_url')
        .order('created_at', { ascending: false });

      if (error) {
        setError(`Erreur de connexion: ${error.message}`);
        setRecipes([]);
        return;
      }

      if (!data || data.length === 0) {
        setRecipes([]);
        return;
      }

      const recipeIds = data.map(r => r.id);
      const { data: linkedIngs } = await supabase
        .from('generated_recipe_ingredients')
        .select('generated_recipe_id, canonical_food_id, archetype_id, quantity, unit')
        .in('generated_recipe_id', recipeIds);

      const ingsByRecipe = {};
      if (linkedIngs) {
        linkedIngs.forEach(ing => {
          if (!ingsByRecipe[ing.generated_recipe_id]) ingsByRecipe[ing.generated_recipe_id] = [];
          ingsByRecipe[ing.generated_recipe_id].push(ing);
        });
      }

      const enriched = data.map(r => ({
        ...r,
        linked_ingredients: ingsByRecipe[r.id] || [],
        ingredient_count: Array.isArray(r.ingredients) ? r.ingredients.length : 0,
      }));

      setRecipes(enriched);
    } catch (err) {
      setError(`Erreur: ${err.message}`);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }

  async function checkInventoryAvailability() {
    try {
      if (recipes.length === 0) return;

      const { data: inventory, error } = await supabase
        .from('inventory_lots')
        .select('canonical_food_id, archetype_id, qty_remaining, unit, expiration_date')
        .gt('qty_remaining', 0)
        .gt('expiration_date', new Date().toISOString());

      if (error) return;

      const archetypeIds = inventory?.filter(lot => lot.archetype_id).map(lot => lot.archetype_id) || [];
      let archetypeMapping = {};
      if (archetypeIds.length > 0) {
        const { data: archetypes } = await supabase
          .from('archetypes')
          .select('id, canonical_food_id')
          .in('id', archetypeIds);
        if (archetypes) {
          archetypes.forEach(a => { archetypeMapping[a.id] = a.canonical_food_id; });
        }
      }

      const statusMap = {};

      for (const recipe of recipes) {
        const linked = recipe.linked_ingredients || [];
        const totalIngredients = recipe.ingredient_count || 0;

        if (totalIngredients === 0 || linked.length === 0) {
          statusMap[recipe.id] = {
            totalIngredients,
            availableIngredients: 0,
            availabilityPercent: 0,
            urgentIngredients: 0,
            mykoScore: 0,
          };
          continue;
        }

        let availableIngredients = 0;
        let ingredientsExpiringSoon = 0;

        linked.forEach(ing => {
          let totalAvailable = 0;
          let earliestExp = null;

          inventory.forEach(lot => {
            let matches = false;
            if (ing.canonical_food_id && lot.canonical_food_id === ing.canonical_food_id) matches = true;
            else if (ing.canonical_food_id && lot.archetype_id && archetypeMapping[lot.archetype_id] === ing.canonical_food_id) matches = true;
            else if (ing.archetype_id && lot.archetype_id === ing.archetype_id) matches = true;

            if (matches) {
              totalAvailable += lot.qty_remaining || 0;
              if (lot.expiration_date) {
                const d = new Date(lot.expiration_date);
                if (!earliestExp || d < earliestExp) earliestExp = d;
              }
            }
          });

          if (totalAvailable >= (ing.quantity || 1)) {
            availableIngredients++;
            if (earliestExp) {
              const days = Math.floor((earliestExp - new Date()) / 86400000);
              if (days <= 7) ingredientsExpiringSoon++;
            }
          }
        });

        const availabilityPercent = Math.round((availableIngredients / linked.length) * 100);
        let mykoScore = (availabilityPercent / 100) * 60;
        if (linked.length > 0) mykoScore += (ingredientsExpiringSoon / linked.length) * 30;
        const totalTime = (recipe.prep_min || 0) + (recipe.cook_min || 0);
        mykoScore += totalTime > 0 ? Math.max(0, 10 - (totalTime / 120) * 10) : 5;

        statusMap[recipe.id] = {
          totalIngredients,
          availableIngredients,
          availabilityPercent,
          urgentIngredients: ingredientsExpiringSoon,
          mykoScore: Math.round(mykoScore),
        };
      }

      setInventoryStatus(statusMap);
    } catch {
      // silently fail
    }
  }

  function filterAndSortRecipes() {
    let filtered = [...recipes];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        (r.title || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q)
      );
    }

    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(r => {
        const s = inventoryStatus[r.id] || { availabilityPercent: 0, urgentIngredients: 0 };
        if (availabilityFilter === 'available') return s.availabilityPercent > 80;
        if (availabilityFilter === 'partial') return s.availabilityPercent > 30 && s.availabilityPercent <= 80;
        if (availabilityFilter === 'urgent') return s.urgentIngredients > 0;
        return true;
      });
    }

    filtered.sort((a, b) => {
      let va, vb;
      switch (sortBy) {
        case 'myko_score':
          va = inventoryStatus[a.id]?.mykoScore || 0;
          vb = inventoryStatus[b.id]?.mykoScore || 0;
          break;
        case 'availability':
          va = inventoryStatus[a.id]?.availabilityPercent || 0;
          vb = inventoryStatus[b.id]?.availabilityPercent || 0;
          break;
        case 'time':
          va = (a.prep_min || 0) + (a.cook_min || 0);
          vb = (b.prep_min || 0) + (b.cook_min || 0);
          break;
        case 'name':
          return sortOrder === 'asc'
            ? (a.title || '').localeCompare(b.title || '')
            : (b.title || '').localeCompare(a.title || '');
        case 'date':
        default:
          va = new Date(a.created_at || 0).getTime();
          vb = new Date(b.created_at || 0).getTime();
          break;
      }
      return sortOrder === 'asc' ? va - vb : vb - va;
    });

    setFilteredRecipes(filtered);
  }

  async function handleFetchImages() {
    setFetchingImages(true);
    setFetchResult(null);
    try {
      const res = await authFetch('/api/recipes/fetch-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch: true }),
      });
      const data = await res.json();
      if (data.error) {
        setFetchResult({ error: data.error });
      } else {
        setFetchResult({ updated: data.updated, total: data.total });
        if (data.updated > 0) fetchRecipes();
      }
    } catch (err) {
      setFetchResult({ error: err.message });
    } finally {
      setFetchingImages(false);
    }
  }

  const totalRecipes = recipes.length;
  const availableRecipes = filteredRecipes.filter(r => (inventoryStatus[r.id]?.availabilityPercent || 0) > 80).length;
  const partialRecipes = filteredRecipes.filter(r => {
    const p = inventoryStatus[r.id]?.availabilityPercent || 0;
    return p > 30 && p <= 80;
  }).length;
  const urgentRecipes = filteredRecipes.filter(r => (inventoryStatus[r.id]?.urgentIngredients || 0) > 0).length;

  const filterChips = [
    { key: 'all', label: `Toutes · ${totalRecipes}` },
    { key: 'available', label: `Réalisables · ${availableRecipes}` },
    { key: 'partial', label: `Partielles · ${partialRecipes}` },
    { key: 'urgent', label: `Urgentes · ${urgentRecipes}` },
  ];
  const sortChips = [
    { key: 'date', label: 'Récentes' },
    { key: 'myko_score', label: 'Score Myko' },
    { key: 'availability', label: 'Disponibilité' },
    { key: 'time', label: 'Temps' },
    { key: 'name', label: 'Nom' },
  ];

  if (loading) {
    return (
      <div className="v21-page wide">
        <div className="v21-cards" aria-busy="true" aria-label="Chargement des recettes">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="v21-card">
              <div className="v21-card-media v21-skel" />
              <div className="v21-card-body">
                <div className="v21-skel" style={{ height: 20, width: '80%' }} />
                <div className="v21-skel" style={{ height: 12, width: '50%', marginTop: 6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="v21-page">
        <div className="rc-error">
          <h2>Erreur de connexion</h2>
          <p>{error}</p>
          <button onClick={() => { setError(null); fetchRecipes(); }} className="v21-btn">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="v21-page wide">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Recettes</span>
          <h1 className="v21-title">Mes recettes</h1>
          <div className="v21-rule" />
          <p className="v21-lede">{recipes.length} disponible{recipes.length !== 1 ? 's' : ''} dans votre carnet.</p>
        </div>
        <div className="v21-hero-side">
          <button onClick={handleFetchImages} disabled={fetchingImages} className="v21-btn ghost">
            {fetchingImages ? 'Chargement…' : 'Photos auto'}
          </button>
        </div>
      </header>

      {fetchResult && (
        <p className={`rc-notice ${fetchResult.error ? 'err' : 'ok'}`}>
          {fetchResult.error ? fetchResult.error : `${fetchResult.updated}/${fetchResult.total} photos récupérées`}
        </p>
      )}

      <div className="v21-toolbar">
        <input
          type="text"
          placeholder="Rechercher une recette…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="v21-search"
        />
        <div className="v21-sort">
          <span className="v21-sort-l">Filtrer</span>
          {filterChips.map(c => (
            <button
              key={c.key}
              className={`v21-chip ${availabilityFilter === c.key ? 'on' : ''}`}
              onClick={() => setAvailabilityFilter(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="v21-toolbar rc-toolbar-sort">
        <div className="v21-sort">
          <span className="v21-sort-l">Trier</span>
          {sortChips.map(c => {
            const defaultOrder = c.key === 'time' || c.key === 'name' ? 'asc' : 'desc';
            return (
              <button
                key={c.key}
                className={`v21-chip ${sortBy === c.key ? 'on' : ''}`}
                onClick={() => {
                  if (sortBy === c.key) setSortOrder(o => o === 'desc' ? 'asc' : 'desc');
                  else { setSortBy(c.key); setSortOrder(defaultOrder); }
                }}
              >
                {c.label}{sortBy === c.key ? (sortOrder === 'desc' ? ' ↓' : ' ↑') : ''}
              </button>
            );
          })}
        </div>
        {filteredRecipes.length !== totalRecipes && (
          <span className="rc-count">{filteredRecipes.length} / {totalRecipes}</span>
        )}
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="v21-empty rc-empty">
          <p>Aucune recette trouvée.</p>
          <Link href="/planning/assistant" className="v21-btn">Créer un planning</Link>
        </div>
      ) : (
        <div className="v21-cards">
          {filteredRecipes.map(recipe => (
            <RecipeListCard
              key={recipe.id}
              recipe={recipe}
              status={inventoryStatus[recipe.id] || { totalIngredients: 0, availableIngredients: 0, availabilityPercent: 0, urgentIngredients: 0 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
