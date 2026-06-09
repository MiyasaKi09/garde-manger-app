// Génère le SQL d'insertion de la table ciqual_reference à partir du CSV CIQUAL.
// Usage : node scripts/generate-ciqual-inserts.js > /tmp/ciqual_inserts.sql
// Le CSV source (data/mapping_canonical_ciqual.csv) est encodé Windows-1252
// avec des terminateurs NEL (U+0085) à l'intérieur de certains champs.

const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '..', 'data', 'mapping_canonical_ciqual.csv');
const raw = fs.readFileSync(csvPath, 'latin1')
  .replace(//g, ' ')
  .replace(/\r\n/g, '\n')
  .replace(/\r/g, '\n');

const lines = raw.split('\n').filter(Boolean);
const esc = (s) => s.replace(/'/g, "''").trim();

const rows = [];
for (const line of lines.slice(1)) {
  const cols = line.split(';');
  if (cols.length < 9) continue;
  const [grp, ssgrp, code, name] = [cols[3], cols[4], cols[6], cols[7]];
  if (!code?.trim() || !name?.trim()) continue;
  rows.push(`('${esc(code)}','${esc(name)}','${esc(grp || '')}','${esc(ssgrp || '')}')`);
}

const BATCH = 160;
const chunks = [];
for (let i = 0; i < rows.length; i += BATCH) {
  chunks.push(
    'INSERT INTO ciqual_reference (alim_code, alim_nom_fr, groupe, sous_groupe) VALUES\n' +
    rows.slice(i, i + BATCH).join(',\n') +
    '\nON CONFLICT (alim_code) DO NOTHING;'
  );
}

process.stdout.write(chunks.join('\n\n') + '\n');
process.stderr.write(`${rows.length} lignes, ${chunks.length} lots\n`);
