'use client';'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { useState, useEffect } from 'react';import { useRouter } from 'next/navigation';

import { useRouter } from 'next/navigation';import { supabase } from '@/lib/supabaseClient';

import Link from 'next/link';

import { supabase } from '@/lib/supabaseClient';const SLOTS = ['midi','soir'];

import './planning.css';

function startOfWeek(d=new Date()){

export default function PlanningPage() {  const dt = new Date(d);

  const router = useRouter();  const day = (dt.getDay()+6)%7; // lundi=0

  const [currentWeek, setCurrentWeek] = useState(0); // 0 = semaine active, 1 = semaine suivante  dt.setDate(dt.getDate()-day);

  const [planning, setPlanning] = useState({});  dt.setHours(0,0,0,0);

  const [loading, setLoading] = useState(true);  return dt;

  const [selectedDate, setSelectedDate] = useState(null);}

  const [recipes, setRecipes] = useState([]);

  const [inventoryStatus, setInventoryStatus] = useState({});function fmtISO(d){ 

  const [weekStats, setWeekStats] = useState({});  return d.toISOString().slice(0,10); 

}

  // Configuration des repas

  const mealTypes = [export default function PlannerPage(){

    { id: 'breakfast', name: 'Petit-déj', icon: '🌅' },  const router = useRouter();

    { id: 'lunch', name: 'Déjeuner', icon: '☀️' },  const [weekStart,setWeekStart]=useState(()=>startOfWeek());

    { id: 'dinner', name: 'Dîner', icon: '🌙' }  const days = useMemo(()=>Array.from({length:7},(_,i)=> new Date(weekStart.getTime()+i*86400000)),[weekStart]);

  ];

  const [recipes,setRecipes]=useState([]);

  // États des repas  const [plan,setPlan]=useState([]);      // entries of current week

  const mealStatuses = {  const [leftovers,setLeftovers]=useState([]);

    planned: { name: 'Planifié', color: '#2196f3', icon: '📋' },  const [saving,setSaving]=useState(false);

    completed: { name: 'Réalisé', color: '#4caf50', icon: '✅' },

    postponed: { name: 'Reporté', color: '#ff9800', icon: '↷' },  useEffect(() => {

    cancelled: { name: 'Annulé', color: '#f44336', icon: '✖' }    supabase.auth.getUser().then(({ data: { user } }) => {

  };      if (!user) router.push('/login');

    });

  useEffect(() => {  }, [router]);

    supabase.auth.getUser().then(({ data: { user } }) => {

      if (!user) router.push('/login');  async function load(){

    });    const { data: r } = await supabase.from('recipes').select('id,name').order('name');

  }, [router]);    setRecipes(r||[]);

    const { data: p } = await supabase

  useEffect(() => {      .from('meal_plan')

    loadPlanning();      .select('id, plan_date, slot, recipe_id, servings, recipe:recipes(name)')

    loadRecipes();      .gte('plan_date', fmtISO(days[0]))

    checkInventoryAvailability();      .lte('plan_date', fmtISO(days[6]));

  }, [currentWeek]);    setPlan(p||[]);

    const { data: lo } = await supabase

  // Générer les dates de la semaine      .from('leftovers')

  function getWeekDates(weekOffset = 0) {      .select('id, recipe_id, portions_left, dlc, recipe:recipes(name)')

    const today = new Date();      .gte('dlc', fmtISO(new Date()));

    const startOfWeek = new Date(today);    setLeftovers(lo||[]);

    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (weekOffset * 7)); // Lundi  }

      

    const dates = [];  useEffect(()=>{ 

    for (let i = 0; i < 7; i++) {    load(); 

      const date = new Date(startOfWeek);    /* eslint-disable-next-line */ 

      date.setDate(startOfWeek.getDate() + i);  },[weekStart]);

      dates.push(date);

    }  function moveWeek(delta){

    return dates;    setWeekStart(w => new Date(w.getTime()+delta*7*86400000));

  }  }



  async function loadPlanning() {  const cell = (date, slot) => (plan||[]).find(p => p.plan_date === fmtISO(date) && p.slot === slot);

    try {

      const weekDates = getWeekDates(currentWeek);  async function setCell(date, slot, recipeId){

      const startDate = weekDates[0].toISOString().split('T')[0];    setSaving(true);

      const endDate = weekDates[6].toISOString().split('T')[0];    try{

      const existing = cell(date, slot);

      // Simuler des données de planning pour le moment      if (recipeId==='__clear__') {

      const planningData = {};        if(existing) await supabase.from('meal_plan').delete().eq('id', existing.id);

      weekDates.forEach(date => {      } else if (existing) {

        const dateStr = date.toISOString().split('T')[0];        await supabase.from('meal_plan').update({ recipe_id: recipeId }).eq('id', existing.id);

        planningData[dateStr] = {};      } else {

        mealTypes.forEach(meal => {        await supabase.from('meal_plan').insert({ plan_date: fmtISO(date), slot, recipe_id: recipeId, servings: 2 });

          // Simuler quelques repas planifiés      }

          if (Math.random() < 0.6) { // 60% de chance d'avoir un repas planifié      await load();

            planningData[dateStr][meal.id] = {    } finally { 

              id: `${dateStr}-${meal.id}`,      setSaving(false); 

              planned_date: dateStr,    }

              meal_type: meal.id,  }

              recipe_id: Math.floor(Math.random() * 10) + 1,

              planned_portions: Math.floor(Math.random() * 4) + 2,  async function markCooked(date, slot){

              status: Math.random() < 0.3 ? 'completed' : 'planned',    const p = cell(date, slot);

              recipes: {    if(!p) return;

                id: Math.floor(Math.random() * 10) + 1,    const servings = p.servings || 2;

                title: `Plat ${Math.floor(Math.random() * 20) + 1}`,    const ok = confirm(`Marquer "${p.recipe?.name}" comme cuisiné (${servings} part.) ?`);

                image_url: null,    if(!ok) return;

                total_min: Math.floor(Math.random() * 60) + 15,    // 1) journal

                servings: Math.floor(Math.random() * 4) + 2,    await supabase.from('meal_log').insert({ recipe_id: p.recipe_id, servings, from_plan_id: p.id });

                difficulty: ['facile', 'moyen', 'difficile'][Math.floor(Math.random() * 3)],    // 2) restes (par défaut: se garde 3 jours, tout au frigo)

                is_veg: Math.random() < 0.3,    const dlc = fmtISO(new Date(new Date().getTime()+3*86400000));

                nutrition: {    const { data: locs } = await supabase.from('locations').select('id,name').ilike('name','%frigo%').limit(1);

                  calories: Math.floor(Math.random() * 400) + 200,    const locId = locs?.[0]?.id ?? null;

                  proteins: Math.floor(Math.random() * 30) + 10,    await supabase.from('leftovers').insert({ recipe_id: p.recipe_id, portions_left: servings, dlc, location_id: locId });

                  carbs: Math.floor(Math.random() * 50) + 20,    // 3) supprimer du planning

                  fats: Math.floor(Math.random() * 20) + 5    await supabase.from('meal_plan').delete().eq('id', p.id);

                }    await load();

              }  }

            };

          } else {  const dayNames = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];

            planningData[dateStr][meal.id] = null;

          }  return (

        });    <div style={{ padding: '1rem', maxWidth: '1200px', margin: '0 auto' }}>

      });      <h1>📅 Planning des repas</h1>

      

      setPlanning(planningData);      {/* Navigation semaine */}

      calculateWeekStats(planningData);      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>

    } catch (error) {        <button onClick={() => moveWeek(-1)} className="btn secondary">← Semaine précédente</button>

      console.error('Erreur chargement planning:', error);        <h2>{fmtISO(days[0])} - {fmtISO(days[6])}</h2>

    } finally {        <button onClick={() => moveWeek(1)} className="btn secondary">Semaine suivante →</button>

      setLoading(false);      </div>

    }

  }      {/* Grille planning */}

      <div style={{ 

  async function loadRecipes() {        display: 'grid', 

    try {        gridTemplateColumns: 'auto repeat(7, 1fr)', 

      const { data, error } = await supabase        gap: '1px', 

        .from('recipes')        background: '#ddd',

        .select('*')        border: '1px solid #ddd',

        .order('title');        borderRadius: '8px',

        overflow: 'hidden'

      if (error) throw error;      }}>

      setRecipes(data || []);        {/* En-têtes */}

    } catch (error) {        <div style={{ background: '#f5f5f5', padding: '0.5rem', fontWeight: 'bold' }}></div>

      console.error('Erreur chargement recettes:', error);        {days.map((day, i) => (

    }          <div key={i} style={{ background: '#f5f5f5', padding: '0.5rem', fontWeight: 'bold', textAlign: 'center' }}>

  }            {dayNames[i]}<br />

            <small>{day.getDate()}/{day.getMonth()+1}</small>

  async function checkInventoryAvailability() {          </div>

    try {        ))}

      const { data, error } = await supabase.rpc('get_recipes_availability');

              {/* Lignes des slots */}

      if (!error && data) {        {SLOTS.map(slot => (

        const statusMap = {};          <React.Fragment key={slot}>

        data.forEach(item => {            <div style={{ background: '#f9f9f9', padding: '0.5rem', fontWeight: 'bold', textAlign: 'center' }}>

          statusMap[item.recipe_id] = {              {slot === 'midi' ? '🌞 Midi' : '🌙 Soir'}

            totalIngredients: item.total_ingredients,            </div>

            availableIngredients: item.available_ingredients,            {days.map((day, i) => {

            availabilityPercent: item.availability_percent              const entry = cell(day, slot);

          };              return (

        });                <div key={i} style={{ background: 'white', padding: '0.5rem', minHeight: '80px' }}>

        setInventoryStatus(statusMap);                  {entry ? (

      }                    <div style={{ fontSize: '0.9rem' }}>

    } catch (error) {                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>

      console.error('Erreur vérification stocks:', error);                        {entry.recipe?.name}

    }                      </div>

  }                      <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0.5rem' }}>

                        {entry.servings} pers.

  function calculateWeekStats(planningData) {                      </div>

    let totalMeals = 0;                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>

    let completedMeals = 0;                        <button 

    let plannedMeals = 0;                          onClick={() => markCooked(day, slot)}

    let totalCalories = 0;                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}

    let totalProteins = 0;                          className="btn success small"

    let totalCarbs = 0;                        >

    let totalFats = 0;                          ✓ Fait

                        </button>

    Object.values(planningData).forEach(day => {                        <button 

      Object.values(day).forEach(meal => {                          onClick={() => setCell(day, slot, '__clear__')}

        if (meal) {                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem' }}

          totalMeals++;                          className="btn danger small"

          if (meal.status === 'completed') {                        >

            completedMeals++;                          ✕

            // Calculer les macros uniquement pour les repas réalisés                        </button>

            if (meal.recipes?.nutrition) {                      </div>

              totalCalories += meal.recipes.nutrition.calories || 0;                    </div>

              totalProteins += meal.recipes.nutrition.proteins || 0;                  ) : (

              totalCarbs += meal.recipes.nutrition.carbs || 0;                    <select 

              totalFats += meal.recipes.nutrition.fats || 0;                      onChange={(e) => e.target.value && setCell(day, slot, e.target.value)}

            }                      style={{ width: '100%', fontSize: '0.8rem' }}

          } else if (meal.status === 'planned') {                      disabled={saving}

            plannedMeals++;                    >

          }                      <option value="">Choisir recette...</option>

        }                      {recipes.map(r => (

      });                        <option key={r.id} value={r.id}>{r.name}</option>

    });                      ))}

                    </select>

    setWeekStats({                  )}

      totalMeals,                </div>

      completedMeals,              );

      plannedMeals,            })}

      completionRate: totalMeals > 0 ? (completedMeals / totalMeals) * 100 : 0,          </React.Fragment>

      calories: totalCalories,        ))}

      proteins: totalProteins,      </div>

      carbs: totalCarbs,

      fats: totalFats      {/* Restes disponibles */}

    });      {leftovers.length > 0 && (

  }        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f9f9f9', borderRadius: '8px' }}>

          <h3>🍲 Restes disponibles</h3>

  async function updateMealStatus(dateStr, mealType, status) {          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

    const meal = planning[dateStr]?.[mealType];            {leftovers.map(lo => (

    if (!meal) return;              <div key={lo.id} style={{ padding: '0.5rem', background: 'white', borderRadius: '4px', border: '1px solid #ddd' }}>

                <div style={{ fontWeight: 'bold' }}>{lo.recipe?.name}</div>

    try {                <div style={{ fontSize: '0.9rem', color: '#666' }}>

      // Simulation de mise à jour                  {lo.portions_left} part. - DLC: {lo.dlc}

      const updatedPlanning = { ...planning };                </div>

      updatedPlanning[dateStr][mealType] = {              </div>

        ...meal,            ))}

        status: status          </div>

      };        </div>

            )}

      setPlanning(updatedPlanning);    </div>

      calculateWeekStats(updatedPlanning);  );

      }

      console.log(`Meal status updated: ${dateStr} ${mealType} -> ${status}`);
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  }

  async function assignRecipeToMeal(dateStr, mealType, recipeId) {
    try {
      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) return;

      // Simulation d'assignation
      const updatedPlanning = { ...planning };
      updatedPlanning[dateStr][mealType] = {
        id: `${dateStr}-${mealType}`,
        planned_date: dateStr,
        meal_type: mealType,
        recipe_id: recipeId,
        planned_portions: recipe.servings,
        status: 'planned',
        recipes: recipe
      };

      setPlanning(updatedPlanning);
      calculateWeekStats(updatedPlanning);
    } catch (error) {
      console.error('Erreur assignation recette:', error);
    }
  }

  async function generateWeekPlanning() {
    try {
      setLoading(true);
      
      // Simulation de génération automatique
      await loadPlanning();
      alert('🌿 Planning généré selon les principes Myko !');
    } catch (error) {
      console.error('Erreur génération planning:', error);
      alert('Erreur lors de la génération du planning');
    } finally {
      setLoading(false);
    }
  }

  const weekDates = getWeekDates(currentWeek);
  const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  if (loading) {
    return (
      <div className="planning-container">
        <div className="loading-spinner">⏳ Chargement du planning...</div>
      </div>
    );
  }

  return (
    <div className="planning-container">
      {/* Header avec navigation semaine */}
      <div className="planning-header">
        <div className="week-navigation">
          <button 
            className={`week-btn ${currentWeek === 0 ? 'active' : ''}`}
            onClick={() => setCurrentWeek(0)}
          >
            📅 Semaine Active
          </button>
          <button 
            className={`week-btn ${currentWeek === 1 ? 'active' : ''}`}
            onClick={() => setCurrentWeek(1)}
          >
            📋 Semaine Suivante
          </button>
        </div>

        <div className="planning-actions">
          <button 
            className="generate-btn myko-btn"
            onClick={generateWeekPlanning}
          >
            🌿 Générer Planning Myko
          </button>
        </div>
      </div>

      {/* Stats hebdomadaires */}
      <div className="week-stats">
        <div className="stat-card">
          <span className="stat-number">{weekStats.completedMeals || 0}</span>
          <span className="stat-label">Repas réalisés</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{Math.round(weekStats.completionRate || 0)}%</span>
          <span className="stat-label">Taux de réalisation</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{Math.round(weekStats.calories || 0)}</span>
          <span className="stat-label">kcal réalisées</span>
        </div>
        <div className="stat-card nutrition">
          <div className="macro-bars">
            <div className="macro-bar proteins">
              <span>P: {Math.round(weekStats.proteins || 0)}g</span>
            </div>
            <div className="macro-bar carbs">
              <span>G: {Math.round(weekStats.carbs || 0)}g</span>
            </div>
            <div className="macro-bar fats">
              <span>L: {Math.round(weekStats.fats || 0)}g</span>
            </div>
          </div>
          <span className="stat-label">Macros réalisées</span>
        </div>
      </div>

      {/* Grille du planning */}
      <div className="planning-grid">
        {weekDates.map((date, dayIndex) => {
          const dateStr = date.toISOString().split('T')[0];
          const isToday = dateStr === new Date().toISOString().split('T')[0];
          
          return (
            <div key={dateStr} className={`day-column ${isToday ? 'today' : ''}`}>
              <div className="day-header">
                <h3>{dayNames[dayIndex]}</h3>
                <span className="date">{date.getDate()}/{date.getMonth() + 1}</span>
                {isToday && <span className="today-badge">Aujourd'hui</span>}
              </div>

              <div className="meals-container">
                {mealTypes.map(mealType => {
                  const meal = planning[dateStr]?.[mealType.id];
                  const status = meal ? mealStatuses[meal.status] : null;
                  
                  return (
                    <div key={mealType.id} className="meal-slot">
                      <div className="meal-header">
                        <span className="meal-icon">{mealType.icon}</span>
                        <span className="meal-name">{mealType.name}</span>
                      </div>

                      {meal ? (
                        <div className={`meal-card status-${meal.status}`}>
                          {meal.recipes?.image_url ? (
                            <div className="meal-image">
                              <img src={meal.recipes.image_url} alt={meal.recipes.title} />
                            </div>
                          ) : (
                            <div className="meal-placeholder">
                              <span>🍽️</span>
                            </div>
                          )}
                          
                          <div className="meal-content">
                            <h4 className="meal-title">{meal.recipes?.title}</h4>
                            
                            <div className="meal-meta">
                              <span>⏱ {meal.recipes?.total_min || '?'} min</span>
                              <span>👥 {meal.planned_portions}</span>
                            </div>

                            <div className="meal-status">
                              <span 
                                className="status-badge"
                                style={{ backgroundColor: status.color }}
                              >
                                {status.icon} {status.name}
                              </span>
                            </div>

                            {/* Actions repas */}
                            <div className="meal-actions">
                              {meal.status === 'planned' && (
                                <>
                                  <button
                                    className="action-btn complete"
                                    onClick={() => updateMealStatus(dateStr, mealType.id, 'completed')}
                                    title="Marquer comme réalisé"
                                  >
                                    ✅
                                  </button>
                                  <button
                                    className="action-btn postpone"
                                    onClick={() => updateMealStatus(dateStr, mealType.id, 'postponed')}
                                    title="Reporter"
                                  >
                                    ↷
                                  </button>
                                </>
                              )}
                              <button
                                className="action-btn details"
                                onClick={() => setSelectedDate({ date: dateStr, meal: mealType.id })}
                                title="Voir détails"
                              >
                                👁️
                              </button>
                            </div>

                            {/* Disponibilité ingrédients */}
                            <div className="availability-status">
                              <div 
                                className={`availability-bar ${
                                  Math.random() > 0.5 ? 'high' :
                                  Math.random() > 0.3 ? 'medium' : 'low'
                                }`}
                              >
                                <div 
                                  className="availability-fill"
                                  style={{ width: `${Math.floor(Math.random() * 100)}%` }}
                                />
                                <span className="availability-text">
                                  {Math.floor(Math.random() * 100)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="empty-meal" onClick={() => setSelectedDate({ date: dateStr, meal: mealType.id })}>
                          <span className="add-icon">+</span>
                          <span className="add-text">Ajouter un plat</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de sélection de recette */}
      {selectedDate && (
        <RecipeSelectionModal
          date={selectedDate.date}
          mealType={selectedDate.meal}
          recipes={recipes}
          inventoryStatus={inventoryStatus}
          onSelect={assignRecipeToMeal}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}

// Modal de sélection de recettes avec logique Myko
function RecipeSelectionModal({ date, mealType, recipes, inventoryStatus, onSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('myko_score');

  const mealTypeNames = {
    breakfast: 'Petit-déjeuner',
    lunch: 'Déjeuner', 
    dinner: 'Dîner'
  };

  // Calcul du score Myko pour chaque recette
  function calculateMykoScore(recipe) {
    let score = 0;
    const status = inventoryStatus[recipe.id] || {};
    const availability = status.availabilityPercent || Math.random() * 100; // Simulation
    
    // Faisabilité (40%)
    score += availability * 0.4;
    
    // Anti-gaspillage (30%)
    if (Math.random() < 0.2) score += 30; // Simulation urgence
    
    // Équilibre nutritionnel (20%)
    if (recipe.is_veg || recipe.difficulty === 'facile') score += 20;
    
    // Variété (10%)
    if (!recipe.title.toLowerCase().includes('pâtes')) score += 10;
    
    return Math.round(score);
  }

  // Filtrer et trier les recettes
  const filteredRecipes = recipes
    .filter(recipe => 
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map(recipe => ({
      ...recipe,
      mykoScore: calculateMykoScore(recipe),
      availability: inventoryStatus[recipe.id]?.availabilityPercent || Math.random() * 100
    }))
    .sort((a, b) => {
      switch (sortBy) {
        case 'myko_score':
          return b.mykoScore - a.mykoScore;
        case 'availability':
          return b.availability - a.availability;
        case 'time':
          return (a.total_min || 0) - (b.total_min || 0);
        default:
          return a.title.localeCompare(b.title);
      }
    });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content recipe-selection-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Choisir un plat pour {mealTypeNames[mealType]}</h3>
          <span className="modal-date">{new Date(date).toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}</span>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        <div className="modal-filters">
          <input
            type="text"
            placeholder="Rechercher une recette..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="myko_score">🌿 Score Myko</option>
            <option value="availability">📦 Disponibilité</option>
            <option value="time">⏱️ Temps de préparation</option>
            <option value="title">🔤 Nom</option>
          </select>
        </div>

        <div className="recipes-list">
          {filteredRecipes.slice(0, 10).map(recipe => (
            <div 
              key={recipe.id} 
              className={`recipe-item ${recipe.mykoScore >= 85 ? 'myko-recommended' : ''}`}
              onClick={() => {
                onSelect(date, mealType, recipe.id);
                onClose();
              }}
            >
              <div className="recipe-image">
                {recipe.image_url ? (
                  <img src={recipe.image_url} alt={recipe.title} />
                ) : (
                  <div className="recipe-placeholder">🍽️</div>
                )}
                
                {recipe.mykoScore >= 85 && (
                  <span className="myko-badge">🌿</span>
                )}
              </div>
              
              <div className="recipe-info">
                <h4>{recipe.title}</h4>
                <div className="recipe-meta">
                  <span>⏱ {recipe.total_min || '?'} min</span>
                  <span>👥 {recipe.servings}</span>
                  <span className={`availability ${
                    recipe.availability >= 90 ? 'high' :
                    recipe.availability >= 50 ? 'medium' : 'low'
                  }`}>
                    📦 {Math.round(recipe.availability)}%
                  </span>
                </div>
                <div className="myko-score">
                  Score Myko: <strong>{recipe.mykoScore}/100</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}