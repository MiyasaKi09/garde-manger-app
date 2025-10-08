#!/usr/bin/env node
/**
 * Script d'insertion des 500 recettes Myko dans Supabase
 * Usage: node populate_recipes.js
 */

const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// Import Supabase (compatible Node.js)
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  console.log('Vérifiez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupDatabase() {
  console.log('🗄️ Configuration de la structure de base de données...')
  
  try {
    // Lire et exécuter le script SQL de setup
    const setupSql = fs.readFileSync(path.join(__dirname, 'setup_recipes_db.sql'), 'utf8')
    
    // Note: Supabase JS client ne supporte pas l'exécution de SQL brut
    // Cette partie devra être exécutée manuellement dans l'interface Supabase
    console.log('⚠️  Exécutez d\'abord le fichier setup_recipes_db.sql dans l\'interface Supabase SQL Editor')
    console.log('   Puis relancez ce script.')
    
    // Vérifier si les tables existent
    const { data: tables, error } = await supabase
      .from('recipe_categories')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ Les tables de base n\'existent pas encore. Exécutez d\'abord setup_recipes_db.sql')
      process.exit(1)
    }
    
    console.log('✅ Structure de base vérifiée')
    return true
    
  } catch (error) {
    console.error('❌ Erreur setup base:', error.message)
    return false
  }
}

async function getCategoryMapping() {
  console.log('🏷️ Récupération du mapping des catégories...')
  
  try {
    const { data: categories } = await supabase
      .from('recipe_categories')
      .select('id, name')
    
    const { data: cuisines } = await supabase
      .from('cuisine_types')  
      .select('id, name')
      
    const { data: difficulties } = await supabase
      .from('difficulty_levels')
      .select('id, level')

    const categoryMap = {}
    const cuisineMap = {}  
    const difficultyMap = {}
    
    categories?.forEach(cat => categoryMap[cat.name] = cat.id)
    cuisines?.forEach(cui => cuisineMap[cui.name] = cui.id)
    difficulties?.forEach(diff => difficultyMap[diff.level] = diff.id)
    
    console.log(`✅ Mappings créés: ${Object.keys(categoryMap).length} catégories, ${Object.keys(cuisineMap).length} cuisines, ${Object.keys(difficultyMap).length} difficultés`)
    
    return { categoryMap, cuisineMap, difficultyMap }
    
  } catch (error) {
    console.error('❌ Erreur mapping:', error.message)
    throw error
  }
}

async function insertRecipes() {
  console.log('📚 Insertion des 500 recettes...')
  
  try {
    // Lire le fichier JSON des recettes générées
    const recipesPath = path.join(__dirname, 'myko_500_recipes.json')
    
    if (!fs.existsSync(recipesPath)) {
      console.error('❌ Fichier myko_500_recipes.json introuvable')
      console.log('   Exécutez d\'abord: python3 generate_recipes.py')
      process.exit(1)
    }
    
    const rawRecipes = JSON.parse(fs.readFileSync(recipesPath, 'utf8'))
    console.log(`📖 ${rawRecipes.length} recettes trouvées dans le fichier JSON`)
    
    // Obtenir les mappings
    const { categoryMap, cuisineMap, difficultyMap } = await getCategoryMapping()
    
    // Transformer les recettes pour Supabase
    const recipes = rawRecipes.map(recipe => ({
      id: recipe.id,
      title: recipe.title,
      slug: recipe.slug,
      description: recipe.description,
      short_description: recipe.short_description,
      instructions: recipe.instructions,
      
      // Références aux tables
      category_id: categoryMap[recipe.category],
      cuisine_type_id: cuisineMap[recipe.cuisine_type] || cuisineMap['Française'], 
      difficulty_level_id: difficultyMap[recipe.difficulty],
      
      // Informations pratiques  
      servings: recipe.servings,
      prep_min: recipe.prep_min,
      cook_min: recipe.cook_min,
      rest_min: recipe.rest_min,
      
      // Nutrition
      calories: recipe.calories,
      proteins: recipe.proteins,
      carbs: recipe.carbs,
      fats: recipe.fats,
      fiber: recipe.fiber,
      vitamin_c: recipe.vitamin_c,
      iron: recipe.iron,
      calcium: recipe.calcium,
      
      // Budget
      estimated_cost: recipe.estimated_cost,
      budget_category: recipe.budget_category,
      skill_level: recipe.skill_level,
      
      // Saisonnalité
      season_spring: recipe.season_spring,
      season_summer: recipe.season_summer,
      season_autumn: recipe.season_autumn,
      season_winter: recipe.season_winter,
      
      // Repas
      meal_breakfast: recipe.meal_breakfast,
      meal_lunch: recipe.meal_lunch,
      meal_dinner: recipe.meal_dinner,  
      meal_snack: recipe.meal_snack,
      
      // Régimes
      is_vegetarian: recipe.is_vegetarian,
      is_vegan: recipe.is_vegan,
      is_gluten_free: recipe.is_gluten_free,
      
      // Extras
      chef_tips: recipe.chef_tips,
      serving_suggestions: recipe.serving_suggestions,
      source_name: recipe.source_name,
      author_name: recipe.author_name
    }))
    
    // Insérer par lots de 50 pour éviter les timeouts
    const batchSize = 50
    let inserted = 0
    
    for (let i = 0; i < recipes.length; i += batchSize) {
      const batch = recipes.slice(i, i + batchSize)
      
      console.log(`📥 Insertion du lot ${Math.floor(i/batchSize) + 1}/${Math.ceil(recipes.length/batchSize)} (recettes ${i+1}-${Math.min(i+batchSize, recipes.length)})`)
      
      const { data, error } = await supabase
        .from('recipes')
        .insert(batch)
        .select('id')
        
      if (error) {
        console.error(`❌ Erreur lot ${Math.floor(i/batchSize) + 1}:`, error.message)
        throw error
      }
      
      inserted += data?.length || 0
      console.log(`✅ Lot ${Math.floor(i/batchSize) + 1} inséré avec succès`)
      
      // Pause entre les lots
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.log(`🎉 ${inserted} recettes insérées avec succès !`)
    return inserted
    
  } catch (error) {
    console.error('❌ Erreur insertion:', error.message)
    throw error
  }
}

async function verifyData() {
  console.log('🔍 Vérification des données insérées...')
  
  try {
    const { data: stats, error } = await supabase
      .from('recipes')
      .select('category_id, difficulty_level_id, is_vegetarian')
      
    if (error) throw error
    
    const categories = {}
    const difficulties = {}
    let vegetarian = 0
    
    stats?.forEach(recipe => {
      categories[recipe.category_id] = (categories[recipe.category_id] || 0) + 1
      difficulties[recipe.difficulty_level_id] = (difficulties[recipe.difficulty_level_id] || 0) + 1
      if (recipe.is_vegetarian) vegetarian++
    })
    
    console.log('📊 Statistiques:')
    console.log(`   Total: ${stats?.length || 0} recettes`)
    console.log(`   Végétariennes: ${vegetarian}`)
    console.log(`   Catégories: ${Object.keys(categories).length}`)
    console.log(`   Difficultés: ${Object.keys(difficulties).length}`)
    
    return true
    
  } catch (error) {
    console.error('❌ Erreur vérification:', error.message)
    return false
  }
}

// Exécution principale
async function main() {
  console.log('🌿 === PEUPLEMENT BASE DE DONNÉES MYKO ===')
  console.log('📅', new Date().toLocaleString('fr-FR'))
  console.log('')
  
  try {
    // 1. Setup base
    await setupDatabase()
    
    // 2. Insertion
    await insertRecipes()
    
    // 3. Vérification  
    await verifyData()
    
    console.log('')
    console.log('🎉 === SUCCÈS COMPLET ===')
    console.log('✅ Base de données Myko peuplée avec 500 recettes authentiques')
    console.log('🔗 Vous pouvez maintenant tester la sélection de recettes dans le planning')
    
  } catch (error) {
    console.log('')
    console.log('❌ === ÉCHEC ===')
    console.error('Erreur:', error.message)
    process.exit(1)
  }
}

// Démarrage si exécuté directement
if (require.main === module) {
  main()
}

module.exports = { main }