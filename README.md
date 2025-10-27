# 🍽️ Garde-Manger App

**Application intelligente de gestion de garde-manger et planification de repas**

Next.js + Supabase + PostgreSQL + Données nutritionnelles Ciqual

---

## 🎉 Dernières Nouveautés

### ✅ 27 octobre 2025 : Correction Massive des Calories
- **2980 valeurs** `calories_kcal` corrigées automatiquement
- **88.6% de réduction** des données manquantes (880 → 100)
- **Formule d'Atwater** appliquée sur 780 aliments
- **30% des recettes** aberrantes corrigées

**→ Voir [RAPPORT_CORRECTION_CALORIES_FINAL.md](RAPPORT_CORRECTION_CALORIES_FINAL.md)**

---

## 📊 Statut du Projet

| Composant | Statut | Complétude |
|-----------|--------|------------|
| Base de données | ✅ Opérationnelle | 100% |
| Recettes importées | ✅ 611 recettes | 100% |
| Données nutritionnelles | ✅ Corrigées | 96.9% |
| Tags créés | ✅ 77 tags | 100% |
| Enrichissement tags | ⚠️ En cours | 26.5% |
| API assemblage intelligent | ⏳ À faire | 0% |

**→ Voir [STATUS.md](STATUS.md) pour le diagnostic complet**

---

## 📚 Documentation

### ⚡ Démarrage Rapide
- **[INDEX.md](INDEX.md)** - Table des matières complète
- **[AIDE_RAPIDE.md](AIDE_RAPIDE.md)** - Guide démarrage rapide
- **[STATUS.md](STATUS.md)** - État actuel du projet

### 📊 Qualité des Données
- **[RAPPORT_CORRECTION_CALORIES_FINAL.md](RAPPORT_CORRECTION_CALORIES_FINAL.md)** - Correction 2980 calories
- **[REQUETES_MONITORING_NUTRITION.md](REQUETES_MONITORING_NUTRITION.md)** - 12 requêtes SQL de monitoring
- **[HISTORIQUE_COMMANDES_CALORIES.md](HISTORIQUE_COMMANDES_CALORIES.md)** - Commandes exécutées

### 🛠️ Guides Techniques
- **[SCHEMA_DATABASE.md](SCHEMA_DATABASE.md)** - Architecture complète de la base
- **[ASSEMBLAGE_INTELLIGENT.md](ASSEMBLAGE_INTELLIGENT.md)** - Système d'assemblage recettes
- **[GUIDE_EXECUTION_SUPABASE.md](GUIDE_EXECUTION_SUPABASE.md)** - Exécution SQL pas à pas

---

## 🔢 Chiffres Clés

- **611 recettes** dans la base
- **3178 aliments** nutritionnels (Ciqual)
- **2980 calories** corrigées automatiquement
- **77 tags** gastronomiques
- **96.9% complétude** des données nutritionnelles
- **0 erreurs** durant la correction massive

---

## 🚀 Technologies

- **Frontend** : Next.js 14 + React 18
- **Backend** : Supabase (PostgreSQL)
- **Base nutritionnelle** : Ciqual (ANSES)
- **Formule nutritionnelle** : Atwater (standard international)

---

## 📖 Navigation

- [INDEX.md](INDEX.md) - Table des matières complète
- [tools/](tools/) - Scripts et fichiers SQL
- [RAPPORT_CORRECTION_CALORIES_FINAL.md](RAPPORT_CORRECTION_CALORIES_FINAL.md) - Dernière correction majeure

---

**Dernière mise à jour** : 27 octobre 2025  
**Version** : 4.0 - Post-correction calories nutritionnelles
