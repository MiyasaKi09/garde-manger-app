require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('📦 Application de la migration...\n');

  const migrationSQL = fs.readFileSync('./migrations/add-hierarchy-fields.sql', 'utf-8');

  // Séparer les commandes SQL (ignorer les commentaires)
  const commands = migrationSQL
    .split(';')
    .map(cmd => cmd.trim())
    .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));

  for (let i = 0; i < commands.length; i++) {
    const cmd = commands[i];

    // Skip les commandes DO (notices)
    if (cmd.toLowerCase().startsWith('do $$')) {
      console.log('ℹ️  Skipping DO block (notices)');
      continue;
    }

    // Skip les COMMENT
    if (cmd.toLowerCase().startsWith('comment on')) {
      console.log('ℹ️  Skipping COMMENT');
      continue;
    }

    console.log(`Exécution ${i + 1}/${commands.length}...`);

    const { error } = await supabase.rpc('exec_sql', { sql_query: cmd + ';' });

    if (error) {
      console.log('❌ Erreur:', error.message);
      console.log('   Commande:', cmd.substring(0, 100));

      // Continuer malgré les erreurs (certaines peuvent être normales)
      if (!error.message.includes('already exists') &&
          !error.message.includes('does not exist')) {
        console.log('   ⚠️  Erreur non ignorée, arrêt');
        break;
      } else {
        console.log('   ℹ️  Erreur ignorée (déjà existe ou autre)');
      }
    } else {
      console.log('   ✅');
    }
  }

  console.log('\n🔍 Vérification de la structure mise à jour...\n');

  // Vérifier archetypes
  const { data: archetype } = await supabase
    .from('archetypes')
    .select('*')
    .limit(1);

  if (archetype && archetype.length > 0) {
    console.log('✅ Table archetypes:');
    console.log('   Colonnes:', Object.keys(archetype[0]).join(', '));
    console.log('   ✓ parent_archetype_id:', Object.keys(archetype[0]).includes('parent_archetype_id') ? '✅' : '❌');
  }

  // Vérifier recipe_ingredients
  const { data: ri } = await supabase
    .from('recipe_ingredients')
    .select('*')
    .limit(1);

  if (ri && ri.length > 0) {
    console.log('\n✅ Table recipe_ingredients:');
    console.log('   Colonnes:', Object.keys(ri[0]).join(', '));
    console.log('   ✓ cultivar_id:', Object.keys(ri[0]).includes('cultivar_id') ? '✅' : '❌');
    console.log('   ✓ product_id:', Object.keys(ri[0]).includes('product_id') ? '✅' : '❌');
  }

  console.log('\n✨ Migration terminée !\n');
}

applyMigration().catch(console.error);
