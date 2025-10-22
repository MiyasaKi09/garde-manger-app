#!/bin/bash
# Script qui récupère les recettes de la DB et génère le SQL

echo "🔄 Récupération des recettes depuis la base de données..."
echo "📊 Ce script va:"
echo "   1. Se connecter à PostgreSQL"
echo "   2. Récupérer les 1058 recettes (id, name, role)"
echo "   3. Générer le fichier SQL d'enrichissement complet"
echo ""
echo "⚠️  IMPORTANT: Utilisez l'outil pgsql_query dans VS Code pour:"
echo "   1. Exécuter: SELECT id, name, role FROM recipes ORDER BY id"
echo "   2. Copier les résultats CSV"
echo "   3. Les coller dans un fichier all_recipes_data.csv"
echo ""
echo "Ensuite, lancez:"
echo "   python3 final_sql_generator.py all_recipes_data.csv"
echo ""
