# 🧹 Plan de Nettoyage du dossier tools/

## Fichiers À GARDER ✅

### Documentation
- GUIDE_IMPORT_RECETTES.md
- RAPPORT_IMPORT.md
- schema_report.sql

### Script final d'enrichissement (LE SEUL À EXÉCUTER)
- enrichment_optimized.sql (FICHIER PRINCIPAL - 221 KB)

### Scripts batch (alternative si enrichment_optimized.sql timeout)
- batch_1_of_28.sql à batch_28_of_28.sql (28 fichiers)

### Scripts Python source (pour régénération si besoin)
- enrich_recipes_v3_complete.py (script de génération final)

---

## Fichiers À SUPPRIMER ❌

### Anciennes versions d'enrichissement
- enrich_all_recipes.sql
- enrich_batch_01.sql à enrich_batch_13.sql (13 fichiers)
- enrich_recipes.py
- enrich_recipes_v2.py
- enrich_recipes_v2.sql
- enrich_recipes_v3_complete.sql (généré, pas besoin de garder)
- enrich_tags.sql
- enrich_via_api.py
- enrichment_batch_1.sql à enrichment_batch_7.sql (7 fichiers)
- enrichment_part1.sql

### Scripts d'exécution obsolètes
- execute_enrichment.py
- execute_enrichment.sh
- generate_enrichment.py
- optimize_enrichment.py
- run_enrichment.sh
- split_enrichment.py

### Scripts d'import (déjà exécutés)
- create_import_batches.py
- import_all_recipes.sh
- import_recipes.py
- import_recipes.sql
- import_recipes_direct.py
- verify_recipes.py

---

## Total
- **À GARDER** : 33 fichiers (3 docs + 1 SQL principal + 28 batches + 1 Python)
- **À SUPPRIMER** : 40 fichiers obsolètes
