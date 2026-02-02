// Script pour mettre à jour les instructions de la recette Salade niçoise
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Instructions détaillées pour la Salade niçoise
const instructions = `1. Préparer les légumes : Laver la salade verte et bien l'égoutter. Couper les tomates en quartiers. Trancher finement les poivrons verts et les oignons rouges.

2. Cuire les œufs durs : Porter de l'eau à ébullition, y plonger les œufs et cuire 10 minutes. Rafraîchir sous l'eau froide puis écaler et couper en quartiers.

3. Préparer les pommes de terre : Cuire les pommes de terre à l'eau salée pendant 15-20 minutes jusqu'à ce qu'elles soient tendres. Laisser refroidir puis couper en rondelles.

4. Assembler la salade : Dans un grand saladier, disposer la salade verte comme base. Ajouter les tomates, les poivrons, les oignons rouges, les pommes de terre et les haricots verts cuits.

5. Ajouter le thon et les anchois : Émietter le thon au-dessus de la salade. Disposer les filets d'anchois. Ajouter les olives noires de Nice.

6. Disposer les œufs : Disposer harmonieusement les quartiers d'œufs durs sur le dessus de la salade.

7. Assaisonner : Arroser d'huile d'olive, de vinaigre de vin, saler et poivrer. Parsemer de basilic frais ciselé.

8. Servir : Servir immédiatement ou laisser reposer 10 minutes au frais pour que les saveurs se mélangent.`;

async function fixSaladeNicoise() {
  try {
    // Récupérer les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Variables d\'environnement Supabase manquantes');
    }

    console.log('📡 Connexion à Supabase...');

    // Utiliser fetch directement pour éviter les problèmes de compatibilité Node.js
    const recipeId = 9401;

    // 1. Vérifier l'état actuel
    console.log('\n1️⃣ Vérification de l\'état actuel...');
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/recipes?id=eq.${recipeId}&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!checkResponse.ok) {
      throw new Error(`Erreur lors de la vérification: ${checkResponse.statusText}`);
    }

    const currentData = await checkResponse.json();

    if (currentData.length === 0) {
      throw new Error('Recette Salade niçoise (ID: 9401) introuvable');
    }

    console.log('✅ Recette trouvée:', currentData[0].name);
    console.log('📝 Instructions actuelles:',
      currentData[0].instructions
        ? `${currentData[0].instructions.substring(0, 100)}...`
        : '(VIDE)');

    // 2. Mettre à jour les instructions
    console.log('\n2️⃣ Mise à jour des instructions...');
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/recipes?id=eq.${recipeId}`, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        instructions: instructions,
        updated_at: new Date().toISOString()
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      throw new Error(`Erreur lors de la mise à jour: ${error}`);
    }

    const updatedData = await updateResponse.json();

    console.log('✅ Instructions mises à jour avec succès!');
    console.log('\n📋 Nouvelles instructions:');
    console.log(updatedData[0].instructions.substring(0, 200) + '...');

    console.log('\n✨ Vous pouvez maintenant recharger la page de la recette pour voir les instructions.');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Exécuter le script
fixSaladeNicoise();
