import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  MOTIF_LIGNE_ARTICLE,
  RAYONS_ORDONNES,
  RAYON_NON_DECLARE,
  SORTIES_LISTE,
  chargePartageListe,
  documentImprimableListe,
  exporterListeCourses,
  quantiteLisible,
} from '@/lib/domain/courses/exportListe'
import { formatQuantityHuman } from '@/lib/domain/planning/humanQuantities'
import { buildCanonicalPlanPayload, buildWeekSlots } from '@/lib/domain/planning/canonicalPlanPayload'
import { generateClosedLoopPlan } from '@/lib/domain/planning/closedLoopPlanner'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'

/**
 * Ce fichier tient le critère de la phase 0a bis : le texte copié contient
 * EXACTEMENT les lignes de `nutrition_plan_shopping_items` de la semaine, dans
 * l'ordre des six rayons, avec les quantités lisibles de `humanQuantities.js` —
 * 0 ligne perdue, 0 ligne ajoutée.
 *
 * Il le tient de bout en bout : une semaine est réellement planifiée par le
 * solveur, publiée par `buildCanonicalPlanPayload`, puis ses `shopping_items`
 * sont transformés en lignes de base selon la RPC de publication, et c'est sur
 * ces lignes-là que l'export est comparé.
 */

const chemin = (relatif) => fileURLToPath(new URL(relatif, import.meta.url))

/**
 * Lit la table `aisleOrder` d'un fichier source du dépôt.
 *
 * Les six rayons sont RECOPIÉS dans `exportListe.js` (un module de page cliente
 * ne peut pas importer `canonicalPlanPayload.js`, qui tire `node:crypto`). Une
 * recopie qui n'est pas vérifiée dérive : on relit donc les fichiers cités par
 * le plan, et ce test échoue si un rayon y est ajouté, retiré ou déplacé.
 */
function rayonsDeclares(cheminSource) {
  const source = readFileSync(cheminSource, 'utf8')
  const bloc = source.match(/const aisleOrder = \{([^}]*)\}/)
  if (!bloc) throw new Error(`aisleOrder introuvable dans ${cheminSource}`)
  return [...bloc[1].matchAll(/^\s*'?([^':\n]+?)'?:\s*(\d+),/gm)]
    .map(([, nom, rang]) => ({ nom, rang: Number(rang) }))
    .sort((gauche, droite) => gauche.rang - droite.rang)
    .map((entree) => entree.nom)
}

/** Lit les libellés de rayon que `categoryLabels` peut produire. */
function libellesDeCategorie(cheminSource) {
  const source = readFileSync(cheminSource, 'utf8')
  const bloc = source.match(/const categoryLabels = \{([^}]*)\}/)
  if (!bloc) throw new Error(`categoryLabels introuvable dans ${cheminSource}`)
  return [...new Set([...bloc[1].matchAll(/:\s*'([^']+)'/g)].map(([, libelle]) => libelle))]
}

/**
 * Passage du payload de publication aux lignes de `nutrition_plan_shopping_items`,
 * recopié de la RPC `publish_closed_loop_plan` :
 *   — l'INSERT, `supabase/migrations/20260717000002_p2_planned_productions.sql`
 *     lignes 742-770 : `quantity` reçoit `display_quantity`, `checked` est faux,
 *     `aisle_order` retombe sur 999 quand il manque ;
 *   — l'UPDATE qui suit, `supabase/migrations/20260721195504_planning_final_demand_truth.sql`
 *     lignes 299-311 : conditionnement et décision d'achat.
 * C'est cette transformation, et pas le payload brut, qui est « la ligne
 * source » : c'est elle que la page relit ensuite.
 */
function lignesDeBase(shoppingItems) {
  return shoppingItems.map((item, index) => ({
    id: index + 1,
    import_id: 1,
    week_label: item.week_label || 'S1',
    category: item.category ?? null,
    product_name: item.product_name,
    quantity: item.display_quantity ?? null,
    checked: false,
    notes: item.notes ?? null,
    required_qty: item.required_qty ?? null,
    stock_qty: item.stock_qty ?? null,
    reserved_qty: item.reserved_qty ?? null,
    incoming_qty: item.incoming_qty ?? null,
    purchase_qty: item.purchase_qty ?? null,
    purchase_unit: item.purchase_unit ?? null,
    shopping_status: item.shopping_status || 'needed',
    planning_source: 'final_demands',
    aisle_order: item.aisle_order ?? 999,
    shortage_reason: item.shortage_reason ?? null,
    needed_by: item.needed_by ?? null,
    container_qty: item.container_qty ?? null,
    container_size: item.container_size ?? null,
    container_unit: item.container_unit ?? null,
    exact_required_qty: item.exact_required_qty ?? null,
    projected_surplus_qty: item.projected_surplus_qty ?? 0,
  }))
}

const lignesArticles = (texte) => texte.split('\n').filter((ligne) => MOTIF_LIGNE_ARTICLE.test(ligne))

/**
 * Une quantité rendue qui annonce zéro. Le motif est écrit ICI, du côté du test,
 * et pas importé du module : c'est le contrat qu'on vérifie, pas la manière dont
 * le module le tient.
 */
const MOTIF_QUANTITE_NULLE = /(^|\s)0(?:[.,]0+)?(\s|$)/

/** Le mot que la ligne publiée déclare pour son unité comptable : « 8 œufs » → « œufs ». */
const MOTIF_MOT_COMPTABLE = /^\d+(?:[.,]\d+)?\s+(\p{L}[\p{L}\u2019'\- ]*)$/u

describe('les six rayons de l’export sont ceux de la chaîne de publication', () => {
  const sources = [
    ['canonicalPlanPayload.js', chemin('../../lib/domain/planning/canonicalPlanPayload.js')],
    ['finalDemands.js', chemin('../../lib/domain/planning/finalDemands.js')],
  ]

  it('déclare les mêmes rayons, dans le même ordre, que les deux fichiers cités', () => {
    for (const [nom, cheminSource] of sources) {
      expect(rayonsDeclares(cheminSource), nom).toEqual([...RAYONS_ORDONNES])
    }
  })

  it('ne laisse aucun libellé de catégorie hors des six rayons', () => {
    // Si `categoryLabels` se met à produire un septième libellé, les articles
    // concernés tomberaient dans « Rayon non déclaré » : on veut le savoir ici,
    // pas devant l'étal.
    for (const [nom, cheminSource] of sources) {
      const inconnus = libellesDeCategorie(cheminSource).filter((libelle) => !RAYONS_ORDONNES.includes(libelle))
      expect(inconnus, nom).toEqual([])
    }
  })
})

describe('export de la liste de courses, de la semaine publiée au texte copié', () => {
  // La semaine est planifiée UNE FOIS pour tout le describe : une recherche en
  // faisceau de largeur 48 sur le corpus complet coûte plusieurs secondes, et la
  // CI coupe à vingt (modèle : tests/planning/varieteSemaine.test.js).
  const debut = '2026-09-21'
  const cible = { kcal: 707, proteinG: 51, carbsG: 72.6, fatG: 23.7, fiberG: 9.8 }
  const recipes = getCanonicalRecipes({ servings: 2 })
  const plan = generateClosedLoopPlan({
    slots: buildWeekSlots(debut),
    recipes,
    inventoryLots: [],
    constraints: {
      allowShopping: true,
      targetByMeal: { dejeuner: cible, diner: cible },
      maxMinutesByMeal: { dejeuner: 120, diner: 240 },
      preferredActiveMinutes: 30,
    },
    beamWidth: 48,
  })
  const payload = buildCanonicalPlanPayload({
    plan,
    recipes,
    windowStart: debut,
    members: [
      { name: 'Julien', portion_multiplier: 1 },
      { name: 'Zoé', portion_multiplier: 1 },
    ],
    goals: [
      { person_name: 'Julien', target_calories: 2200, target_protein_g: 150, target_carbs_g: 220, target_fat_g: 70, target_fiber_g: 30 },
      { person_name: 'Zoé', target_calories: 1700, target_protein_g: 90, target_carbs_g: 180, target_fat_g: 55, target_fiber_g: 25 },
    ],
    constraints: {},
    inventoryLots: [],
  })

  const rows = lignesDeBase(payload.shopping_items)
  const semaine = rows[0]?.week_label || 'S1'
  const rowsSemaine = rows.filter((row) => row.week_label === semaine)
  const resultat = exporterListeCourses(rows, { semaine })
  const articles = lignesArticles(resultat.texte)

  it('publie une semaine avec des courses à comparer', () => {
    // Un export vide passerait toutes les égalités qui suivent : on vérifie
    // d'abord qu'il y a bien matière.
    expect(rowsSemaine.length).toBeGreaterThan(20)
  })

  it('ne perd aucune ligne et n’en ajoute aucune', () => {
    expect(articles).toHaveLength(rowsSemaine.length)
    expect(resultat.compte.articles).toBe(rowsSemaine.length)
  })

  it('rend exactement les noms de produits des lignes sources, un par ligne', () => {
    const attendus = rowsSemaine.map((row) => row.product_name).sort((a, b) => a.localeCompare(b, 'fr'))
    const rendus = resultat.lignes.map((ligne) => ligne.nom).sort((a, b) => a.localeCompare(b, 'fr'))
    expect(rendus).toEqual(attendus)
    // Chaque ligne du texte porte le nom de son article : le nom ne se perd pas
    // dans la mise en forme.
    for (const ligne of resultat.lignes) {
      expect(articles.some((texte) => texte.includes(ligne.nom)), ligne.nom).toBe(true)
    }
  })

  it('range les rayons dans l’ordre des six, sans en inventer un septième', () => {
    const entetes = resultat.texte
      .split('\n')
      .filter((ligne) => /^[A-ZÀ-Ý].* \(\d+\)$/.test(ligne))
      .map((ligne) => ligne.replace(/ \(\d+\)$/, ''))
    const attendues = RAYONS_ORDONNES.map((rayon) => rayon.toLocaleUpperCase('fr-FR'))
    // Sous-suite : un rayon sans article de la semaine n'a pas d'en-tête.
    expect(attendues.filter((rayon) => entetes.includes(rayon))).toEqual(entetes)
    expect(resultat.anomalies.rayons_non_declares).toEqual([])
  })

  it('range chaque article sous le rayon que sa ligne déclare', () => {
    for (const ligne of resultat.lignes) {
      expect(ligne.rayon, ligne.nom).toBe(ligne.item.category)
    }
  })

  it('écrit les quantités avec humanQuantities, depuis le chiffre de la ligne', () => {
    for (const ligne of resultat.lignes) {
      const row = ligne.item
      expect(ligne.quantite.source, row.product_name).toBe('purchase_qty')
      // Le mot d'une unité comptable est celui que la ligne déclare dans
      // `quantity` (« 8 œufs »), pas un générique choisi ici. À défaut de mot
      // lisible, le générique accordé.
      const motDeclare = row.purchase_unit === 'u'
        ? MOTIF_MOT_COMPTABLE.exec(String(row.quantity ?? '').trim())?.[1] ?? null
        : null
      const etiquette = row.purchase_unit === 'u'
        ? motDeclare || `unité${Math.max(1, Math.round(Number(row.purchase_qty))) > 1 ? 's' : ''}`
        : null
      const attendue = formatQuantityHuman(Number(row.purchase_qty), row.purchase_unit, etiquette).display
      if (MOTIF_QUANTITE_NULLE.test(attendue)) {
        // L'arrondi de `humanQuantities` écrase ce besoin à zéro : la ligne doit
        // alors rendre la quantité DÉCLARÉE. Vérifié ligne par ligne au test
        // suivant ; ici on constate seulement qu'on ne recopie pas le zéro.
        expect(ligne.quantite.texte, row.product_name).not.toBe(attendue)
      } else {
        expect(ligne.quantite.texte, row.product_name).toBe(attendue)
      }
      expect(ligne.texte, row.product_name).toContain(ligne.quantite.texte)
    }
    expect(resultat.anomalies.articles_sans_quantite).toEqual([])
    expect(resultat.anomalies.articles_a_quantite_repliee).toEqual([])
  })

  it('n’annonce jamais zéro là où la ligne déclare un besoin positif', () => {
    // Le défaut trouvé en relecture : `humanQuantities` arrondit à 5 g près sous
    // 100 g, donc tout besoin sous 2,5 g devenait « environ 0 g » — une absence
    // fabriquée par l'affichage, devant l'étal.
    const nulles = resultat.lignes
      .filter((ligne) => MOTIF_QUANTITE_NULLE.test(ligne.quantite.texte))
      .map((ligne) => `${ligne.nom} : ${ligne.quantite.texte}`)
    expect(nulles).toEqual([])

    const sousLeSeuil = rowsSemaine.filter((row) => row.purchase_unit === 'g' && Number(row.purchase_qty) < 2.5)
    expect(sousLeSeuil.length, 'aucun besoin sous 2,5 g cette semaine : ce test n’aurait rien vérifié').toBeGreaterThan(0)
    for (const row of sousLeSeuil) {
      const ligne = resultat.lignes.find((candidate) => candidate.item === row)
      const rendu = Number(String(ligne.quantite.texte).match(/[\d,]+/)[0].replace(',', '.'))
      // Strictement positif, ET égal à ce que la ligne déclare — pas un chiffre
      // de remplacement.
      expect(rendu, row.product_name).toBeGreaterThan(0)
      expect(Math.abs(rendu - Number(row.purchase_qty)), row.product_name).toBeLessThanOrEqual(0.05)
    }
  })

  it('garde le mot que la ligne déclare pour ses unités comptables', () => {
    // `finalDemands.js:641` réduit « œuf » et « pièce » au code d'achat `u`,
    // mais `:642` garde le mot et la publication l'écrit dans `quantity` :
    // l'aplatir en « unité » perdrait une donnée déclarée de la ligne.
    const comptables = rowsSemaine.filter((row) => row.purchase_unit === 'u')
    expect(comptables.length, 'aucune unité comptable cette semaine : ce test n’aurait rien vérifié').toBeGreaterThan(0)
    for (const row of comptables) {
      const mot = MOTIF_MOT_COMPTABLE.exec(String(row.quantity ?? '').trim())?.[1]
      expect(mot, row.product_name).toBeTruthy()
      const ligne = resultat.lignes.find((candidate) => candidate.item === row)
      expect(ligne.quantite.texte, row.product_name).toContain(mot)
    }
    // Et le cas qui a motivé la correction est bien présent cette semaine.
    expect(comptables.map((row) => row.quantity)).toContain('8 œufs')
  })

  it('arrondit lisiblement au lieu de recopier le gramme exact', () => {
    // La valeur de l'arrondi : « 597.33 g » publié devient « environ 600 g ».
    const exacts = rowsSemaine.filter((row) => /\d\.\d/.test(String(row.quantity || '')))
    expect(exacts.length, 'aucune quantité publiée au centième : ce test n’aurait rien vérifié').toBeGreaterThan(0)
    for (const row of exacts) {
      const ligne = resultat.lignes.find((candidate) => candidate.item === row)
      expect(ligne.texte, row.product_name).not.toContain(String(row.quantity))
    }
  })

  // ── P17 : LES TROIS SORTIES, SUR LA MÊME SEMAINE PUBLIÉE ───────────────────
  //
  // Le critère ne demande pas trois boutons : il demande trois sorties qui
  // respectent les six rayons ET LEUR ORDRE. Deux sorties qui divergeraient sur
  // l'ordre seraient pires qu'une seule, parce qu'on ne saurait plus laquelle
  // croire dans le rayon. On compare donc les trois à la même semaine, et
  // entre elles.
  //
  // La semaine est celle que le describe a déjà planifiée et publiée : aucune
  // recherche en faisceau supplémentaire, aucune seconde de plus.

  const partage = chargePartageListe(rows, { semaine })
  const impression = documentImprimableListe(rows, { semaine })

  /** La séquence de rayons d'une sortie, telle qu'elle sort d'elle. */
  const sequenceDesRayons = {
    'presse-papiers': () => resultat.texte
      .split('\n')
      .filter((ligne) => /^[A-ZÀ-Ý].* \(\d+\)$/.test(ligne))
      .map((ligne) => ligne.replace(/ \(\d+\)$/, '')),
    partage: () => partage.texte
      .split('\n')
      .filter((ligne) => /^[A-ZÀ-Ý].* \(\d+\)$/.test(ligne))
      .map((ligne) => ligne.replace(/ \(\d+\)$/, '')),
    impression: () => impression.rayons.map((rayon) => rayon.nom.toLocaleUpperCase('fr-FR')),
  }

  /** Le nombre d'articles rendus par une sortie, compté DANS sa propre sortie. */
  const articlesRendus = {
    'presse-papiers': () => lignesArticles(resultat.texte).length,
    partage: () => lignesArticles(partage.texte).length,
    impression: () => impression.rayons.reduce((total, rayon) => total + rayon.articles.length, 0),
  }

  it('déclare exactement trois sorties, et le test les parcourt toutes', () => {
    // Si une quatrième sortie est ajoutée au module sans être décrite ici, les
    // deux tables ci-dessus ne la couvriront pas : ce test le dit tout de suite
    // plutôt que de laisser les comparaisons passer par omission.
    expect([...SORTIES_LISTE]).toEqual(['presse-papiers', 'partage', 'impression'])
    expect(Object.keys(sequenceDesRayons).sort()).toEqual([...SORTIES_LISTE].sort())
    expect(Object.keys(articlesRendus).sort()).toEqual([...SORTIES_LISTE].sort())
  })

  it('rend les six rayons dans le même ordre sur les trois sorties', () => {
    const attendues = RAYONS_ORDONNES.map((rayon) => rayon.toLocaleUpperCase('fr-FR'))
    const sequences = SORTIES_LISTE.map((sortie) => sequenceDesRayons[sortie]())

    for (const [index, sortie] of SORTIES_LISTE.entries()) {
      const sequence = sequences[index]
      // Sous-suite des six : un rayon sans article de la semaine n'a pas de
      // section, mais aucun rayon ne double ni ne se déplace.
      expect(attendues.filter((rayon) => sequence.includes(rayon)), sortie).toEqual(sequence)
      // Et aucun septième rayon inventé au passage.
      expect(sequence.filter((rayon) => !attendues.includes(rayon)), sortie).toEqual([])
    }
    // Les trois séquences sont la MÊME séquence, pas trois séquences valides.
    expect(sequences[1], 'partage').toEqual(sequences[0])
    expect(sequences[2], 'impression').toEqual(sequences[0])
  })

  it('rend le même nombre d’articles que la table source sur les trois sorties', () => {
    for (const sortie of SORTIES_LISTE) {
      expect(articlesRendus[sortie](), sortie).toBe(rowsSemaine.length)
    }
  })

  it('range chaque article sous le même rayon sur les trois sorties', () => {
    // La sortie imprimée est la seule qui porte des champs : on vérifie qu'elle
    // range chaque nom de produit sous le rayon que la ligne source déclare.
    const rayonSourceParNom = new Map(rowsSemaine.map((row) => [row.product_name, row.category]))
    for (const rayon of impression.rayons) {
      for (const article of rayon.articles) {
        expect(rayonSourceParNom.get(article.nom), article.nom).toBe(rayon.nom)
      }
    }
  })

  it('partage exactement le texte du presse-papiers, à l’octet près', () => {
    // C'est la garantie structurelle : les deux sorties textuelles ne PEUVENT
    // pas diverger, puisqu'il n'y a qu'un texte.
    expect(partage.texte).toBe(resultat.texte)
    expect(partage.titre).toBe(resultat.titre)
    // Le titre reste la première ligne du corps : une cible de partage qui
    // ignore le titre reçoit quand même un message lisible seul.
    expect(partage.texte.split('\n')[0]).toBe(partage.titre)
  })

  it('rend à l’impression les mêmes noms, quantités et conditionnements que le texte', () => {
    const imprimes = impression.rayons.flatMap((rayon) => rayon.articles)
    expect(imprimes).toHaveLength(resultat.lignes.length)
    for (const [index, ligne] of resultat.lignes.entries()) {
      const article = imprimes[index]
      expect(article.nom, ligne.nom).toBe(ligne.nom)
      expect(article.quantite, ligne.nom).toBe(ligne.quantite.texte)
      expect(article.conditionnement, ligne.nom).toBe(ligne.conditionnement)
      expect(article.achete, ligne.nom).toBe(Boolean(ligne.item.checked))
      // Et chaque champ est bien celui que la ligne du texte porte.
      if (article.quantite) expect(ligne.texte, ligne.nom).toContain(article.quantite)
      if (article.conditionnement) expect(ligne.texte, ligne.nom).toContain(article.conditionnement)
    }
  })

  it('donne à chaque article imprimé une clé distincte', () => {
    const cles = impression.rayons.flatMap((rayon) => rayon.articles.map((article) => article.cle))
    expect(new Set(cles).size).toBe(cles.length)
  })

  it('rend les mêmes comptes et les mêmes anomalies sur les trois sorties', () => {
    expect(partage.compte).toEqual(resultat.compte)
    expect(impression.compte).toEqual(resultat.compte)
    expect(partage.anomalies).toEqual(resultat.anomalies)
    expect(impression.anomalies).toEqual(resultat.anomalies)
    // Le résumé imprimé annonce les mêmes chiffres que la deuxième ligne du texte.
    expect(resultat.texte.split('\n')[1]).toBe(impression.resume)
  })
})

describe('ce qui n’est pas déclaré est absent, et le module le dit', () => {
  const article = (surcharge) => ({
    id: 1, week_label: 'S1', category: 'Épicerie', product_name: 'Riz basmati',
    quantity: '500 g', purchase_qty: 500, purchase_unit: 'g', checked: false, ...surcharge,
  })

  it('n’invente pas de rayon pour une catégorie hors des six', () => {
    const resultat = exporterListeCourses([
      article({ id: 1, category: 'Surgelés', product_name: 'Épinards surgelés' }),
      article({ id: 2, category: 'Épicerie' }),
    ], { semaine: 'S1' })

    expect(resultat.compte.articles).toBe(2)
    expect(resultat.anomalies.rayons_non_declares).toEqual(['Surgelés'])
    const rayons = resultat.rayons.map((rayon) => rayon.nom)
    expect(rayons).toEqual(['Épicerie', RAYON_NON_DECLARE])
    // La ligne n'est pas perdue : elle est rangée à part, en fin de texte.
    expect(lignesArticles(resultat.texte)).toHaveLength(2)
    expect(resultat.texte).toContain(RAYON_NON_DECLARE.toLocaleUpperCase('fr-FR'))
  })

  it('sort sans quantité plutôt que d’en fabriquer une', () => {
    const resultat = exporterListeCourses([
      article({ purchase_qty: null, purchase_unit: null, quantity: null }),
    ], { semaine: 'S1' })

    expect(lignesArticles(resultat.texte)).toEqual(['- [ ] Riz basmati'])
    expect(resultat.anomalies.articles_sans_quantite).toEqual(['Riz basmati'])
  })

  it('replie sur la quantité déjà rédigée quand le chiffre manque, et le signale', () => {
    const resultat = exporterListeCourses([
      article({ purchase_qty: null, purchase_unit: null, quantity: '2 paquets' }),
    ], { semaine: 'S1' })

    expect(lignesArticles(resultat.texte)).toEqual(['- [ ] Riz basmati — 2 paquets'])
    expect(resultat.anomalies.articles_a_quantite_repliee).toEqual(['Riz basmati'])
  })

  it('ne retient que la semaine demandée', () => {
    const resultat = exporterListeCourses([
      article({ id: 1, week_label: 'S1', product_name: 'Riz basmati' }),
      article({ id: 2, week_label: 'S2', product_name: 'Lentilles vertes' }),
    ], { semaine: 'S2' })

    expect(lignesArticles(resultat.texte)).toEqual(['- [ ] Lentilles vertes — environ 500 g'])
    expect(resultat.texte.split('\n')[0]).toBe('Liste de courses — S2')
  })

  it('dit qu’il n’y a rien plutôt que de rendre un texte vide', () => {
    const resultat = exporterListeCourses([], { semaine: 'S1' })
    expect(resultat.compte.articles).toBe(0)
    expect(resultat.texte).toContain('Aucun article pour cette semaine.')
    expect(lignesArticles(resultat.texte)).toEqual([])
  })

  it('rend l’état acheté de chaque ligne sans la retirer', () => {
    const resultat = exporterListeCourses([
      article({ id: 1, product_name: 'Riz basmati', checked: true }),
      article({ id: 2, product_name: 'Sel fin', checked: false }),
    ], { semaine: 'S1' })

    expect(lignesArticles(resultat.texte)).toEqual([
      '- [x] Riz basmati — environ 500 g',
      '- [ ] Sel fin — environ 500 g',
    ])
    expect(resultat.compte).toMatchObject({ articles: 2, achetes: 1, restants: 1 })
  })

  it('ajoute le conditionnement quand la ligne le déclare, et rien sinon', () => {
    const avec = exporterListeCourses([
      article({ container_qty: 2, container_size: 500, container_unit: 'g' }),
    ], { semaine: 'S1' })
    expect(lignesArticles(avec.texte)).toEqual(['- [ ] Riz basmati — environ 500 g (2 × 500 g)'])

    const sans = exporterListeCourses([article({ container_qty: 2, container_size: null })], { semaine: 'S1' })
    expect(lignesArticles(sans.texte)).toEqual(['- [ ] Riz basmati — environ 500 g'])
  })

  it('reprend le mot déclaré par la ligne, et n’en invente aucun quand elle n’en déclare pas', () => {
    expect(quantiteLisible({ purchase_qty: 8, purchase_unit: 'u', quantity: '8 œufs' }))
      .toEqual({ texte: '8 œufs', source: 'purchase_qty' })
    expect(quantiteLisible({ purchase_qty: 2, purchase_unit: 'u', quantity: '2 pièces' }))
      .toEqual({ texte: '2 pièces', source: 'purchase_qty' })
    // Rien de lisible dans la ligne : le générique. Jamais « œufs » deviné
    // depuis le nom du produit, ni le mot extrait d'une phrase de contenant.
    expect(quantiteLisible({ purchase_qty: 1, purchase_unit: 'u', product_name: 'Œuf cru' }))
      .toEqual({ texte: '1 unité', source: 'purchase_qty' })
    expect(quantiteLisible({ purchase_qty: 6, purchase_unit: 'u', quantity: 'boîte de 6 œufs', product_name: 'Œuf cru' }))
      .toEqual({ texte: '6 unités', source: 'purchase_qty' })
  })

  it('ne rend jamais « 0 g » pour un besoin déclaré positif', () => {
    expect(quantiteLisible({ purchase_qty: 2.35, purchase_unit: 'g' }))
      .toEqual({ texte: '2,4 g', source: 'purchase_qty' })
    expect(quantiteLisible({ purchase_qty: 0.233, purchase_unit: 'g' }))
      .toEqual({ texte: '0,2 g', source: 'purchase_qty' })
    // Au-dessus du seuil d'arrondi, `humanQuantities` reprend la main sans
    // exception : la correction ne vaut que pour le zéro.
    expect(quantiteLisible({ purchase_qty: 2.6, purchase_unit: 'g' }))
      .toEqual({ texte: 'environ 5 g', source: 'purchase_qty' })
  })

  it('tient une ligne par article même si la donnée porte un retour chariot', () => {
    const resultat = exporterListeCourses([
      article({ product_name: 'Riz\nbasmati', quantity: '2\npaquets', purchase_qty: null, purchase_unit: null }),
    ], { semaine: 'S1' })

    expect(lignesArticles(resultat.texte)).toEqual(['- [ ] Riz basmati — 2 paquets'])
    expect(resultat.texte.split('\n').filter((ligne) => ligne.includes('basmati'))).toHaveLength(1)
  })

  it('accepte une liste absente sans exploser', () => {
    expect(exporterListeCourses(null).compte.articles).toBe(0)
    expect(exporterListeCourses(undefined).compte.articles).toBe(0)
  })
})

describe('les trois sorties tiennent le même contrat sur les cas limites', () => {
  const article = (surcharge) => ({
    id: 1, week_label: 'S1', category: 'Épicerie', product_name: 'Riz basmati',
    quantity: '500 g', purchase_qty: 500, purchase_unit: 'g', checked: false, ...surcharge,
  })

  // Un jeu volontairement désordonné à l'entrée : l'ordre de parcours ne doit
  // rien devoir à l'ordre des lignes en base.
  const desordre = [
    article({ id: 1, category: 'Épicerie', product_name: 'Riz basmati' }),
    article({ id: 2, category: 'Surgelés', product_name: 'Épinards surgelés' }),
    article({ id: 3, category: 'Fruits et légumes', product_name: 'Carotte' }),
    article({ id: 4, category: 'Crèmerie', product_name: 'Beurre doux', checked: true }),
    article({ id: 5, category: 'Viandes', product_name: 'Poulet entier cru' }),
  ]

  it('renvoie la catégorie non déclarée en fin de parcours sur les trois sorties', () => {
    const texte = exporterListeCourses(desordre, { semaine: 'S1' })
    const partage = chargePartageListe(desordre, { semaine: 'S1' })
    const impression = documentImprimableListe(desordre, { semaine: 'S1' })

    const attendu = ['Fruits et légumes', 'Viandes', 'Crèmerie', 'Épicerie', RAYON_NON_DECLARE]
    expect(texte.rayons.map((rayon) => rayon.nom)).toEqual(attendu)
    expect(partage.rayons.map((rayon) => rayon.nom)).toEqual(attendu)
    expect(impression.rayons.map((rayon) => rayon.nom)).toEqual(attendu)

    // La section non déclarée est la dernière, et elle est signalée comme telle
    // sur la sortie imprimée aussi : la feuille ne doit pas laisser croire que
    // « Surgelés » est un septième rayon du parcours.
    expect(impression.rayons.at(-1).declare).toBe(false)
    expect(impression.anomalies.rayons_non_declares).toEqual(['Surgelés'])
  })

  it('rend l’état acheté à l’impression sans retirer la ligne', () => {
    const impression = documentImprimableListe(desordre, { semaine: 'S1' })
    const beurre = impression.rayons
      .flatMap((rayon) => rayon.articles)
      .find((candidat) => candidat.nom === 'Beurre doux')
    expect(beurre.achete).toBe(true)
    expect(impression.compte.articles).toBe(desordre.length)
  })

  it('n’annonce pas un résumé quand il n’y a rien à imprimer', () => {
    const impression = documentImprimableListe([], { semaine: 'S1' })
    expect(impression.rayons).toEqual([])
    expect(impression.compte.articles).toBe(0)
    // null, et non « 0 article · 0 rayon » : un faux résumé sur une feuille
    // blanche ne dit rien de plus qu'un titre seul.
    expect(impression.resume).toBeNull()
    expect(impression.titre).toBe('Liste de courses — S1')
  })

  it('ne retient que la semaine demandée, sur les trois sorties', () => {
    const deuxSemaines = [
      article({ id: 1, week_label: 'S1', product_name: 'Riz basmati' }),
      article({ id: 2, week_label: 'S2', product_name: 'Lentilles vertes' }),
    ]
    expect(lignesArticles(exporterListeCourses(deuxSemaines, { semaine: 'S1' }).texte)).toHaveLength(1)
    expect(lignesArticles(chargePartageListe(deuxSemaines, { semaine: 'S1' }).texte)).toHaveLength(1)
    expect(documentImprimableListe(deuxSemaines, { semaine: 'S1' }).compte.articles).toBe(1)
  })

  it('accepte une liste absente sans exploser, sur les trois sorties', () => {
    expect(chargePartageListe(null).compte.articles).toBe(0)
    expect(documentImprimableListe(null).compte.articles).toBe(0)
    expect(documentImprimableListe(undefined).rayons).toEqual([])
  })
})

describe('la page Courses branche les trois sorties, et n’en recompose aucune', () => {
  const page = readFileSync(chemin('../../app/courses/page.js'), 'utf8')
  const feuille = readFileSync(chemin('../../app/courses/courses.css'), 'utf8')

  it('appelle les trois API de sortie du navigateur', () => {
    // C'est ce que P17 appelle « trois sorties » : trois chemins réels hors de
    // l'écran, pas trois mises en forme du même bouton.
    expect(page).toContain('navigator.clipboard')
    expect(page).toContain('navigator.share')
    expect(page).toContain('window.print()')
  })

  it('compose chaque sortie par le module, et ne trie rien de son côté', () => {
    for (const composeur of ['exporterListeCourses', 'chargePartageListe', 'documentImprimableListe']) {
      expect(page, composeur).toContain(composeur)
    }
    // Aucun tri ni regroupement local : l'ordre des rayons est décidé une fois,
    // dans le module. Un `.sort(` réintroduit ici ferait diverger la feuille
    // imprimée du texte copié sans que rien ne le dise.
    expect(page.includes('docImprimable.rayons.sort')).toBe(false)
    expect(page).not.toMatch(/RAYONS_ORDONNES|RAYON_NON_DECLARE/)
  })

  it('montre un repli écrit quand le partage natif manque, jamais rien', () => {
    // `navigator.share` n'existe ni sur la plupart des navigateurs de bureau,
    // ni hors contexte sécurisé. Un bouton qui ne ferait rien serait pire que
    // pas de bouton : on vérifie que les deux raisons sont rédigées et posées.
    expect(page).toMatch(/partage_absent\s*:/)
    expect(page).toMatch(/partage_refuse\s*:/)
    expect(page).toContain("raison: 'partage_absent'")
    expect(page).toContain("raison: 'partage_refuse'")
    // Une annulation de la feuille de partage n'est pas une panne.
    expect(page).toContain("AbortError")
  })

  it('imprime par une feuille @media print colocalisée, sans bibliothèque PDF', () => {
    expect(feuille).toContain('@media print')
    expect(feuille).toContain('.cou-print-doc')
    // Le document imprimable est masqué à l'écran et révélé à l'impression.
    expect(feuille).toMatch(/\.cou-print-doc\s*\{\s*display:\s*none;\s*\}/)
    // Aucune dépendance PDF au projet : le PDF est celui du navigateur.
    const paquets = JSON.parse(readFileSync(chemin('../../package.json'), 'utf8'))
    const dependances = Object.keys(paquets.dependencies || {})
    expect(dependances.filter((nom) => /pdf|jspdf|html2canvas|print-js/i.test(nom))).toEqual([])
  })
})
