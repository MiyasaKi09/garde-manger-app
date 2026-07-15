# Reconnexion V3 et trajectoire de refonte Myko

Date de référence : 15 juillet 2026
Branche : `codex/myko-db-v3-reconnect`

## Décision structurante

La base Supabase est la source de vérité. Les fichiers JSON V3 restent des artefacts d'import et d'audit ; ils ne doivent plus alimenter les écrans ni le planificateur en production.

La base contient 302 familles/versions éditoriales. Elles gardent leur statut `candidate` tant que le processus de publication n'est pas achevé. Le site peut exploiter un sous-ensemble `operational_candidate` strict : 50 recettes ayant une forme alimentaire exacte pour chaque ingrédient, une conversion en grammes A/B, un profil nutritionnel primaire A/B complet et aucune anomalie d'éligibilité. Les 252 autres restent visibles dans les outils de revue, jamais proposées silencieusement au planning.

## Contrat de données actif

| Besoin | Source de vérité | Accès applicatif |
|---|---|---|
| Catalogue alimentaire et nutrition | `catalog.*` | services serveur / RPC contrôlées |
| Familles, versions, ingrédients, étapes, profil sensoriel | `culinary.*` | `get_operational_recipe_catalog_v3` |
| Stock, lots, restes, préférences du foyer | `public.*` avec RLS | client Supabase par requête utilisateur |
| Planning publié, réservations, courses, tâches | tables de planning + `publish_canonical_closed_loop_plan` | service serveur atomique |
| JSON V3 et exports | dépôt Git / provenance | import, tests et audit seulement |

Le contrat `v3-operational-1` renvoie les recettes déjà matérialisées : quantités d'origine, grammes déterministes, nutriments pour 100 g, étapes et garde-fous sensoriels. Le calcul nutritionnel par portion reste effectué par le domaine pur de l'application afin d'être testable et reproductible.

## Architecture cible

```text
Pages / composants client
        ↓ appels HTTP authentifiés
Routes API et Server Components
        ↓
Services applicatifs (recettes, planning, stock, cuisson, aujourd'hui)
        ↓
Domaines purs (nutrition, unités, allocation FEFO, contraintes sensorielles)
        ↓
Repositories / RPC Supabase par requête
        ↓
catalog.* + culinary.* + données utilisateur protégées par RLS
```

Règles non négociables :

- aucune mutation sensible directement depuis le navigateur ;
- aucun client utilisateur partagé au niveau d'un module serveur ;
- aucun `service_role` dans le navigateur ni dans un parcours utilisateur normal ;
- une recette planifiée référence à terme un snapshot d'exécution immuable ;
- stock, réservations, courses et tâches dérivent du même calcul atomique ;
- aucune valeur nutritionnelle ou conversion de quantité inventée par défaut ;
- les statuts éditoriaux et de publication sont affichés sans les maquiller.

## État de la reconnexion

### Réalisé dans cette étape

- remplacement de la lecture JSON par la base sur le catalogue de recettes, la fiche canonique et le générateur de planning V3 ;
- RPC authentifiée, limitée aux 50 recettes passant les contrôles d'exécution ;
- calcul nutritionnel déterministe et mise à l'échelle des portions à partir des données Supabase ;
- migration de l'authentification vers `@supabase/ssr` et validation serveur via `getUser()` ;
- suppression des usages applicatifs de `@supabase/auth-helpers-nextjs` ;
- injection explicite du client Supabase utilisateur dans les services de plats cuisinés ;
- métadonnées du catalogue renvoyées par l'API pour rendre la provenance observable.

### Dette conservée volontairement

- les tables historiques `recipes`, `generated_recipes`, `canonical_foods` et `archetypes` restent des projections compatibles pendant la transition ;
- les 252 recettes non éligibles restent dans la file de revue ;
- certains écrans historiques lisent encore des données publiques directement depuis le navigateur ; ils seront déplacés vers les services applicatifs par domaine ;
- la publication éditoriale complète demande une release active et des validations humaines, elle n'est pas simulée.

## Plan complet de refonte

### Lot 1 — Fondation et contrats (actuel)

Critère de sortie : auth SSR unique, RPC recette sécurisée, catalogue/fiches/planning alimentés par Supabase, tests de non-régression verts.

### Lot 2 — Stock unifié sur les formes alimentaires

- ajouter le lien `catalog.food_forms` aux lots et aux produits scannés ;
- fournir une projection de compatibilité vers `canonical_foods`/`archetypes` ;
- centraliser résolution, unités, densités, poids unitaires et FEFO dans un service serveur ;
- déplacer Smart Add, séparation de lots, carte du jardin et modifications de stock derrière les API ;
- journaliser chaque résolution et chaque correction avec sa confiance.

Critère de sortie : un lot possède une identité de forme exploitable par recettes, nutrition, conservation et planning sans rapprochement par nom.

### Lot 3 — Planificateur réellement fermé et atomique

- matérialiser une `recipe_execution` immuable pour chaque repas retenu ;
- déplacer génération, arbitrage, réservations, tâches et courses dans un service applicatif unique ;
- publier via une seule transaction : version du plan, slots, exécutions, réservations, courses et préparation ;
- ajouter objectifs nutritionnels par membre, allergènes stricts, dégoûts pondérés, budget temps, saisonnalité et variété sensorielle ;
- expliciter les raisons d'un choix : stock sauvé, manque à acheter, contrainte nutritionnelle et répétition évitée.

Critère de sortie : une publication échoue entièrement si un seul invariant échoue et peut être rejouée de façon déterministe.

### Lot 4 — Expérience “Aujourd'hui” et cuisine guidée

- faire de la page Aujourd'hui un Server Component alimenté par un ViewModel unique ;
- regrouper repas, préparations anticipées, produits urgents et restes ;
- ouvrir une session de cuisine depuis le snapshot exact du planning ;
- valider les quantités réellement utilisées, températures de sécurité et substitutions autorisées ;
- déduire le stock et créer les restes dans la même transaction.

Critère de sortie : aucune double saisie entre planning, cuisine, stock et restes.

### Lot 5 — Qualité éditoriale et extension des 302 recettes

- prioriser les tâches de revue qui débloquent le plus de recettes ;
- séparer correction automatique sûre, proposition assistée et décision humaine ;
- mesurer couverture des formes, conversions, macros, étapes et garde-fous d'identité ;
- créer une release de catalogue active seulement lorsque les contrôles et licences sont validés ;
- basculer progressivement les recettes éligibles du statut opérationnel candidat vers publié.

Critère de sortie : chaque recette exposée indique sa provenance, sa version, son niveau de confiance et son statut réel.

### Lot 6 — Retrait du modèle historique

- arrêter les écritures dans les anciennes tables ;
- comparer les projections pendant une période d'observation ;
- supprimer les accès directs restants du navigateur ;
- retirer les adaptateurs, fichiers JSON utilisés au runtime et pages dupliquées ;
- conserver uniquement des vues de compatibilité temporaires et observées.

Critère de sortie : un seul chemin d'écriture et un seul modèle métier pour chaque domaine.

## Indicateurs de pilotage

- recettes opérationnelles / 302 et causes de blocage ;
- couverture nutritionnelle et conversion exacte des ingrédients ;
- taux de repas couverts par le stock, grammes sauvés avant péremption et achats évités ;
- violations allergènes (objectif zéro) et substitutions refusées ;
- répétitions sensorielles/techniques évitées sur 7 et 14 jours ;
- échecs de publication atomique et divergences stock/réservations ;
- part des mutations passant par les services serveur ;
- erreurs et latence des contrats Supabase.

## Stratégie de livraison sans coupure

Chaque lot suit le même ordre : migration additive, repository serveur, service applicatif, bascule d'un consommateur, mesures, puis retrait de l'ancien chemin. Les migrations restent réversibles tant que l'ancien chemin n'est pas supprimé. Les données candidates ne sont jamais promues automatiquement pour satisfaire une échéance d'interface.
