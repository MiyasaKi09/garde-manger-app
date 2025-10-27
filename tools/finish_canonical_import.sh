#!/bin/bash
#
# Script pour finir l'import des canonical_foods
# Batches 1-2 déjà exécutés (90/227 lignes)
# Reste: batches 3-6 (137 lignes)
#

set -e

echo "🔄 Finalisation import canonical_foods..."
echo "   Batches 3-6 restants (137 lignes)"
echo ""

# Note: Ce script devrait utiliser psql avec DATABASE_URL_DIRECT
# Mais vu les problèmes de connexion pooler, on va plutôt générer
# les statements SQL pour exécution via pgsql_modify tool

echo "📝 Génération des statements SQL pour batches 3-6..."

for batch in 3 4 5 6; do
    if [ -f "/tmp/canonical_batch${batch}.sql" ]; then
        echo "  ✓ Batch $batch prêt ($(wc -l < /tmp/canonical_batch${batch}.sql) lignes)"
    else
        echo "  ❌ Batch $batch manquant"
        exit 1
    fi
done

echo ""
echo "✅ Tous les batches sont prêts"
echo ""
echo "🎯 Prochaine étape: Exécuter via pgsql_modify tool:"
echo "   - Batch 3: /tmp/canonical_batch3.sql"
echo "   - Batch 4: /tmp/canonical_batch4.sql"  
echo "   - Batch 5: /tmp/canonical_batch5.sql"
echo "   - Batch 6: /tmp/canonical_batch6.sql"
echo ""
echo "Ou utiliser l'approche automatisée dans finish_import_python.py"
