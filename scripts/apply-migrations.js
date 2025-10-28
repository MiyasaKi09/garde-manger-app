#!/usr/bin/env node
/**
 * Script pour appliquer les migrations SQL sur Supabase
 * Usage: node scripts/apply-migrations.js
 */

const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: '.env.local' });

async function applyMigrations() {
  // Importer pg dynamiquement
  let Client;
  try {
    const pg = require('pg');
    Client = pg.Client;
  } catch (error) {
    console.error('❌ Le package "pg" n\'est pas installé.');
    console.error('Installez-le avec: npm install pg');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL_TX || process.env.DATABASE_URL_SESSION;

  if (!connectionString) {
    console.error('❌ Aucune DATABASE_URL trouvée dans .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Accepter les certificats auto-signés en dev
    }
  });

  try {
    await client.connect();
    console.log('✅ Connecté à Supabase');

    // Lister les fichiers de migration
    const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`\n📁 ${files.length} fichiers de migration trouvés\n`);

    // Créer une table pour tracker les migrations appliquées
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `);

    for (const file of files) {
      const version = file.replace('.sql', '');

      // Vérifier si la migration a déjà été appliquée
      const result = await client.query(
        'SELECT version FROM schema_migrations WHERE version = $1',
        [version]
      );

      if (result.rows.length > 0) {
        console.log(`⏭️  ${file} - déjà appliquée`);
        continue;
      }

      console.log(`🔄 Application de ${file}...`);

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      try {
        await client.query(sql);

        // Enregistrer la migration comme appliquée
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [version]
        );

        console.log(`✅ ${file} - appliquée avec succès`);
      } catch (error) {
        console.error(`❌ Erreur lors de l'application de ${file}:`);
        console.error(error.message);
        throw error;
      }
    }

    console.log('\n✨ Toutes les migrations ont été appliquées avec succès!');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigrations();
