# 📚 Index - Documentation du Projet

**Projet** : Garde-Manger App  
**Module** : Enrichissement des Recettes & Qualité des Données  
**Date** : 27 octobre 2025

---

## ⚡ COMMENCER ICI

### 🚨 Statut Actuel
**→ [STATUS.md](STATUS.md)** - Diagnostic complet du projet

### ⚡ Action Immédiate
**→ [AIDE_RAPIDE.md](AIDE_RAPIDE.md)** - Ce qu'il faut faire MAINTENANT

---

## 🎉 NOUVEAUTÉ : Correction des Calories (27 oct 2025)

### 📊 Qualité des Données Nutritionnelles

**→ [RAPPORT_CORRECTION_CALORIES_FINAL.md](RAPPORT_CORRECTION_CALORIES_FINAL.md)** - Rapport complet  
- ✅ 2980 calories corrigées (88.6% de réduction des NULL)
- ✅ Formule d'Atwater appliquée automatiquement
- ✅ 0 erreurs durant l'exécution
- ⚠️ 100 aliments restants avec données sources incomplètes

**→ [RAPPORT_TESTS_NUTRITIONNELS.md](RAPPORT_TESTS_NUTRITIONNELS.md)** - Tests initiaux & diagnostic

**→ [REQUETES_MONITORING_NUTRITION.md](REQUETES_MONITORING_NUTRITION.md)** - 12 requêtes SQL de monitoring  
- Comptage calories NULL
- Détection recettes aberrantes
- Score de complétude nutritionnelle
- Tests de non-régression

---

## 📖 Guides d'Exécution

### Pour Enrichir les Recettes

1. **[GUIDE_ENRICHISSEMENT_MANUEL.md](GUIDE_ENRICHISSEMENT_MANUEL.md)** - ⭐ Guide exécution Supabase (NOUVEAU - 27 oct)
2. **[FICHIERS_A_EXECUTER.md](FICHIERS_A_EXECUTER.md)** - Liste des fichiers SQL + instructions courtes
3. **[GUIDE_EXECUTION_SUPABASE.md](GUIDE_EXECUTION_SUPABASE.md)** - Guide détaillé étape par étape
4. **[REQUETES_TEST.md](REQUETES_TEST.md)** - 9 requêtes pour vérifier après enrichissement

---

## 📐 Documentation Technique

### Architecture & Conception

4. **[ASSEMBLAGE_INTELLIGENT.md](ASSEMBLAGE_INTELLIGENT.md)** - Documentation théorique complète
   - Taxonomie des tags (45 + 50 nouveaux)
   - Règles d'assemblage (Food Pairing, Équilibre, Contraste, Terroir)
   - Algorithme de scoring
   - Exemples d'API React

5. **[SCHEMA_DATABASE.md](SCHEMA_DATABASE.md)** - Architecture complète de la base de données
   - Hiérarchie alimentaire (4 niveaux)
   - Modèle de déconstruction des recettes
   - Module profil utilisateur
   - Système de tags

---

## 🛠️ Scripts & Outils

### Dossier tools/

6. **[tools/README.md](tools/README.md)** - Documentation du dossier tools/
   - Fichiers à exécuter
   - Scripts source
   - Utilitaires

### Fichiers SQL Principaux

- **[tools/enrichment_optimized.sql](tools/enrichment_optimized.sql)** - Fichier unique (RECOMMANDÉ)
- **[tools/batch_1_of_28.sql](tools/batch_1_of_28.sql)** à **[tools/batch_28_of_28.sql](tools/batch_28_of_28.sql)** - Fichiers découpés

### Scripts Python

- **[tools/enrich_recipes_v3_complete.py](tools/enrich_recipes_v3_complete.py)** - Générateur d'enrichissement

---

## 📊 Guides d'Import (Référence)

7. **[tools/GUIDE_IMPORT_RECETTES.md](tools/GUIDE_IMPORT_RECETTES.md)** - Guide d'import initial
8. **[tools/RAPPORT_IMPORT.md](tools/RAPPORT_IMPORT.md)** - Rapport d'import (611 recettes)

---

## 🧹 Maintenance

9. **[tools/CLEANUP_PLAN.md](tools/CLEANUP_PLAN.md)** - Plan de nettoyage appliqué (40 fichiers supprimés)

---

## 🎯 Flux de Travail Recommandé

```
1. Lire STATUS.md
   ↓
2. Lire AIDE_RAPIDE.md
   ↓
3. Suivre FICHIERS_A_EXECUTER.md
   ↓
4. Exécuter tools/enrichment_optimized.sql dans Supabase
   ↓
5. Vérifier avec REQUETES_TEST.md
   ↓
6. Implémenter l'API basée sur ASSEMBLAGE_INTELLIGENT.md
```

---

## 📈 État d'Avancement

| Tâche | Statut | Fichier |
|-------|--------|---------|
| Import des recettes | ✅ Terminé | tools/RAPPORT_IMPORT.md |
| Création des tags | ✅ Terminé | - |
| Correction calories nutritionnelles | ✅ **Terminé (27 oct)** | RAPPORT_CORRECTION_CALORIES_FINAL.md |
| Enrichissement des recettes | ⚠️ **En cours** | AIDE_RAPIDE.md |
| Tests d'assemblage | ⏳ À faire | REQUETES_TEST.md |
| Implémentation API | ⏳ À faire | ASSEMBLAGE_INTELLIGENT.md |

---

## 🔢 Chiffres Clés

- **611 recettes** importées
- **77 tags** créés (45 anciens + 32 nouveaux)
- **3178 aliments** dans la base nutritionnelle
- **2980 calories** corrigées (94% de complétude)
- **1362 associations** à créer (tags → recettes)
- **361 associations** actuellement (⚠️ incomplet)
- **40 fichiers** nettoyés du dossier tools/

---

## 🆘 Aide

**Problème d'exécution ?**  
→ Voir **GUIDE_EXECUTION_SUPABASE.md** section "Dépannage"

**Questions sur les données nutritionnelles ?**  
→ Voir **REQUETES_MONITORING_NUTRITION.md**

**Questions théoriques assemblage ?**  
→ Voir **ASSEMBLAGE_INTELLIGENT.md**

**Doute sur quoi faire ?**  
→ Lire **AIDE_RAPIDE.md** puis **STATUS.md**

---

**Dernière mise à jour** : 27 octobre 2025, 21:30 UTC  
**Version** : 4.0 - Post-correction calories nutritionnelles
