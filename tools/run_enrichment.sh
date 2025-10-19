#!/bin/bash
# Script d'exécution de tous les batches d'enrichissement

set -a
[ -f .env.local ] && source .env.local
set +a

echo "🎨 Enrichissement massif des recettes"
echo "======================================"
echo ""

# Vérifier que DATABASE_URL_TX est défini
if [ -z "$DATABASE_URL_TX" ]; then
    echo "❌ Erreur : DATABASE_URL_TX n'est pas défini"
    exit 1
fi

# Compter les batches
batch_count=$(ls -1 tools/enrich_batch_*.sql 2>/dev/null | wc -l)
echo "📦 $batch_count batches détectés"
echo ""

# Exécuter chaque batch
success=0
failed=0

for batch_file in tools/enrich_batch_*.sql; do
    batch_num=$(basename "$batch_file" | sed 's/enrich_batch_\([0-9]*\)\.sql/\1/')
    echo "▶️  Batch $batch_num en cours..."
    
    if psql "$DATABASE_URL_TX" -f "$batch_file" > /dev/null 2>&1; then
        echo "   ✅ Batch $batch_num : succès"
        ((success++))
    else
        echo "   ❌ Batch $batch_num : échec"
        ((failed++))
    fi
done

echo ""
echo "📊 Résumé :"
echo "   - Succès : $success batches"
echo "   - Échecs : $failed batches"
echo ""

# Statistiques finales
echo "📈 Statistiques finales :"
psql "$DATABASE_URL_TX" -c "
SELECT 
    COUNT(DISTINCT r.id) as nb_recettes_enrichies,
    COUNT(rt.id) as nb_associations_tags
FROM recipes r
LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
WHERE EXISTS (
    SELECT 1 FROM tags t 
    WHERE t.id = rt.tag_id 
    AND (t.name LIKE 'difficulté:%' OR t.name LIKE 'saison:%' OR t.name LIKE 'usage:%' OR t.name LIKE 'profil:%')
);
"

echo ""
echo "✨ Enrichissement terminé !"
