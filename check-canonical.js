const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkCanonical() {
  const { data, error } = await supabase
    .from('canonical_foods')
    .select('id, canonical_name')
    .or('canonical_name.ilike.%marron%,canonical_name.ilike.%châtaigne%,canonical_name.ilike.%chataigne%,canonical_name.ilike.%sucre%')
    .order('canonical_name');

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  console.log('Canonical foods trouvés:');
  data.forEach(cf => {
    console.log(`  ${cf.id}: ${cf.canonical_name}`);
  });

  if (data.length === 0) {
    console.log('  Aucun trouvé');
  }
}

checkCanonical();
