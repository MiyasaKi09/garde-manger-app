# Index - Système de Gestion des Restes (3 Phases)

## 📚 Vue d'Ensemble

Ce projet implémente un **système ultra-complet de gestion des restes** pour l'application garde-manger, en 3 phases :

1. **Phase 1** : DLC après ouverture ✅ **COMPLÈTE**
2. **Phase 2** : Plats cuisinés avec portions ⏳ **À FAIRE**
3. **Phase 3** : Planning intelligent anti-gaspillage ⏳ **À FAIRE**

---

## 📖 Documentation par Thème

### 🎯 Pour Commencer

| Document | Description | Quand l'utiliser |
|----------|-------------|------------------|
| **[README.md](README.md)** | Vue générale du projet | Découvrir le projet |
| **[STATUS.md](STATUS.md)** | État actuel du projet | Vérifier le statut global |
| **[INDEX.md](INDEX.md)** | Navigation dans la doc (ce fichier) | Trouver un document |

---

### 📋 Spécifications Complètes

| Document | Description | Contenu |
|----------|-------------|---------|
| **[SPEC_SYSTEME_RESTES_COMPLET.md](SPEC_SYSTEME_RESTES_COMPLET.md)** | Spécifications complètes 3 phases | Architecture, user stories, code complet pour les 3 phases |
| **[INTEGRATION_RESTES_GARDE_MANGER.md](INTEGRATION_RESTES_GARDE_MANGER.md)** | Intégration dans le garde-manger | Système d'onglets, avantages, workflows |

**Taille** : 1000+ lignes  
**Utilisation** : Comprendre la vision complète, consulter les exemples de code

---

### ✅ Phase 1 : DLC après Ouverture (COMPLÈTE)

| Document | Description | Utilisation |
|----------|-------------|-------------|
| **[PHASE1_DLC_OUVERTURE_COMPLETE.md](PHASE1_DLC_OUVERTURE_COMPLETE.md)** | Guide complet Phase 1 | Documentation de référence (650 lignes) |
| **[GUIDE_EXECUTION_PHASE1.md](GUIDE_EXECUTION_PHASE1.md)** | Procédure d'installation | Exécuter la migration SQL (350 lignes) |
| **[RECAPITULATIF_PHASE1.md](RECAPITULATIF_PHASE1.md)** | Synthèse Phase 1 | Vue rapide de ce qui a été fait |
| **[SQL_AIDE_MEMOIRE_PHASE1.md](SQL_AIDE_MEMOIRE_PHASE1.md)** | Commandes SQL utiles | Vérifications, tests, maintenance |

#### Fichiers Créés/Modifiés
- ✅ `supabase/migrations/001_shelf_life_after_opening.sql` (Migration DB)
- ✅ `lib/shelfLifeRules.js` (Règles métier, 30+ catégories)
- ✅ `lib/lotManagementService.js` (Service de gestion)
- ✅ `app/api/lots/manage/route.js` (API REST)
- ✅ `app/pantry/components/PantryProductCard.jsx` (UI modifiée)
- ✅ `app/pantry/page.js` (UI modifiée)
- ✅ `app/pantry/pantry.css` (Styles modifiés)

**Statut** : ✅ Code complet, ⏳ Migration à exécuter

---

### ⏳ Phase 2 : Plats Cuisinés (À FAIRE)

**Objectifs** :
- Créer tables `cooked_dishes` et `cooked_dish_ingredients`
- Service pour créer/gérer plats cuisinés
- Tracking des portions (cuisinées vs restantes)
- Intégration dans l'onglet "À Risque"

**Documents à créer** :
- `PHASE2_PLATS_CUISINES_COMPLETE.md`
- `GUIDE_EXECUTION_PHASE2.md`

**Fichiers à créer** :
- `supabase/migrations/002_cooked_dishes.sql`
- `lib/cookedDishesService.js`
- `app/pantry/components/CookedDishesManager.jsx`
- `app/api/cooked-dishes/route.js`

---

### ⏳ Phase 3 : Planning Intelligent (À FAIRE)

**Objectifs** :
- Détecter les restes (plats + ingrédients)
- Suggérer repas optimisés anti-gaspillage
- Priorités : Finir plats > Utiliser ingrédients > Nouvelles recettes

**Documents à créer** :
- `PHASE3_PLANNING_INTELLIGENT_COMPLETE.md`
- `GUIDE_EXECUTION_PHASE3.md`

**Fichiers à créer** :
- `lib/planningService.js`
- `app/planning/components/LeftoversPriority.jsx`
- `app/api/planning/priorities/route.js`

---

## 🗂️ Documentation par Type

### 📘 Guides d'Installation

1. **[GUIDE_EXECUTION_PHASE1.md](GUIDE_EXECUTION_PHASE1.md)** : Installer Phase 1
   - Méthode Dashboard Supabase
   - Méthode CLI
   - Tests de vérification
   - Dépannage

### 📗 Guides d'Utilisation

1. **[PHASE1_DLC_OUVERTURE_COMPLETE.md](PHASE1_DLC_OUVERTURE_COMPLETE.md)** : Utiliser Phase 1
   - Architecture complète
   - Workflows utilisateur
   - Tests recommandés
   - Dépannage

### 📙 Références Techniques

1. **[SPEC_SYSTEME_RESTES_COMPLET.md](SPEC_SYSTEME_RESTES_COMPLET.md)** : Spécifications 3 phases
2. **[SQL_AIDE_MEMOIRE_PHASE1.md](SQL_AIDE_MEMOIRE_PHASE1.md)** : Commandes SQL
3. **[RECAPITULATIF_PHASE1.md](RECAPITULATIF_PHASE1.md)** : Synthèse Phase 1

### 📕 Documentation Historique

| Document | Description |
|----------|-------------|
| **[AIDE_RAPIDE.md](AIDE_RAPIDE.md)** | Aide rapide générale |
| **[SCHEMA_DATABASE.md](SCHEMA_DATABASE.md)** | Schéma de la base de données |
| **[STATUS.md](STATUS.md)** | État du projet |

---

## 🚀 Parcours Recommandé

### Pour Découvrir le Projet
1. [README.md](README.md) → Vue générale
2. [STATUS.md](STATUS.md) → État actuel
3. [SPEC_SYSTEME_RESTES_COMPLET.md](SPEC_SYSTEME_RESTES_COMPLET.md) → Vision complète

### Pour Installer Phase 1
1. [RECAPITULATIF_PHASE1.md](RECAPITULATIF_PHASE1.md) → Comprendre ce qui a été fait
2. [GUIDE_EXECUTION_PHASE1.md](GUIDE_EXECUTION_PHASE1.md) → Suivre la procédure
3. [SQL_AIDE_MEMOIRE_PHASE1.md](SQL_AIDE_MEMOIRE_PHASE1.md) → Tester avec SQL

### Pour Utiliser Phase 1
1. [PHASE1_DLC_OUVERTURE_COMPLETE.md](PHASE1_DLC_OUVERTURE_COMPLETE.md) → Guide complet
2. [SQL_AIDE_MEMOIRE_PHASE1.md](SQL_AIDE_MEMOIRE_PHASE1.md) → Requêtes utiles

### Pour Développer Phase 2/3
1. [SPEC_SYSTEME_RESTES_COMPLET.md](SPEC_SYSTEME_RESTES_COMPLET.md) → Consulter les specs
2. [PHASE1_DLC_OUVERTURE_COMPLETE.md](PHASE1_DLC_OUVERTURE_COMPLETE.md) → S'inspirer de Phase 1

---

## 📊 Fichiers Code par Fonctionnalité

### Phase 1 : DLC après Ouverture

| Fonctionnalité | Fichiers |
|----------------|----------|
| **Base de données** | `supabase/migrations/001_shelf_life_after_opening.sql` |
| **Règles métier** | `lib/shelfLifeRules.js` |
| **Service** | `lib/lotManagementService.js` |
| **API REST** | `app/api/lots/manage/route.js` |
| **UI - Carte produit** | `app/pantry/components/PantryProductCard.jsx` |
| **UI - Page pantry** | `app/pantry/page.js` |
| **Styles** | `app/pantry/pantry.css` |

### Phase 2 : Plats Cuisinés (À CRÉER)

| Fonctionnalité | Fichiers |
|----------------|----------|
| **Base de données** | `supabase/migrations/002_cooked_dishes.sql` ⏳ |
| **Service** | `lib/cookedDishesService.js` ⏳ |
| **API REST** | `app/api/cooked-dishes/route.js` ⏳ |
| **UI - Manager** | `app/pantry/components/CookedDishesManager.jsx` ⏳ |

### Phase 3 : Planning Intelligent (À CRÉER)

| Fonctionnalité | Fichiers |
|----------------|----------|
| **Service** | `lib/planningService.js` ⏳ |
| **API REST** | `app/api/planning/priorities/route.js` ⏳ |
| **UI - Priorités** | `app/planning/components/LeftoversPriority.jsx` ⏳ |

---

## 🎯 Objectifs par Phase

### Phase 1 : DLC après Ouverture ✅
- [x] Tracking ouverture des produits
- [x] Ajustement automatique de la DLC
- [x] 30+ catégories de produits
- [x] UI avec badge "Ouvert" et DLC ajustée
- [x] API REST complète
- [x] Documentation complète

### Phase 2 : Plats Cuisinés ⏳
- [ ] Créer plat cuisiné (recette + portions)
- [ ] Tracker portions restantes
- [ ] Consommer portions
- [ ] Congeler/décongeler plats
- [ ] Intégration "À Risque"
- [ ] Déduction ingrédients de l'inventaire

### Phase 3 : Planning Intelligent ⏳
- [ ] Détecter restes (plats + ingrédients)
- [ ] Suggestions repas anti-gaspillage
- [ ] Priorités intelligentes
- [ ] Intégration planning
- [ ] Notifications restes

---

## 🔍 Recherche Rapide

### Besoin de...

**Exécuter la migration SQL ?**
→ [GUIDE_EXECUTION_PHASE1.md](GUIDE_EXECUTION_PHASE1.md)

**Comprendre l'architecture complète ?**
→ [SPEC_SYSTEME_RESTES_COMPLET.md](SPEC_SYSTEME_RESTES_COMPLET.md)

**Voir ce qui a été fait en Phase 1 ?**
→ [RECAPITULATIF_PHASE1.md](RECAPITULATIF_PHASE1.md)

**Tester avec des requêtes SQL ?**
→ [SQL_AIDE_MEMOIRE_PHASE1.md](SQL_AIDE_MEMOIRE_PHASE1.md)

**Dépanner un problème Phase 1 ?**
→ [PHASE1_DLC_OUVERTURE_COMPLETE.md](PHASE1_DLC_OUVERTURE_COMPLETE.md) (section Dépannage)

**Comprendre les règles métier ?**
→ `lib/shelfLifeRules.js` (code) ou [PHASE1_DLC_OUVERTURE_COMPLETE.md](PHASE1_DLC_OUVERTURE_COMPLETE.md) (doc)

**Voir les user stories Phase 2/3 ?**
→ [SPEC_SYSTEME_RESTES_COMPLET.md](SPEC_SYSTEME_RESTES_COMPLET.md)

---

## 📈 Progression Globale

### Phase 1 : DLC après Ouverture
**Progression** : ████████░░ 80%
- ✅ Code complet (100%)
- ✅ Documentation complète (100%)
- ⏳ Migration SQL à exécuter (0%)
- ⏳ Tests utilisateur (0%)

### Phase 2 : Plats Cuisinés
**Progression** : ░░░░░░░░░░ 0%
- ⏳ Spécifications (100% dans SPEC)
- ⏳ Code (0%)
- ⏳ Documentation (0%)

### Phase 3 : Planning Intelligent
**Progression** : ░░░░░░░░░░ 0%
- ⏳ Spécifications (100% dans SPEC)
- ⏳ Code (0%)
- ⏳ Documentation (0%)

---

## 🎉 Résumé

**Système de gestion des restes** :
- ✅ **Vision complète** définie (3 phases)
- ✅ **Phase 1** implémentée (DLC après ouverture)
- ✅ **Documentation** exhaustive (4 guides + aide-mémoire)
- ⏳ **Phase 2 & 3** spécifiées, prêtes à implémenter

**Prochaine étape** :
1. Exécuter `GUIDE_EXECUTION_PHASE1.md`
2. Tester Phase 1 avec utilisateurs
3. Valider et passer à Phase 2

---

**Navigation facilitée ! 🧭**
