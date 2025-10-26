# ANALYSE COMPARATIVE DES FICHIERS SOURCES

## 📊 Statistiques

| Fichier | Recettes | Ingrédients uniques | Verdict |
|---------|----------|---------------------|---------|
| **COMPLETE.txt** | 195 | **441** ✅ | ✅ **MEILLEUR** |
| NORMALISEE.txt | 468 | 703 | ❌ Trop de doublons |
| NORMALISEE (2).txt | 469 | **686** | ❌ Encore pire |

## 🔍 Problèmes identifiés dans NORMALISEE (2).txt

### 1. Doublons oignon/oignons
- `oignon` : 120x
- `oignon blanc` : 1x
- `oignon frit` : 1x  
- `oignon grelot` : 1x
- `oignon nouveaux` : 1x
- `oignon rouge` : 8x
- `oignon vert` : 1x

**Total : 132 occurrences fragmentées** au lieu d'être normalisées en quelques variantes.

### 2. Doublons ail/gousses d'ail
- `ail` : 135x
- `ail (facultatif)` : 1x
- `ail en poudre` : 3x
- `gousse d'ail` : 27x

**Total : 166 occurrences** pour le même ingrédient de base.

### 3. Problème de normalisation générale

Le fichier NORMALISEE (2).txt contient **686 ingrédients uniques**, soit :
- **245 de plus** que COMPLETE.txt (441)
- **17 de moins** que le premier NORMALISEE.txt (703)

Cela signifie qu'il y a encore **énormément de doublons** :
- Variations singulier/pluriel
- Variations avec/sans "gousse"
- Variations avec qualificatifs (facultatif, en poudre, etc.)

## ✅ Conclusion

**COMPLETE.txt reste le meilleur fichier source** avec :
- ✅ 441 ingrédients uniques (le plus normalisé)
- ✅ Moins de doublons
- ✅ Meilleure qualité de normalisation

Les fichiers "NORMALISEE" sont ironiquement **MOINS normalisés** que le fichier "COMPLETE".

**Recommandation** : Continuer à utiliser COMPLETE.txt et le SQL généré `INSERT_INGREDIENTS_FINAL_V9.sql`.
