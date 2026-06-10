# Aliments courants ajoutés — cuisine française

Migration : `supabase/migrations/20260610_common_foods.sql`

---

## Nouveaux canoniques (5)

| Nom canonique | Catégorie | Code CIQUAL | Nom CIQUAL | DLC frigo | Congélateur |
|---|---|---|---|---|---|
| margarine | Huiles (11) | 16615 | Matière grasse végétale ou margarine, 80% MG, doux | 90 j | 365 j |
| lieu noir | Poissons (9) | 26134 | Lieu noir, cru | 2 j | 90 j |
| colin d'alaska | Poissons (9) | 26006 | Lieu ou colin d'Alaska, cru | 2 j | 90 j |
| surimi | Poissons (9) | 26046 | Surimi, bâtonnets, tranche ou râpé saveur crabe | 7 j | 180 j |
| pousses de soja | Légumes (2) | 20183 | Haricot mungo germé ou pousse de "soja", cru | 5 j | 30 j |

---

## Nouveaux archétypes (38) avec overrides CIQUAL

### Poissons / Mer

| Nom archétype | Canonique parent | Code CIQUAL override | Nom CIQUAL | expiry_kind | Pantry | Frigo | Congélo |
|---|---|---|---|---|---|---|---|
| sardines fraîches | sardine | — (canonique direct) | — | DLC | — | 2 j | 90 j |
| sardines en conserve | sardine | 26034 | Sardine, à l'huile, appertisée, égouttée | DDM | 1 460 j | — | — |
| maquereau frais | maquereau | — (canonique direct) | — | DLC | — | 2 j | 90 j |
| maquereau en conserve | maquereau | 26051 | Maquereau, cru (meilleure approx. disponible) | DDM | 1 460 j | — | — |
| lieu jaune frais | lieu jaune | — (canonique direct) | — | DLC | — | 2 j | 90 j |
| lieu noir frais | lieu noir | — (canonique direct) | — | DLC | — | 2 j | 90 j |
| lieu noir surgelé | lieu noir | — (canonique direct) | — | DDM | — | — | 180 j |
| colin d'alaska surgelé | colin d'alaska | — (canonique direct) | — | DDM | — | — | 180 j |
| surimi en bâtonnets | surimi | 26046 | Surimi, bâtonnets, saveur crabe | DLC | — | 7 j | 90 j |

### Charcuterie

| Nom archétype | Canonique parent | Code CIQUAL override | Nom CIQUAL | expiry_kind | Pantry | Frigo | Congélo |
|---|---|---|---|---|---|---|---|
| saucisson sec | porc | 30300 | Saucisson sec | DDM | 30 j | 90 j | 180 j |
| merguez | agneau | 30150 | Merguez, crue (aliment moyen) | DLC | — | 3 j | 60 j |
| chorizo | chorizo | 30315 | Chorizo | DDM | 30 j | 60 j | 180 j |

### Huiles

| Nom archétype | Canonique parent | Code CIQUAL override | Nom CIQUAL | expiry_kind | Pantry fermé | Pantry ouvert |
|---|---|---|---|---|---|---|
| huile de tournesol | tournesol | 17440 | Huile de tournesol | DDM | 540 j | 90 j |
| huile de colza | huile végétale | 17130 | Huile de colza | DDM | 540 j | 90 j |
| huile de sésame | graine de sésame | 17400 | Huile de sésame | DDM | 365 j | 60 j |

### Vinaigres

| Nom archétype | Canonique parent | Code CIQUAL override | Nom CIQUAL | expiry_kind | Pantry fermé | Pantry ouvert |
|---|---|---|---|---|---|---|
| vinaigre balsamique | vinaigre | 11091 | Vinaigre balsamique | DDM | 1 460 j | 365 j |
| vinaigre de cidre | vinaigre | 11090 | Vinaigre de cidre | DDM | 1 460 j | 365 j |

### Riz et féculents

| Nom archétype | Canonique parent | Code CIQUAL override | Nom CIQUAL | expiry_kind | Pantry fermé |
|---|---|---|---|---|---|
| riz blanc long grain | riz | — (nutrition canonique suffisante — CIQUAL 9100) | Riz blanc, cru | DDM | 1 095 j |
| riz basmati | riz | 9119 | Riz thaï ou basmati, cru | DDM | 1 095 j |
| riz complet | riz | 9102 | Riz complet, cru | DDM | 365 j |
| vermicelles de riz | riz | 9900 | Vermicelle de riz, sèche | DDM | 730 j |
| pâtes sèches | blé | 9810 | Pâtes sèches standard, crues | DDM | 730 j |
| pâtes complètes | blé | 9870 | Pâtes sèches, au blé complet, crues | DDM | 365 j |
| galette de sarrasin | sarrasin | 23801 | Galette de sarrasin, nature, préemballée | DLC | — (5 j frigo) |

### Farine et boulangerie sèche

| Nom archétype | Canonique parent | Code CIQUAL override | Nom CIQUAL | expiry_kind | Pantry fermé |
|---|---|---|---|---|---|
| farine de blé T55 | blé | 9436 | Farine de blé tendre T55 (pour pains) | DDM | 365 j |
| farine de blé T45 | blé | 9440 | Farine de blé tendre T45 (pour pâtisserie) | DDM | 365 j |
| farine complète T110 | blé | 9410 | Farine de blé tendre T110 | DDM | 180 j |
| biscottes | blé | 7300 | Biscotte classique | DDM | 365 j |
| crackers nature | blé | 38402 | Biscuit apéritif, crackers, nature | DDM | 365 j |

### Céréales petit-déjeuner

| Nom archétype | Canonique parent | Code CIQUAL override | Nom CIQUAL | expiry_kind | Pantry fermé |
|---|---|---|---|---|---|
| muesli | avoine | 32128 | Muesli floconneux ou de type traditionnel | DDM | 365 j |

### Chocolat

| Nom archétype | Canonique parent | Code CIQUAL override | Nom CIQUAL | expiry_kind | Pantry fermé |
|---|---|---|---|---|---|
| chocolat blanc | cacao | 31010 | Chocolat blanc, tablette | DDM | 365 j |
| chocolat au lait | cacao | 31004 | Chocolat au lait, tablette | DDM | 365 j |

### Conserves et épicerie salée

| Nom archétype | Canonique parent | Code CIQUAL override | Nom CIQUAL | expiry_kind | Pantry fermé | Ouvert frigo |
|---|---|---|---|---|---|---|
| maïs en conserve | maïs | 20066 | Maïs doux, appertisé, égoutté | DDM | 1 460 j | 3 j |
| crème de coco | noix de coco | 18041 | Lait de coco ou Crème de coco | DDM | 730 j | 5 j |
| bouillon cube de volaille | bouillon | 11174 | Bouillon de volaille, déshydraté | DDM | 730 j | — |
| bouillon cube de bœuf | bouillon | 11174 | Bouillon de volaille, déshydraté (meilleure approx.) | DDM | 730 j | — |
| bouillon cube de légumes | bouillon de légumes | 11174 | Bouillon de volaille, déshydraté (meilleure approx.) | DDM | 730 j | — |
| fromage fondu en tranchettes | lait | 12300 | Fromage fondu en tranchettes | DLC | — | 14 j frigo |
| pousses de soja fraîches | pousses de soja | — (canonique direct) | — | DLC | — | 5 j frigo |
| pousses de soja en conserve | pousses de soja | 20029 | Haricot mungo germé, appertisé, égoutté | DDM | 1 460 j | 3 j |
| café moulu | café | 18003 | Café, moulu | DDM | 365 j | 30 j |
| margarine à tartiner | margarine | 16615 | Matière grasse végétale ou margarine, 80% MG | DLC | — | 90 j frigo |

---

## Compteurs

- Nouveaux canoniques : **5**
- Nouveaux archétypes : **38**
- Overrides CIQUAL : **32** (certains archétypes frais sans override utilisent la nutrition du canonique)
- Total ajouts : **43 entrées** (5 canoniques + 38 archétypes)

---

## Produits envisagés mais jugés déjà couverts

| Produit envisagé | Raison de non-ajout |
|---|---|
| beurre, beurre salé, beurre doux, beurre clarifié | Archétypes existants rattachés au canonique `lait` |
| crème fraîche, crème liquide, crème épaisse | Archétypes existants (`crème fraîche`, `crème liquide`, etc.) |
| yaourt, yaourt nature, yaourt grec | Archétypes multiples existants |
| fromage blanc, Mascarpone, Ricotta, Comté, Emmental, Gruyère, Parmesan, Mozzarella, Camembert, Roquefort, Raclette, Chèvre | Tous présents en archétypes existants |
| jambon blanc, jambon cru, lardons, lardons fumés, bacon | Archétypes existants sur canonique `porc` |
| saucisse de Toulouse, saucisse de Strasbourg | Archétypes existants |
| chair à saucisse | Archétype existant |
| chocolat noir | Archétype existant (`chocolat noir`) sur canonique `cacao` |
| chapelure | Archétype existant (`chapelure`) sur canonique `blé` |
| flocon d'avoine | Archétype existant (`flocon d'avoine`) sur canonique `avoine` |
| spaghetti, linguine, pâtes courtes, pâtes (générique) | Archétypes existants sur canonique `blé` |
| pain, baguette, pain de mie, pain de campagne | Archétypes existants |
| farine (générique) | Archétype existant (`farine`) sur canonique `blé` — les T45/T55/T110 ajoutés en complément |
| lait de coco | Archétype existant (`Lait de coco`) sur canonique `noix de coco` |
| concentré de tomate | Archétype existant (`Concentré de tomate`) |
| sauce tomate | Archétype existant |
| vin blanc, vin rouge | Archétypes existants |
| Thon en conserve | Archétype existant sur canonique `thon` |
| saumon fumé | Archétype existant |
| nouilles chinoises, ramen, udon, soba | Archétypes existants sur canonique `blé` |
| semoule | Archétype existant |
| moutarde | Canonique existant |
| huile d'olive | Canonique existant (pas d'archétype nécessaire — usage direct) |
| vinaigre (blanc ordinaire) | Canonique existant, usage direct sans archétype nécessaire |
| sel | Canonique existant |
| sucre | Canonique existant |
| pâte feuilletée, pâte brisée | Archétypes existants |

---

## Notes de modélisation

**Chorizo** : canonical_foods `chorizo` (id=22) existe sans archétype ni nutrition_id. L'archétype `chorizo` créé ici lui fournit à la fois le process/expiry et l'override CIQUAL 30315. La nutrition manquante au niveau canonique est une anomalie préexistante à signaler à l'architecte Supabase pour complétion (UPDATE canonical_foods SET nutrition_id = ... WHERE canonical_name = 'chorizo').

**Bouillon cube de bœuf / de légumes** : CIQUAL ne dispose pas d'entrée spécifique pour ces deux variantes dans `nutritional_data` (seul 11174 "bouillon de volaille déshydraté" est disponible). Les overrides pointent vers 11174 à titre d'approximation ; à remplacer quand des codes plus précis seront importés.

**Maquereau en conserve** : pas d'entrée CIQUAL de conserve de maquereau confirmée dans `nutritional_data` — override sur maquereau cru (26051) en attendant.

**Riz blanc long grain** : pas d'override CIQUAL dédié créé — le canonique `riz` pointe déjà vers une entrée représentative (riz blanc, cru). L'archétype hérite de cette nutrition sans override.
