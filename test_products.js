// Test script pour vérifier les données des produits
import { supabase } from './lib/supabaseClient.js';

async function testProductData() {
  console.log('=== TEST DES DONNÉES PRODUITS ===');
  
  // Récupérer les lots avec leurs métadonnées
  const { data: lots, error } = await supabase
    .from('inventory_lots')
    .select(`
      *,
      canonical_foods(canonical_name, density_g_per_ml, grams_per_unit, primary_unit)
    `);
  
  if (error) {
    console.error('Erreur:', error);
    return;
  }
  
  console.log(`Nombre de lots trouvés: ${lots.length}`);
  
  lots.forEach(lot => {
    console.log(`
--- LOT: ${lot.product_name || lot.canonical_foods?.canonical_name} ---
ID: ${lot.id}
Type: ${lot.product_type}
Produit ID: ${lot.product_id}
Quantité: ${lot.qty_remaining} ${lot.unit}
Données canonical_foods:`, lot.canonical_foods);
  });
}

testProductData().catch(console.error);