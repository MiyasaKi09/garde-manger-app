const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkPainDetail() {
  const { data, error } = await supabase
    .from('archetypes')
    .select('*, canonical_foods(canonical_name), cultivars(cultivar_name)')
    .eq('name', 'pain')
    .single();

  if (error) {
    console.error('Erreur:', error);
    return;
  }

  console.log('=== ARCHETYPE "PAIN" DÉTAIL ===');
  console.log('ID:', data.id);
  console.log('Name:', data.name);
  console.log('Canonical Food ID:', data.canonical_food_id);
  console.log('Canonical Food Name:', data.canonical_foods?.canonical_name || 'NULL');
  console.log('Cultivar ID:', data.cultivar_id);
  console.log('Cultivar Name:', data.cultivars?.cultivar_name || 'NULL');
  console.log('Process:', data.process);
  console.log('Parent Archetype ID:', data.parent_archetype_id);
  console.log('Primary Unit:', data.primary_unit);
}

checkPainDetail();
