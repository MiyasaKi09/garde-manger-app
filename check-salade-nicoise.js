// Script pour vérifier les données de la recette Salade niçoise
const fs = require('fs');
const path = require('path');

// Lire le fichier CSV des recettes
const csvPath = path.join(__dirname, 'supabase', 'exports', 'latest', 'csv', 'recipes.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Trouver la ligne de la Salade niçoise
const lines = csvContent.split('\n');
const header = lines[0];
const saladeNicoiseLine = lines.find(line => line.includes('Salade niçoise') || line.includes('9401'));

console.log('=== En-tête CSV ===');
console.log(header);
console.log('\n=== Recette Salade niçoise ===');
console.log(saladeNicoiseLine);

// Découper en colonnes
const headerCols = header.split(',');
const dataCols = saladeNicoiseLine ? saladeNicoiseLine.split(',') : [];

console.log('\n=== Détail des colonnes ===');
headerCols.forEach((col, index) => {
  console.log(`${col}: ${dataCols[index] || 'VIDE'}`);
});

console.log('\n=== Vérification ===');
console.log('Nombre de colonnes dans le header:', headerCols.length);
console.log('Nombre de colonnes dans les données:', dataCols.length);
console.log('Colonne "instructions" présente dans le CSV:', headerCols.includes('instructions') ? 'OUI' : 'NON');
