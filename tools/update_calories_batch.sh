#!/bin/bash
# Script pour mettre à jour les calories manquantes dans nutritional_data
# À exécuter via pgsql_modify en 6 batches de ~500 UPDATE

set -e

echo "🔄 Mise à jour des calories dans nutritional_data"
echo "================================================"
echo ""
echo "⚠️  ATTENTION : Ce script doit être exécuté via pgsql_modify"
echo "    car le pooler DATABASE_URL_TX ne fonctionne pas."
echo ""
echo "📊 Statistiques :"
echo "   - Total UPDATE statements : 2980"
echo "   - Batches créés : 6 fichiers de ~500 lignes"
echo "   - Fichiers : /tmp/update_calories_batch_*"
echo ""

# Lister les fichiers batch
echo "📁 Fichiers batch disponibles :"
ls -lh /tmp/update_calories_batch_* 2>/dev/null || echo "   ❌ Fichiers non trouvés. Exécuter d'abord :"
if [ ! -f /tmp/update_calories_batch_aa ]; then
    echo "      cd /workspaces/garde-manger-app"
    echo "      python3 tools/generate_calories_updates.py"
    echo ""
    exit 1
fi

echo ""
echo "✅ Fichiers batch prêts"
echo ""
echo "🚀 Pour exécuter via Copilot/pgsql_modify :"
echo "   1. Batch aa (500 lignes) : cat /tmp/update_calories_batch_aa"
echo "   2. Batch ab (500 lignes) : cat /tmp/update_calories_batch_ab"
echo "   3. Batch ac (500 lignes) : cat /tmp/update_calories_batch_ac"
echo "   4. Batch ad (500 lignes) : cat /tmp/update_calories_batch_ad"
echo "   5. Batch ae (500 lignes) : cat /tmp/update_calories_batch_ae"
echo "   6. Batch af (480 lignes) : cat /tmp/update_calories_batch_af"
echo ""
echo "⏱️  Temps estimé : ~5 minutes (via pgsql_modify)"
echo ""

# Vérifier le nombre total
total=$(wc -l /tmp/update_calories.sql | awk '{print $1}')
echo "✔️  Total vérifié : $total UPDATE statements"
