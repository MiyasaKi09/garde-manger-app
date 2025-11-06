const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function exportFullDatabase() {
  console.log('Exporting full database...\n');

  // ===== 1. CANONICAL FOODS =====
  console.log('1️⃣ Exporting canonical_foods...');
  const { data: canonicals, error: err1 } = await supabase
    .from('canonical_foods')
    .select('*')
    .order('id');

  if (err1) {
    console.error('Error:', err1);
    return;
  }

  console.log(`✅ ${canonicals.length} canonical foods exported\n`);

  // ===== 2. CULTIVARS =====
  console.log('2️⃣ Exporting cultivars...');
  const { data: cultivars, error: err2 } = await supabase
    .from('cultivars')
    .select('*, canonical_foods(canonical_name)')
    .order('id');

  if (err2) {
    console.error('Error:', err2);
    return;
  }

  console.log(`✅ ${cultivars.length} cultivars exported\n`);

  // ===== 3. ARCHETYPES =====
  console.log('3️⃣ Exporting archetypes...');
  const { data: archetypes, error: err3 } = await supabase
    .from('archetypes')
    .select('*, canonical_foods(canonical_name), cultivars(cultivar_name)')
    .order('id');

  if (err3) {
    console.error('Error:', err3);
    return;
  }

  console.log(`✅ ${archetypes.length} archetypes exported\n`);

  // ===== SAVE TO FILES =====
  const output = {
    exported_at: new Date().toISOString(),
    counts: {
      canonical_foods: canonicals.length,
      cultivars: cultivars.length,
      archetypes: archetypes.length
    },
    canonical_foods: canonicals,
    cultivars: cultivars,
    archetypes: archetypes
  };

  fs.writeFileSync('DB_FULL_EXPORT.json', JSON.stringify(output, null, 2));
  console.log('✅ Full export saved to DB_FULL_EXPORT.json');

  // ===== CREATE READABLE REPORT =====
  let report = '';

  report += '═══════════════════════════════════════════════════════\n';
  report += '   EXPORT COMPLET DE LA BASE DE DONNÉES\n';
  report += '═══════════════════════════════════════════════════════\n\n';

  report += `Exporté le: ${new Date().toISOString()}\n\n`;

  report += '📊 TOTAUX:\n';
  report += `  - ${canonicals.length} canonical foods\n`;
  report += `  - ${cultivars.length} cultivars\n`;
  report += `  - ${archetypes.length} archetypes\n\n`;

  report += '═══════════════════════════════════════════════════════\n';
  report += '   1. CANONICAL FOODS\n';
  report += '═══════════════════════════════════════════════════════\n\n';

  canonicals.forEach(c => {
    report += `[${c.id}] ${c.canonical_name} (unit: ${c.primary_unit})\n`;
  });

  report += '\n═══════════════════════════════════════════════════════\n';
  report += '   2. CULTIVARS\n';
  report += '═══════════════════════════════════════════════════════\n\n';

  cultivars.forEach(c => {
    report += `[${c.id}] ${c.cultivar_name} → canonical: ${c.canonical_foods?.canonical_name || 'NULL'}\n`;
    if (c.notes) report += `    Notes: ${c.notes}\n`;
  });

  report += '\n═══════════════════════════════════════════════════════\n';
  report += '   3. ARCHETYPES (grouped by canonical)\n';
  report += '═══════════════════════════════════════════════════════\n\n';

  // Group archetypes by canonical or cultivar
  const byBase = {};
  archetypes.forEach(a => {
    let base;
    if (a.canonical_food_id) {
      base = `CANONICAL: ${a.canonical_foods?.canonical_name || 'NULL'}`;
    } else if (a.cultivar_id) {
      base = `CULTIVAR: ${a.cultivars?.cultivar_name || 'NULL'}`;
    } else {
      base = 'ORPHAN (no base)';
    }

    if (!byBase[base]) byBase[base] = [];
    byBase[base].push(a);
  });

  Object.entries(byBase).sort().forEach(([base, archs]) => {
    report += `\n${base} (${archs.length} archetypes):\n`;
    report += '─'.repeat(60) + '\n';

    archs.forEach(a => {
      const parentInfo = a.parent_archetype_id ? ` [parent: ${a.parent_archetype_id}]` : '';
      report += `  [${a.id}] ${a.name}${parentInfo}\n`;
      if (a.process) report += `      Process: ${a.process}\n`;
    });
  });

  fs.writeFileSync('DB_FULL_EXPORT_READABLE.txt', report);
  console.log('✅ Readable report saved to DB_FULL_EXPORT_READABLE.txt\n');

  console.log('✅ Export complete! Files created:');
  console.log('   - DB_FULL_EXPORT.json (JSON format)');
  console.log('   - DB_FULL_EXPORT_READABLE.txt (human-readable)');
}

exportFullDatabase();
