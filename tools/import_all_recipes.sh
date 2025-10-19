#!/bin/bash

# Script d'import automatisé des recettes dans Supabase
# Usage: ./import_all_recipes.sh

set -e  # Arrête le script en cas d'erreur

echo "🍳 Import automatisé des 600 recettes dans Supabase"
echo "====================================================="
echo ""

# Vérifier que le fichier SQL existe
if [ ! -f "tools/import_recipes.sql" ]; then
    echo "❌ Erreur : Le fichier tools/import_recipes.sql n'existe pas"
    echo "   Veuillez d'abord exécuter : python3 tools/import_recipes.py"
    exit 1
fi

# Charger les variables d'environnement
if [ -f ".env.local" ]; then
    echo "📝 Chargement des variables d'environnement..."
    set -a
    source .env.local
    set +a
else
    echo "❌ Erreur : Le fichier .env.local n'existe pas"
    exit 1
fi

# Vérifier que DATABASE_URL_TX est défini
if [ -z "$DATABASE_URL_TX" ]; then
    echo "❌ Erreur : La variable DATABASE_URL_TX n'est pas définie"
    exit 1
fi

echo "✅ Configuration OK"
echo ""

# Afficher un avertissement
echo "⚠️  ATTENTION"
echo "   Ce script va insérer 600 nouvelles recettes dans votre base"
echo "   Voulez-vous continuer ? (y/N)"
read -r response

if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "❌ Import annulé"
    exit 0
fi

echo ""
echo "🚀 Démarrage de l'import..."
echo ""

# Exécuter le script SQL
if psql "$DATABASE_URL_TX" -f tools/import_recipes.sql; then
    echo ""
    echo "✅ Import réussi !"
    echo ""
    
    # Afficher les statistiques
    echo "📊 Statistiques post-import :"
    echo ""
    psql "$DATABASE_URL_TX" -c "
        SELECT 
            'Nombre total de recettes' as info, 
            COUNT(*)::text as valeur 
        FROM recipes
        UNION ALL
        SELECT 
            'Nombre de tags', 
            COUNT(*)::text 
        FROM tags
        UNION ALL
        SELECT 
            'Nombre d''associations recipe_tags', 
            COUNT(*)::text 
        FROM recipe_tags;
    "
    
    echo ""
    echo "🎉 Félicitations ! Votre base contient maintenant toutes les recettes !"
    echo ""
else
    echo ""
    echo "❌ Erreur lors de l'import"
    echo "   Vérifiez les logs ci-dessus pour plus de détails"
    exit 1
fi
