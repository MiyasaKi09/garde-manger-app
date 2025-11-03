require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `./backups/backup-${timestamp}`;

  console.log('🔄 BACKUP DE LA BASE DE DONNÉES');
  console.log(`📁 Dossier: ${backupDir}\n`);

  // Créer le dossier de backup
  if (!fs.existsSync('./backups')) {
    fs.mkdirSync('./backups');
  }
  fs.mkdirSync(backupDir);

  const tables = [
    'canonical_foods',
    'cultivars',
    'archetypes',
    'products',
    'recipe_ingredients',
    'recipes'
  ];

  const backup = {
    timestamp,
    tables: {}
  };

  for (const table of tables) {
    try {
      console.log(`📥 Backup de ${table}...`);

      let allData = [];
      let from = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .range(from, from + limit - 1);

        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`   ⚠️  Table ${table} n'existe pas, skip`);
            backup.tables[table] = { count: 0, data: [] };
            break;
          }
          throw error;
        }

        if (data.length > 0) {
          allData = allData.concat(data);
          from += limit;
          hasMore = data.length === limit;
        } else {
          hasMore = false;
        }
      }

      backup.tables[table] = {
        count: allData.length,
        data: allData
      };

      // Sauvegarder chaque table dans un fichier séparé
      fs.writeFileSync(
        path.join(backupDir, `${table}.json`),
        JSON.stringify(allData, null, 2)
      );

      console.log(`   ✅ ${allData.length} lignes sauvegardées`);

    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      backup.tables[table] = { error: error.message };
    }
  }

  // Sauvegarder le manifest complet
  fs.writeFileSync(
    path.join(backupDir, 'manifest.json'),
    JSON.stringify(backup, null, 2)
  );

  // Créer un README
  const readme = `# Backup de la base de données
Date: ${new Date(timestamp).toLocaleString('fr-FR')}

## Contenu

${Object.entries(backup.tables).map(([table, info]) => {
  if (info.error) {
    return `- **${table}**: ❌ ERREUR - ${info.error}`;
  }
  return `- **${table}**: ${info.count} lignes`;
}).join('\n')}

## Restauration

Pour restaurer ce backup:
\`\`\`bash
node restore-database.js ${path.basename(backupDir)}
\`\`\`

## Fichiers

${Object.keys(backup.tables).map(table => `- ${table}.json`).join('\n')}
- manifest.json (ce fichier contient le résumé)
`;

  fs.writeFileSync(path.join(backupDir, 'README.md'), readme);

  console.log('\n✅ BACKUP TERMINÉ !');
  console.log(`📁 Dossier: ${backupDir}`);
  console.log('\nRésumé:');
  Object.entries(backup.tables).forEach(([table, info]) => {
    if (info.error) {
      console.log(`   ❌ ${table}: ERREUR`);
    } else {
      console.log(`   ✅ ${table}: ${info.count} lignes`);
    }
  });

  console.log('\n⚠️  IMPORTANT: Conserve ce backup avant toute modification !');

  return backupDir;
}

backupDatabase().catch(console.error);
