/**
 * Résolution de l'ORIGINE d'une forme alimentaire depuis sa fiche Ciqual.
 *
 * Ce module est la règle (b) de la résolution d'origine, appliquée par
 * build-recipe-food-corpus.mjs dans cet ordre, et rien d'autre :
 *   a. une origine EXPLICITE dans une décision d'arbitrage
 *      (data/foods/arbitrations/lot21-origine-des-formes.json) ;
 *   b. sinon le groupe / sous-groupe / sous-sous-groupe Ciqual de la fiche,
 *      MAIS SEULEMENT quand cette case est sans ambiguïté — c'est la table
 *      ci-dessous ;
 *   c. sinon 'inconnu'. JAMAIS une regex sur le nom pour deviner.
 *
 * Le vocabulaire des valeurs vit dans lib/domain/foods/origins.js (le code
 * du planificateur ne peut pas importer un .mjs de scripts/, et ce script ne
 * peut pas importer un module ESM en .js d'un projet sans "type": "module") ;
 * un test vérifie que les deux listes sont identiques.
 *
 * LA TABLE A ÉTÉ ÉCRITE APRÈS ÉNUMÉRATION des valeurs réelles de grp_nom,
 * ssgrp_nom et ssssgrp_nom du classeur Ciqual 2020
 * (data/sources/raw/ciqual_2020_FR_2020-07-07.xls.gz, 3 186 fiches), pas
 * d'après ce qu'on croit y trouver. C'est CE classeur que le catalogue lit,
 * et non les shards 2025 de data/foods/ciqual-reference/ : l'énumération des
 * shards (3 484 entrées) montre qu'ils RENOMMENT plusieurs cases — « produits
 * laitiers » sans « et assimilés », « viandes, oeufs, poissons », « fromages
 * et alternatives végétales », « charcuteries et alternatives végétales », et
 * de nouveaux sous-groupes « farines », « pâtes à tarte », « ingrédients pour
 * végétariens », « tartinables végétariens ». Le jour de la bascule 2025, la
 * table est à ré-énumérer, pas à recopier.
 *
 * Ce que l'énumération a appris et qui a décidé de « sûr » ou « ambigu » :
 *   - le classeur n'a AUCUN sous-groupe « volailles » : « Poulet, filet, cru »
 *     est dans « viandes crues » avec le bœuf. Mais le SOUS-SOUS-GROUPE
 *     (ssssgrp_nom) sépare « poulet », « dinde », « bœuf et veau », « porc »,
 *     « agneau et mouton », « gibier », « abats » et « autres viandes » — et
 *     chacun a été relu fiche par fiche. Les six premiers sont homogènes
 *     (16 fiches « poulet », toutes du poulet ; 39 « bœuf et veau », toutes
 *     bœuf ou veau…) : ils sont sûrs. « abats » mêle foie de veau et foie de
 *     volaille, « autres viandes » mêle canard, oie, pintade, poule (volaille)
 *     et cheval, lapin, chevreau, autruche (viande) : ambigus. Le gibier va
 *     en viande — le faisan est un gibier à plumes, pas une volaille de
 *     basse-cour, et c'est la définition que porte le vocabulaire ;
 *   - de même pour « charcuteries et assimilés » : « jambons secs et crus »
 *     (10 fiches, toutes de porc : jambon cru, Bayonne, Parme, Serrano, coppa,
 *     pancetta) et « saucisson secs » (6 fiches, toutes de porc) sont sûrs ;
 *     « jambons cuits » contient « Jambon de dinde » et « Jambon de poulet »,
 *     « saucisses et assimilés » des saucisses de volaille, « rillettes » des
 *     rillettes de canard et de poulet, « pâtés et terrines » des terrines de
 *     canard, « quenelles » des quenelles de poisson et de volaille, « autres
 *     spécialités charcutières » le confit de canard et le haché de volaille,
 *     et « substituts de charcuteries pour végétariens » du seitan : ambigus ;
 *   - « substitus de produits carnés » (sic) contient le tofu, le seitan et
 *     des « bouchées au soja et blé (ne convient pas aux véganes) » → ambigu ;
 *   - « légumes » contient « Carotte, purée cuisinée à la crème » (20298),
 *     « pommes de terre et autres tubercules » quatre purées au lait ou à la
 *     crème (4016–4019, 4103), « œufs » contient « Omelette aux lardons »
 *     (22507) et « Omelette, garnitures diverses… viandes » (22511),
 *     « pâtes, riz et céréales » cinq pâtes AUX ŒUFS (9815, 9816, 9821, 9822,
 *     9863), « fromages et assimilés » trois spécialités végétales
 *     (1027–1029), « produits laitiers frais et assimilés » dix desserts au
 *     soja ou végétaux, « mollusques et crustacés » l'escargot et la
 *     grenouille. Ces sous-groupes sont sûrs À L'EXCEPTION de ces codes,
 *     consignés un par un dans EXCEPTIONS_PAR_CODE : le code retombe en
 *     ambigu et passe par (a) ;
 *   - « condiments » contient la tapenade et des olives farcies aux anchois,
 *     « aides culinaires » les fonds de veau et de volaille, « ingrédients
 *     divers » la gélatine, la gelée royale et le tofu soyeux, « sauces » la
 *     mayonnaise et le nuoc-mâm, « autres matières grasses » le saindoux, la
 *     graisse d'oie et l'huile de paraffine → ambigus ;
 *   - « boissons sans alcool » contient des boissons lactées, « boisson
 *     alcoolisées » un « Marsala aux oeufs » → ambigus ;
 *   - 45 fiches n'ont AUCUN groupe (farines, fécules, pâtes à tarte, feuille
 *     de brick, « Dessert (aliment moyen) ») → ambigu, elles passent par (a).
 */

/** Même liste que lib/domain/foods/origins.js — un test tient l'égalité. */
export const ORIGINS = Object.freeze([
  'vegetal', 'mineral',
  'animal:viande', 'animal:volaille', 'animal:poisson', 'animal:fruits_de_mer',
  'animal:oeuf', 'animal:lait', 'animal:miel', 'animal:autre',
  'inconnu',
])
const ORIGIN_SET = new Set(ORIGINS)
export const isKnownOrigin = (value) => ORIGIN_SET.has(value)

export const AMBIGU = 'ambigu'

/**
 * Table grp_nom → ssgrp_nom → origine sûre, ou AMBIGU, ou — quand seul le
 * sous-sous-groupe tranche — un objet ssssgrp_nom → origine sûre / AMBIGU.
 * Toute case absente de la table est ambiguë (on ne complète pas une table par
 * vraisemblance). Les libellés sont ceux du classeur, en minuscules.
 */
export const ORIGINE_PAR_GROUPE = Object.freeze({
  'aides culinaires et ingrédients divers': {
    'algues': 'vegetal',
    'herbes': 'vegetal',
    'épices': 'vegetal',
    'sels': 'mineral',
    'aides culinaires': AMBIGU,                                   // fonds de veau, bouillons de volaille, gelée au madère
    'condiments': AMBIGU,                                         // tapenade, olives farcies aux anchois
    'ingrédients divers': AMBIGU,                                 // gélatine, gelée royale, tofu soyeux, levures
    'sauces': AMBIGU,                                             // mayonnaise, nuoc-mâm, béchamel, bolognaise
    'aides culinaires et ingrédients pour végétariens': AMBIGU,   // « pour végétariens » ne dit pas sans œuf ni lait
    'denrées destinées à une alimentation particulière': AMBIGU, // substituts de repas au lait écrémé
  },
  'aliments infantiles': {
    'céréales et biscuits infantiles': AMBIGU,
    'desserts infantiles': AMBIGU,
    'laits et boissons infantiles': AMBIGU,
    'petits pots salés et plats infantiles': AMBIGU,
  },
  'eaux et autres boissons': {
    'eaux': 'mineral',
    'boissons sans alcool': AMBIGU,   // boissons lactées, boissons au soja, lait de coco
    'boisson alcoolisées': AMBIGU,    // « Marsala aux oeufs », liqueurs à la crème
  },
  'entrées et plats composés': {
    'feuilletées et autres entrées': AMBIGU,
    'pizzas, tartes et crêpes salées': AMBIGU,
    'plats composés': AMBIGU,
    'salades composées et crudités': AMBIGU,
    'sandwichs': AMBIGU,
    'soupes': AMBIGU,                 // bouillons de bœuf, de volaille, de légumes : même sous-groupe
  },
  'fruits, légumes, légumineuses et oléagineux': {
    'fruits': 'vegetal',
    'légumes': 'vegetal',                                  // sauf 20298, voir EXCEPTIONS_PAR_CODE
    'légumineuses': 'vegetal',
    'fruits à coque et graines oléagineuses': 'vegetal',
    'pommes de terre et autres tubercules': 'vegetal',    // sauf purées au lait, voir EXCEPTIONS_PAR_CODE
  },
  'glaces et sorbets': {
    '-': AMBIGU,
    'desserts glacés': AMBIGU,
    'glaces': AMBIGU,
    'sorbets': AMBIGU,
  },
  'matières grasses': {
    'beurres': 'animal:lait',                 // y compris « Huile de beurre ou Beurre concentré » (16401)
    'huiles de poissons': 'animal:poisson',
    'huiles et graisses végétales': 'vegetal',
    'margarines': AMBIGU,                     // « matière grasse mélangée (végétale et laitière) »
    'autres matières grasses': AMBIGU,        // saindoux, graisses de volaille, paraffine
  },
  'produits céréaliers': {
    'pâtes, riz et céréales': 'vegetal',      // sauf pâtes aux œufs, voir EXCEPTIONS_PAR_CODE
    'pains et assimilés': 'vegetal',
    'biscuits apéritifs': AMBIGU,
  },
  'produits laitiers et assimilés': {
    'laits': 'animal:lait',
    'crèmes et spécialités à base de crème': 'animal:lait',
    'fromages et assimilés': 'animal:lait',                 // sauf spécialités végétales, voir EXCEPTIONS_PAR_CODE
    'produits laitiers frais et assimilés': 'animal:lait',  // sauf desserts au soja / végétaux, voir EXCEPTIONS_PAR_CODE
  },
  'produits sucrés': {
    'barres céréalières': AMBIGU,
    'biscuits sucrés': AMBIGU,
    'chocolats et produits à base de chocolat': AMBIGU,
    'confiseries non chocolatées': AMBIGU,
    'confitures et assimilés': AMBIGU,
    'céréales de petit-déjeuner': AMBIGU,
    'gâteaux et pâtisseries': AMBIGU,
    'sucres, miels et assimilés': AMBIGU,    // le miel est animal, le sucre végétal : même sous-groupe
    'viennoiseries': AMBIGU,
  },
  'viandes, œufs, poissons et assimilés': {
    'œufs': 'animal:oeuf',                                  // sauf omelettes garnies, voir EXCEPTIONS_PAR_CODE
    'poissons crus': 'animal:poisson',
    'poissons cuits': 'animal:poisson',
    'mollusques et crustacés crus': 'animal:fruits_de_mer', // sauf escargot, grenouille, voir EXCEPTIONS_PAR_CODE
    'mollusques et crustacés cuits': 'animal:fruits_de_mer',
    // Volaille et viande de boucherie sont mêlées au sous-groupe : seul le
    // sous-sous-groupe tranche, et seulement là où il est homogène.
    'viandes crues': {
      'bœuf et veau': 'animal:viande',
      'porc': 'animal:viande',
      'agneau et mouton': 'animal:viande',
      'gibier': 'animal:viande',
      'poulet': 'animal:volaille',
      'dinde': 'animal:volaille',
      'abats': AMBIGU,            // foie de veau et foie de volaille
      'autres viandes': AMBIGU,   // canard, oie, pintade, poule / cheval, lapin, chevreau
    },
    'viandes cuites': {
      'bœuf et veau': 'animal:viande',
      'porc': 'animal:viande',
      'agneau et mouton': 'animal:viande',
      'gibier': 'animal:viande',
      'poulet': 'animal:volaille',
      'dinde': 'animal:volaille',
      'abats': AMBIGU,
      'autres viandes': AMBIGU,
      '-': AMBIGU,                // « Viande cuite (aliment moyen) », « Volaille, cuite (aliment moyen) »
    },
    'charcuteries et assimilés': {
      'jambons secs et crus': 'animal:viande',          // 10 fiches, toutes de porc
      'saucisson secs': 'animal:viande',                // 6 fiches, toutes de porc
      'jambons cuits': AMBIGU,                          // jambon de dinde, jambon de poulet
      'saucisses et assimilés': AMBIGU,                 // saucisses de volaille
      'pâtés et terrines': AMBIGU,                      // terrine de canard, pâté aux champignons
      'rillettes': AMBIGU,                              // rillettes de canard, de poulet
      'quenelles': AMBIGU,                              // quenelle de poisson, de volaille, nature
      'autres spécialités charcutières': AMBIGU,        // confit de canard, magret fumé, haché de volaille
      'substituts de charcuteries pour végétariens': AMBIGU,
      '-': AMBIGU,                                      // « Charcuterie (aliment moyen) »
    },
    'autres produits à base de viande': AMBIGU,             // nuggets de poulet, boulettes bœuf-porc
    'produits à base de poissons et produits de la mer': AMBIGU, // surimi, tarama, rillettes de saumon : poisson ou mer
    'substitus de produits carnés': AMBIGU,                 // tofu, seitan, bouchées « ne convient pas aux véganes »
  },
})

/**
 * Codes qui contredisent leur sous-groupe, relevés à l'énumération. Ils
 * retombent en ambigu : seule une décision d'arbitrage peut les qualifier.
 */
export const EXCEPTIONS_PAR_CODE = Object.freeze({
  '20298': 'Carotte, purée cuisinée à la crème (légumes)',
  '4016': 'Pomme de terre, flocons déshydratés, au lait ou à la crème (tubercules)',
  '4017': 'Pomme de terre, purée à base de flocons, reconstituée avec lait entier (tubercules)',
  '4018': 'Pomme de terre, purée, avec lait et beurre (tubercules)',
  '4019': 'Pomme de terre, purée à base de flocons, reconstituée avec lait demi-écrémé (tubercules)',
  '4103': 'Patate douce, purée, cuisinée à la crème (tubercules)',
  '9815': 'Pâtes fraîches, aux oeufs, crues (pâtes, riz et céréales)',
  '9816': 'Pâtes fraîches, aux oeufs, cuites (pâtes, riz et céréales)',
  '9821': 'Pâtes sèches, aux oeufs, crues (pâtes, riz et céréales)',
  '9822': 'Pâtes sèches, aux oeufs, cuites (pâtes, riz et céréales)',
  '9863': 'Pâtes ou nouilles asiatiques au blé et aux oeufs, crues (pâtes, riz et céréales)',
  '1027': 'Spécialité végétale type fromage à tartiner, au soja (fromages)',
  '1028': 'Spécialité végétale type fromage, à la noix de cajou (fromages)',
  '1029': 'Spécialité végétale type fromage en tranche ou râpé, sans soja (fromages)',
  '19692': 'Dessert au soja, aux fruits (produits laitiers frais)',
  '19693': 'Dessert au soja, nature, non enrichi (produits laitiers frais)',
  '19694': 'Dessert au soja, nature, enrichi (produits laitiers frais)',
  '19695': 'Dessert au soja, aux fruits, non enrichi (produits laitiers frais)',
  '19696': 'Dessert au soja, aux amandes (produits laitiers frais)',
  '20911': 'Dessert au soja, aromatisé, enrichi (produits laitiers frais)',
  '20921': 'Dessert au soja, aromatisé, non enrichi (produits laitiers frais)',
  '20922': 'Dessert végétal sans soja, aromatisé (produits laitiers frais)',
  '20923': 'Dessert végétal sans soja, aux fruits (produits laitiers frais)',
  '39248': 'Mousse au chocolat végétale (produits laitiers frais)',
  '22507': 'Omelette aux lardons (œufs)',
  '22511': 'Omelette, garnitures diverses : légumes, fromages, viandes (œufs)',
  '10008': 'Escargot, cru (mollusques et crustacés) — ni poisson ni fruit de mer',
  '10099': 'Escargot, cuit (mollusques et crustacés)',
  '34500': 'Grenouille, cuisse, crue (mollusques et crustacés)',
  '34501': 'Grenouille, cuisse, grillée/poêlée (mollusques et crustacés)',
})

const normaliserLibelle = (value) => String(value || '').trim().toLowerCase()

/**
 * @param {{ alim_code?: string, grp_nom?: string, ssgrp_nom?: string, ssssgrp_nom?: string }|null} record fiche Ciqual
 * @returns {{ origin: string, source: string }|null}
 *   origine sûre et la case Ciqual qui l'a donnée ; null quand la case est
 *   ambiguë, absente, ou que le code est une exception consignée.
 */
export function resolveOriginFromCiqual(record) {
  if (!record) return null
  const code = String(record.alim_code || '')
  if (EXCEPTIONS_PAR_CODE[code]) return null
  const groupe = normaliserLibelle(record.grp_nom)
  const sousGroupe = normaliserLibelle(record.ssgrp_nom)
  const sousSousGroupe = normaliserLibelle(record.ssssgrp_nom)
  const parSousGroupe = ORIGINE_PAR_GROUPE[groupe]?.[sousGroupe]
  if (!parSousGroupe || parSousGroupe === AMBIGU) return null
  if (typeof parSousGroupe === 'string') {
    return { origin: parSousGroupe, source: `ciqual:${groupe} / ${sousGroupe}` }
  }
  const parSousSousGroupe = parSousGroupe[sousSousGroupe]
  if (!parSousSousGroupe || parSousSousGroupe === AMBIGU) return null
  return { origin: parSousSousGroupe, source: `ciqual:${groupe} / ${sousGroupe} / ${sousSousGroupe}` }
}
