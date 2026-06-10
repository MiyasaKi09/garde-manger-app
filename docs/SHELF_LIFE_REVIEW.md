# Revue des durées de conservation — Myko Garde-Manger

**Date de revue :** 2026-06-10
**Sources :** ANSES, DGCCRF, guides de conservation français, règlement CE 853/2004
**Scope :** 419 archetypes + 268 canonical_foods

---

## Résumé des compteurs

| Indicateur | Valeur |
|---|---|
| Corrections archetypes | **23 entrées** (28 UPDATE individuels ou de groupe) |
| Canonical_foods complétés (0→valeurs) | **35 entrées** |
| Corrections canonical_foods (valeurs fausses) | **14 entrées** |
| expiry_kind ajouté | **419 archetypes** |
| Répartition DLC estimée | ~130 entrées |
| Répartition DDM estimée | ~230 entrées |
| Répartition ESTIMATE estimée | ~59 entrées |

---

## Tableau des 10 corrections les plus importantes

| # | Nom (id) | Valeur avant | Valeur après | Justification |
|---|---|---|---|---|
| 1 | **bœuf haché** (arch. 304) | pantry=28j / fridge=42j | pantry=NULL / fridge=2j | ANSES : viande hachée fraîche = 1-2j frigo. Valeur d'avant = copié-collé depuis l'œuf entier en coquille. Risque sanitaire majeur. |
| 2 | **Laits frais pasteurisés** (arch. 188/189/190) | pantry=90j / fridge=7j | pantry=NULL / fridge=7j | Un lait frais pasteurisé (72°C) n'a AUCUNE durée hors réfrigération. DGCCRF : 7j frigo à partir de la pasteurisation. |
| 3 | **Tomates pelées en bocaux stérilisés** (arch. 5) | pantry=7j / fridge=14j | pantry=1095j (3 ans) | Conserve stérilisée = 2-5 ans en garde-manger (règlement CE). pantry=7j est la durée d'une tomate fraîche — erreur de catégorie. |
| 4 | **Tomates séchées** (arch. 1) | pantry=7j / fridge=14j | pantry=365j | Les tomates séchées (humidité <15%) se conservent 6-12 mois à l'air libre. pantry=7j = valeur de tomate fraîche. |
| 5 | **Lait en poudre** (arch. 193) | pantry=90j | pantry=730j | Le lait en poudre déshydraté (atomisation) se conserve 12-24 mois. DGCCRF et fabricants : 730j fermé. |
| 6 | **Crème anglaise maison** (arch. 202) | pantry=30j / fridge=30j | pantry=NULL / fridge=3j | Préparation à base d'œufs cuits (non stérilisée) : ANSES classe ces crèmes à cuisson partielle comme DLC 2-3j. pantry=30j = risque Salmonella/Listeria. |
| 7 | **Crème pâtissière** (arch. 414/415) | fridge=30j | fridge=3j | ANSES : crème pâtissière = milieu favorable à Bacillus cereus après cuisson. DLC industrielle 2-3j ; maison = 48-72h max. |
| 8 | **Confitures maison (abricots/pêches/prunes)** (arch. 69/80/85) | pantry=5j | pantry=365j | Confitures en bocaux stérilisés = 12-24 mois. pantry=5j est la durée d'un fruit frais — confusion grave. |
| 9 | **Sauce tomate cuite** (arch. 327) | pantry=730j / fridge=NULL | pantry=NULL / fridge=7j | Une sauce tomate cuisinée non stérilisée ne se conserve pas 2 ans à température ambiante. 7j frigo / 6 mois congélateur. |
| 10 | **Pâte brisée / pâte à pizza crues** (arch. 323/470) | pantry=730j / fridge=NULL | pantry=NULL / fridge=3j / freezer=90j | Pâtes crues non emballées ne se conservent pas 2 ans. 2-3j frigo (levure active) ou 3 mois congelé. |

---

## Tableau complet des corrections

### Archetypes

| Nom | Id | Colonne corrigée | Avant | Après | Source |
|---|---|---|---|---|---|
| bœuf haché | 304 | pantry / fridge | 28j / 42j | NULL / 2j | ANSES viande hachée fraîche |
| blanc d'œuf séparé | 302 | pantry / fridge / freezer | 28j / 42j / NULL | NULL / 2j / 60j | DGCCRF : 48h après séparation |
| jaune d'œuf séparé | 318 | pantry / fridge / freezer | 28j / 42j / NULL | NULL / 2j / 60j | DGCCRF : 48h après séparation |
| bouillon de bœuf (maison) | 305 | pantry / fridge | 28j / 42j | NULL / 4j | ANSES : bouillon cuit = 3-4j frigo |
| Lait entier frais | 188 | pantry | 90j | NULL | DGCCRF : lait frais ne se conserve pas hors frigo |
| Lait demi-écrémé frais | 189 | pantry | 90j | NULL | idem |
| Lait écrémé frais | 190 | pantry | 90j | NULL | idem |
| Lait en poudre | 193 | pantry / open_pantry | 90j / 90j | 730j / 30j | Fabricants : 12-24 mois fermé |
| Crème anglaise | 202 | pantry / fridge | 30j / 30j | NULL / 3j | ANSES : crème aux œufs cuits DLC 2-3j |
| Crème pâtissière | 414 | fridge | 30j | 3j | ANSES : B. cereus risque élevé |
| Crème pâtissière chocolat | 415 | fridge | 30j | 3j | idem |
| Confiture d'abricots | 69 | pantry / fridge / freezer | 5j / 7j / 270j | 365j / 365j / 1800j | DGCCRF : confitures bocaux stérilisés 12-24 mois |
| Confiture de pêches | 80 | pantry / fridge / freezer | 5j / 7j / 270j | 365j / 365j / 1800j | idem |
| Confiture de prunes | 85 | pantry / fridge / freezer | 5j / 7j / 270j | 365j / 365j / 1800j | idem |
| Tomates séchées | 1 | pantry / fridge / freezer | 7j / 14j / 180j | 365j / 180j / 1800j | Produit sec : 6-12 mois |
| Tomates pelées en bocaux | 5 | pantry / fridge / freezer | 7j / 14j / 180j | 1095j / 1095j / 1800j | Conserve stérilisée : 2-5 ans |
| Abricots séchés | 67 | pantry / fridge / freezer | 5j / 7j / 270j | 365j / 180j / 730j | Fruits séchés : 6-12 mois |
| Abricots au sirop maison | 71 | pantry / fridge / freezer | 5j / 7j / 270j | 365j / 365j / 1800j | Bocal stérilisé : 12 mois |
| Pêches séchées | 78 | pantry / fridge / freezer / open_pantry | 5j / 7j / 270j / 0j | 365j / 180j / 730j / 180j | Fruits séchés : 6-12 mois |
| Pêches au sirop maison | 82 | pantry / fridge / freezer | 5j / 7j / 270j | 365j / 365j / 1800j | Bocal stérilisé : 12 mois |
| Prunes au sirop maison | 87 | pantry / fridge / freezer | 5j / 7j / 270j | 365j / 365j / 1800j | Bocal stérilisé : 12 mois |
| Pruneaux (prunes séchées) | 83 | pantry / fridge / freezer / open_pantry | 5j / 7j / 270j / 0j | 365j / 180j / 730j / 180j | Fruits séchés : 6-12 mois |
| Poudre d'abricot | 99 | pantry / fridge / freezer | 5j / 7j / 270j | 365j / 180j / 730j | Poudre séchée : 12 mois |
| Chips de carotte séchées | 26 | pantry / fridge / freezer | 7j / 21j / 270j | 90j / 90j / 270j | Produit déshydraté : 3 mois |
| Purée carottes congelée | 28 | pantry / fridge | 7j / 21j | NULL / NULL | Produit congelé : pas de durée pantry/fridge |
| Pâte de tomate séchée | 48 | pantry / fridge / open_pantry | 7j / 14j / 3j | 365j / 180j / 30j | Poudre séchée : 12 mois |
| Sauce tomate (cuite) | 327 | pantry / fridge | 730j / NULL | NULL / 7j | Sauce non stérilisée : 7j frigo |
| Pâte brisée | 323 | pantry / fridge / freezer | 730j / NULL / NULL | NULL / 3j / 90j | Pâte crue : 3j frigo, 3 mois congelé |
| Pâte à pizza | 470 | pantry / fridge / freezer | 730j / NULL / NULL | NULL / 3j / 90j | idem |
| Infusion menthe concentrée (open_fridge) | 118 | open_fridge | 180j | 7j | Infusion maison : 5-7j max |
| Laitue romaine | 486 | fridge | 21j | 7j | Laitue fraîche : 5-7j frigo |
| Herbes séchées freezer (10 archetypes) | 106,107,110,111,134,135,137,138,143,144 | freezer | 7300j | 730j | 20 ans = absurde ; 2 ans = réaliste |
| Graines moulues/lyophilisé freezer | 130,126,147,133 | freezer | 7300j | 730j | idem |

### Canonical_foods — Corrections de valeurs fausses

| Nom | Id | Problème | Correction |
|---|---|---|---|
| épeautre, millet, orge, quinoa, sarrasin | 5003,5006,5007,4002,4004 | fridge=7j (aberrant pour grain sec) | fridge=NULL |
| maïs | 9007 | pantry=5j (valeur épi frais) | pantry=730j (grain sec) |
| sucre de betterave / sucre de canne | 14003,14004 | 99999j → illisible | 3650j (10 ans) |
| sel | 6004 | 99999j | 3650j |
| miel | 14001 | fridge=1095j / freezer=99999j | fridge=NULL / freezer=3650j |
| sirop d'érable | 14002 | freezer=99999j | freezer=3650j |
| laitue | 1031 | pantry=14j / fridge=30j (trop long) | pantry=2j / fridge=7j |
| pomme de terre | 1053 | fridge=60j (noircit au frigo) | fridge=NULL |
| citron, citron vert, orange, pamplemousse, mandarine, grenade | 1015,1016,1044,1045,1034,1027 | freezer=0 | freezer=90j (jus/zeste) |
| cacahuète | 11002 | fridge=30j incohérent | fridge=180j |
| noix de coco | 1043 | fridge=7j (valeur noix ouverte) | fridge=120j |
| huître | 9006 | freezer=0 | freezer=60j (chair) |

---

## Canonical_foods complétés (35 entrées sans aucune valeur)

| Nom | Id | Catégorie | Valeurs assignées | Logique |
|---|---|---|---|---|
| boulgour | 16 | Céréales | pantry=730 | grain sec |
| naan | 18 | Céréales | pantry=3 / fridge=7 / freezer=90 | pain plat |
| nachos | 19 | Céréales | pantry=30 | chips sèches |
| pâtes | 15 | Céréales | pantry=730 | pâtes sèches |
| semoule | 17 | Céréales | pantry=730 | sèche |
| câpres | 31 | Conserves | pantry=730 / fridge=180 | saumure acide |
| gochujang | 32 | Conserves | pantry=365 / fridge=30 | pâte fermentée |
| ketchup | 29 | Conserves | pantry=365 / fridge=180 | acide sucré |
| kimchi | 35 | Conserves | fridge=180 | fermenté vivant |
| mayonnaise | 28 | Conserves | pantry=365 / fridge=90 | émulsion acide (industrielle) |
| mirin | 33 | Conserves | pantry=730 | alcool sucré |
| nuoc-mâm | 34 | Conserves | pantry=730 | sauce poisson très stable |
| pesto | 30 | Conserves | fridge=7 / freezer=60 | frais, très périssable |
| combava | 40 | Épices | pantry=14 / fridge=21 / freezer=90 | fruit frais |
| galanga | 39 | Épices | pantry=14 / fridge=30 / freezer=90 | rhizome frais |
| harissa | 36 | Épices | pantry=365 / fridge=60 | pâte piquante |
| herbes de Provence | 38 | Épices | pantry=730 | mélange sec |
| ras el-hanout | 37 | Épices | pantry=730 | mélange sec |
| saindoux | 27 | Huiles | pantry=365 / fridge=180 | graisse animale |
| tofu | 20 | Légumineuses | fridge=5 / freezer=90 | périssable |
| sésame | 25 | Noix et graines | pantry=730 / freezer=730 | graine sèche |
| tahini | 26 | Noix et graines | pantry=180 / fridge=90 | pâte de sésame |
| lieu jaune | 24 | Poissons | fridge=2 / freezer=60 | poisson frais |
| halloumi | 21 | Produits laitiers | fridge=14 / freezer=60 | fromage à griller |
| chorizo | 22 | Viandes | fridge=7 / freezer=120 | charcuterie séchée |
| guanciale | 23 | Viandes | fridge=7 / freezer=120 | charcuterie séchée |
| chevre | 49 | (sans cat.) | fridge=21 / freezer=60 | fromage de chèvre générique |
| daikon | 43 | (sans cat.) | pantry=14 / fridge=30 / freezer=90 | radis blanc |
| ghee | 46 | (sans cat.) | pantry=90 / fridge=180 | beurre clarifié |
| grenoble (noix) | 47 | (sans cat.) | pantry=180 / fridge=365 / freezer=365 | noix sèche |
| houmous | 48 | (sans cat.) | fridge=7 / freezer=60 | frais, périssable |
| jalapenos | 41 | (sans cat.) | pantry=14 / fridge=21 / freezer=90 | piment frais |
| pastis | 45 | (sans cat.) | pantry=1825 | alcool à 45° |
| shiitakes | 44 | (sans cat.) | fridge=7 / freezer=180 | champignons frais |
| sriracha | 42 | (sans cat.) | pantry=365 / fridge=60 | sauce piquante acide |

---

## Valeurs vérifiées et jugées correctes

### Viandes fraîches (boucherie)
Toutes les viandes fraîches découpées (bœuf, veau, agneau, porc, volaille) : fridge=2-3j, freezer=90-120j. Correct selon ANSES.

### Charcuteries fraîches et abats
Saucisses, boudins, lard, lardons, foie : fridge=3j, freezer=120j. Correct.

### Fromages (ensemble du catalogue)
- Pâtes molles à croûte fleurie (Brie, Camembert, Coulommiers) : fridge=45j fermé / 7j ouvert. Correct.
- Pâtes persillées (Roquefort, Bleu d'Auvergne, Gorgonzola) : fridge=60j / 7j ouvert. Correct.
- Pâtes pressées cuites (Comté, Emmental, Gruyère) : fridge=180j / 14j ouvert. Correct.
- Fromages frais (Fromage blanc, Faisselle, Ricotta, Mascarpone) : fridge=21-30j / 3-5j ouvert. Correct.
- Chèvres frais/demi-sec/sec : fridge=21-60j selon affinage. Correct.

### Yaourts
fridge=21j fermé / 3j ouvert. Correct (DDM 28-30j sur les emballages, marge de sécurité conservée).

### Crème fraîche, crème liquide
fridge=30j fermée / 3j ouverte. Correct selon DGCCRF.

### Beurre
fridge=90j fermé / 30j ouvert. Correct (beurre doux = 3 mois ; beurre salé légèrement plus long).

### Oeufs entiers en coquille
pantry=28j / fridge=42j. Correct : règlement CE 589/2008 (28j à partir du pondage).

### Poissons frais
fridge=1-2j. Correct selon ANSES.

### Poissons fumés
fridge=14j (saumon fumé). Correct selon DGCCRF.

### Laits UHT (fermés)
pantry=90j. Correct : DDM moyenne constatée sur les produits Lactel/Candia.

### Herbes séchées (pantry)
365-730j pour herbes séchées/poudre. Correct selon fabricants (thym, romarin, sauge, origan, laurier).

### Épices entières/moulues (poudres)
365-730j. Correct selon fabricants.

### Farines, pâtes sèches, riz, semoule
365-730j. Correct DGCCRF.

### Confitures, gelées, bocaux de fruits ouvertes
open_fridge=5-14j. Correct.

### Bocaux lacto-fermentés (choucroute, carottes, courgettes)
fridge=21-120j. Correct (milieu acide protecteur).

### Alcools (cognac, calvados, rhum, porto, kirsch, etc.)
pantry=1825j (5 ans). Correct (alcools forts = quasi indéfinis).

---

## Valeurs douteuses mais défendables (non modifiées)

| Nom | Valeur | Commentaire |
|---|---|---|
| Poudre d'ail (id 39) / Poudre d'oignon (id 35) | pantry=90j | Conservateur mais défendable : après broyage la dégradation organoleptique est rapide. 730j serait la norme industrielle, mais 90j est correct pour une poudre artisanale maison. |
| Chantilly (id 203) | pantry=60j / open_fridge=3j | La bombe est fermée 60j (OK pressurisation gaz), ouverte 3j frigo (OK). |
| Oignons caramélisés / confits (id 36, 37) | fridge=90j fermé | Valeur haute mais défendable si préparation maison hermétique avec matière grasse (protège de l'oxydation). |
| Babeurre (id 402) | fridge=90j fermé | Pour un babeurre industriel UHT (90j) c'est correct ; pour un babeurre frais c'est trop. Sans distinction dans le process, on laisse la valeur haute avec une note. |
| Mozzarella (id 320) | fridge=30j | Valeur de la mozzarella emballée industriellement en saumure. Correct pour produit fermé. |
| Feta (id 313) | fridge=30j | Idem saumure. Correct si emballée. |
| Cerises au sirop maison (id 77) | pantry=365j / freezer=3650j | pantry=365j est correct pour bocal stérilisé ; freezer=3650j (10 ans) est excessif mais inoffensif (on réduit à 1800 dans la migration). |

---

## Notes d'architecture métier

**Sur la colonne `expiry_kind` :**
- DLC s'applique uniquement aux produits pour lesquels la réglementation française impose une date limite (décret du 21/12/1984, règlement CE 178/2002).
- DDM remplace les anciens termes "DLUO" depuis le règlement UE 1169/2011 (art. 24).
- ESTIMATE concerne les fruits et légumes bruts non transformés : il n'existe pas de date légale apposée, seule une estimation pratique.

**Sur la règle `open_shelf_life_days_pantry = 0` :**
Plusieurs archetypes utilisent `open_shelf_life_days_pantry = 0` pour signifier "ne pas conserver ouvert hors frigo". C'est sémantiquement correct mais peut induire une confusion avec "0 jour = consommer immédiatement". Il serait préférable d'utiliser NULL pour les produits devant strictement rester réfrigérés après ouverture.

**Sur le `shelf_life_days_fridge` des produits congelés :**
De nombreux archétypes congelés (purées, congélations maison) affichent `shelf_life_days_fridge` égal à la valeur pantry, ce qui n'a pas de sens pour un produit dont le seul lieu de stockage est le congélateur. Ces valeurs sont mises à NULL dans la migration pour les cas identifiés.
