import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * LES ROUTINES QUITTENT LE CHEMIN DE DÉCISION — livrable 4.4.
 *
 * CE QUE CE FICHIER GARDE. Trois boutons écrivaient la semaine en base par une
 * Routine claude.ai : « Réorganiser » et « Improviser » sur l'accueil
 * (`/api/routine/replan-week`), « Régénérer le repas » dans la modale de
 * remplacement (`/api/routine/modify-meal`). Un modèle de langage y décidait
 * d'un repas hors solveur, hors règles de répétition, hors invariants et hors
 * de la transaction `publish_canonical_closed_loop_plan`, en trente à soixante
 * secondes. Ils sont retirés.
 *
 * CE QU'IL NE GARDE PAS, ET C'EST VOULU. Le plan est explicite : « la Routine
 * ne reste que pour la RÉDACTION d'une fiche ». Écrire le texte d'une recette
 * n'est pas décider d'un repas. Un test qui interdirait les deux interdirait ce
 * que le plan autorise — il serait faux dans l'autre sens.
 *
 * COMMENT LA DISTINCTION EST FAITE. Pas par une liste écrite à la main, pas par
 * un commentaire : par la SOURCE de chaque route. Une route de Routine est sur
 * le chemin de décision si elle écrit une table de planning, OU si elle lit une
 * coordonnée de planning dans le corps de la requête (`import_id`, `meal_date`,
 * `meal_type`…). Le jour où `/api/routine/regenerate-recipe` accepterait un
 * `import_id`, elle serait reclassée toute seule et ce fichier interdirait son
 * appel depuis `components/CookMode.jsx`.
 *
 * CE QU'IL NE PROUVE PAS. Il ne regarde pas ce que fait la Routine de l'autre
 * côté du webhook : c'est hors du dépôt. Ce qu'il prouve, c'est qu'aucun écran
 * ne lui confie plus une décision.
 */

const RACINE = path.resolve(__dirname, '..', '..')

// ───────────────────────────────────────────────────────────────────────────
// Outillage : lire du code sans lire ses commentaires
// ───────────────────────────────────────────────────────────────────────────

/**
 * Retire commentaires de ligne et de bloc, en préservant les chaînes.
 *
 * POURQUOI. Ce fichier interdit des APPELS, pas des mentions. Les commentaires
 * de `TodayMeals.jsx` et de `CookMode.jsx` citent nommément les routes retirées
 * — c'est la trace de ce qui a été enlevé, et elle a de la valeur. Un `grep` nu
 * les compterait comme des appels et forcerait à effacer l'explication pour
 * faire passer le test : la garde ferait disparaître ce qu'elle protège.
 *
 * LIMITE ASSUMÉE : une expression régulière littérale contenant `//` ou `/*`
 * serait prise pour un commentaire. Le cas est couvert par l'auto-test
 * ci-dessous pour les formes courantes, et n'existe pas dans le périmètre.
 */
export function sansCommentaires(source) {
  let sortie = ''
  let i = 0
  const n = source.length
  while (i < n) {
    const c = source[i]
    const suivant = source[i + 1]
    if (c === '/' && suivant === '/') {
      while (i < n && source[i] !== '\n') i++
      continue
    }
    if (c === '/' && suivant === '*') {
      i += 2
      while (i < n && !(source[i] === '*' && source[i + 1] === '/')) i++
      i += 2
      continue
    }
    if (c === '"' || c === "'") {
      const guillemet = c
      sortie += c
      i++
      while (i < n) {
        const x = source[i]
        sortie += x
        i++
        if (x === '\\') { if (i < n) { sortie += source[i]; i++ } continue }
        if (x === guillemet || x === '\n') break
      }
      continue
    }
    if (c === '`') {
      sortie += c
      i++
      let profondeur = 0
      while (i < n) {
        const x = source[i]
        if (x === '\\') { sortie += x; i++; if (i < n) { sortie += source[i]; i++ } continue }
        if (x === '$' && source[i + 1] === '{') { profondeur++; sortie += '${'; i += 2; continue }
        if (x === '}' && profondeur > 0) { profondeur--; sortie += x; i++; continue }
        sortie += x
        i++
        if (x === '`' && profondeur === 0) break
      }
      continue
    }
    sortie += c
    i++
  }
  return sortie
}

function* fichiersSources(dossier) {
  for (const entree of readdirSync(dossier)) {
    if (['node_modules', '.next', '.git'].includes(entree)) continue
    const complet = path.join(dossier, entree)
    if (statSync(complet).isDirectory()) yield* fichiersSources(complet)
    else if (/\.(js|jsx|mjs)$/.test(entree)) yield complet
  }
}

const relatif = (complet) => path.relative(RACINE, complet).split(path.sep).join('/')

// ───────────────────────────────────────────────────────────────────────────
// Ce qu'on appelle « une table de planning »
// ───────────────────────────────────────────────────────────────────────────

/**
 * Les tables écrites par la publication atomique, relevées dans la source des
 * migrations qui définissent `publish_canonical_closed_loop_plan` et sa
 * transaction (`20260717000002_p2_planned_productions.sql`,
 * `20260721195504_planning_final_demand_truth.sql`), plus
 * `plan_regen_requests` : elle n'est pas écrite par la publication, mais c'est
 * la file par laquelle une Routine obtient le droit d'écrire la semaine, donc
 * une écriture de planning par procuration.
 */
const TABLES_DE_PLANNING = [
  'nutrition_plan_imports',
  'nutrition_plan_meals',
  'nutrition_plan_prep_tasks',
  'nutrition_plan_shopping_items',
  'meal_plan_slots',
  'meal_plan_versions',
  'meal_plan_validation_issues',
  'planned_productions',
  'planned_consumptions',
  'planned_demands',
  'prep_task_dependencies',
  'inventory_reservations',
  'recipe_nutrition_snapshots',
  'decision_audit_log',
  'plan_regen_requests',
]

const VERBES_D_ECRITURE = ['insert', 'update', 'upsert', 'delete']

/** Sites d'écriture Supabase dans une source : `.from('table').insert(` etc. */
function ecrituresDePlanning(source) {
  const motif = new RegExp(
    `\\.from\\(\\s*['"\`](${TABLES_DE_PLANNING.join('|')})['"\`]\\s*\\)\\s*\\.\\s*(\\w+)\\s*\\(`,
    'g',
  )
  const trouvees = []
  let m
  while ((m = motif.exec(source))) {
    if (VERBES_D_ECRITURE.includes(m[2])) trouvees.push({ table: m[1], verbe: m[2] })
  }
  return trouvees
}

// ───────────────────────────────────────────────────────────────────────────
// Classement des routes de Routine : décision ou rédaction
// ───────────────────────────────────────────────────────────────────────────

/**
 * Une coordonnée de planning désigne un créneau de la semaine. Une route qui en
 * lit une dans le corps de la requête agit SUR le plan, quoi qu'en dise sa
 * documentation. Une route de rédaction, elle, ne connaît qu'une recette.
 */
const COORDONNEES_DE_PLANNING = [
  'import_id', 'importId',
  'meal_date', 'mealDate',
  'meal_type', 'mealType',
  'plan_version_id', 'planVersionId',
  'meal_plan_slot_id', 'slot_key',
  'targetStart', 'target_start',
  'pinned',
]

/** Champs lus dans le corps de la requête : `const { a } = body` et `body.a`. */
function champsLusDuCorps(source) {
  const noms = new Set()
  const destructure = /(?:const|let|var)\s*\{([^}]*)\}\s*=\s*(?:body|await\s+request\.json\(\))/g
  let m
  while ((m = destructure.exec(source))) {
    for (const brut of m[1].split(',')) {
      const nom = brut.split(':')[0].split('=')[0].trim()
      if (nom) noms.add(nom)
    }
  }
  const acces = /\bbody\s*\??\.\s*([A-Za-z_$][\w$]*)/g
  while ((m = acces.exec(source))) noms.add(m[1])
  return noms
}

const DOSSIER_ROUTINES = path.join(RACINE, 'app', 'api', 'routine')

function classerLesRoutes() {
  const classement = new Map()
  for (const nom of readdirSync(DOSSIER_ROUTINES)) {
    const fichier = path.join(DOSSIER_ROUTINES, nom, 'route.js')
    const source = sansCommentaires(readFileSync(fichier, 'utf8'))
    const ecritures = ecrituresDePlanning(source)
    const champs = champsLusDuCorps(source)
    const coordonnees = COORDONNEES_DE_PLANNING.filter((coord) => champs.has(coord))
    classement.set(nom, {
      nom,
      chemin: `/api/routine/${nom}`,
      ecritures,
      coordonnees,
      decide: ecritures.length > 0 || coordonnees.length > 0,
    })
  }
  return classement
}

/** Appels `/api/routine/<nom>` présents dans du CODE (commentaires exclus). */
function appelsDeRoutine(racines) {
  const appels = []
  for (const racine of racines) {
    for (const fichier of fichiersSources(path.join(RACINE, racine))) {
      const code = sansCommentaires(readFileSync(fichier, 'utf8'))
      const motif = /\/api\/routine\/([a-z0-9-]+)/g
      let m
      while ((m = motif.exec(code))) appels.push({ fichier: relatif(fichier), route: m[1] })
    }
  }
  return appels
}

// ═══════════════════════════════════════════════════════════════════════════

describe('l’outil de lecture ne se trompe pas de cible', () => {
  it('efface les commentaires et garde les chaînes', () => {
    const code = [
      "// appel historique vers /api/routine/modify-meal",
      "/* bloc : /api/routine/replan-week */",
      "const a = '/api/routine/regenerate-recipe'",
      'const b = `https://exemple.test//double`',
      "const c = 'texte // qui n’est pas un commentaire'",
      "const d = /^[^/]+$/.test(x)",
    ].join('\n')
    const net = sansCommentaires(code)
    expect(net).not.toContain('modify-meal')
    expect(net).not.toContain('replan-week')
    expect(net).toContain("'/api/routine/regenerate-recipe'")
    expect(net).toContain('https://exemple.test//double')
    expect(net).toContain('texte // qui n’est pas un commentaire')
    expect(net).toContain('/^[^/]+$/')
  })

  it('repère une écriture Supabase et ignore une lecture', () => {
    expect(ecrituresDePlanning("supabase.from('meal_plan_slots').update({ locked: true })"))
      .toEqual([{ table: 'meal_plan_slots', verbe: 'update' }])
    expect(ecrituresDePlanning("supabase.from('meal_plan_slots').select('id')")).toEqual([])
    expect(ecrituresDePlanning("supabase.from('household_members').insert({})")).toEqual([])
  })

  it('repère une coordonnée de planning lue dans le corps', () => {
    expect(champsLusDuCorps('const { import_id, direction } = body').has('import_id')).toBe(true)
    expect(champsLusDuCorps('const cible = body.meal_date').has('meal_date')).toBe(true)
    expect(champsLusDuCorps('const { recipe_id } = body').has('import_id')).toBe(false)
  })
})

describe('les routes de Routine, classées par ce qu’elles font', () => {
  const classement = classerLesRoutes()

  it('les quatre routes du dépôt sont classées', () => {
    expect([...classement.keys()].sort()).toEqual([
      'generate-plan', 'modify-meal', 'regenerate-recipe', 'replan-week',
    ])
  })

  it('`generate-plan` décide : elle écrit `plan_regen_requests`', () => {
    const route = classement.get('generate-plan')
    expect(route.ecritures).toContainEqual({ table: 'plan_regen_requests', verbe: 'insert' })
    expect(route.decide).toBe(true)
  })

  it('`replan-week` décide : elle écrit `plan_regen_requests` et lit `import_id`', () => {
    const route = classement.get('replan-week')
    expect(route.ecritures).toContainEqual({ table: 'plan_regen_requests', verbe: 'insert' })
    expect(route.coordonnees).toContain('import_id')
    expect(route.decide).toBe(true)
  })

  it('`modify-meal` décide : elle vise un créneau (import_id, meal_date, meal_type)', () => {
    // Elle n'écrit rien elle-même — c'est la Routine, derrière le webhook, qui
    // écrit. Si le classement ne tenait qu'aux écritures visibles dans le
    // dépôt, elle passerait pour une route de rédaction. C'est la raison d'être
    // du second signal.
    const route = classement.get('modify-meal')
    expect(route.ecritures).toEqual([])
    expect(route.coordonnees).toEqual(expect.arrayContaining(['import_id', 'meal_date', 'meal_type']))
    expect(route.decide).toBe(true)
  })

  it('`regenerate-recipe` rédige : aucune écriture de planning, aucune coordonnée', () => {
    const route = classement.get('regenerate-recipe')
    expect(route.ecritures).toEqual([])
    expect(route.coordonnees).toEqual([])
    expect(route.decide).toBe(false)
  })
})

describe('aucun écran n’appelle une Routine de décision', () => {
  const classement = classerLesRoutes()
  const appels = appelsDeRoutine(['app', 'components'])

  it('les routes de décision n’ont plus aucun appelant', () => {
    const fautifs = appels.filter(({ route }) => classement.get(route)?.decide)
    expect(fautifs).toEqual([])
  })

  it('les trois appels nommés par le plan ont disparu de leurs deux écrans', () => {
    const ecrans = ['app/planning/components/TodayMeals.jsx', 'components/CookMode.jsx']
    const restants = appels.filter((appel) => ecrans.includes(appel.fichier))
    expect(restants.map((appel) => `${appel.fichier} → ${appel.route}`).sort()).toEqual([
      // Celui-ci reste, et c'est le seul : il réécrit le TEXTE d'une fiche.
      'components/CookMode.jsx → regenerate-recipe',
    ])
  })

  it('la rédaction reste possible — sans quoi ce fichier interdirait ce que le plan autorise', () => {
    // Assertion POSITIVE, volontairement. Une garde qui bannirait toute la
    // famille `/api/routine/*` passerait les trois tests précédents et
    // retirerait une fonction que le §8 du plan demande de garder.
    const redaction = appels.filter(({ route }) => classement.get(route)?.decide === false)
    expect(redaction.length).toBeGreaterThan(0)
    expect(redaction.map((appel) => appel.route)).toContain('regenerate-recipe')
  })

  it('le bouton de rédaction ne se présente plus comme une décision', () => {
    // Il s'appelait « Changer le plat » pour un geste qui ne change pas le
    // repas prévu. Le libellé était la seule chose qui décidait, et elle
    // décidait faux.
    // Lecture sans les commentaires : le commentaire du fichier CITE l'ancien
    // libellé, et c'est bien — c'est la trace de ce qui a été corrigé.
    const code = sansCommentaires(readFileSync(path.join(RACINE, 'components/CookMode.jsx'), 'utf8'))
    expect(code).not.toContain('Changer le plat')
    expect(code).toContain('Réécrire la fiche')
  })

  it('« Changer ce plat » passe par le moteur, et publie par la transaction', () => {
    const source = sansCommentaires(
      readFileSync(path.join(RACINE, 'app/planning/components/TodayMeals.jsx'), 'utf8'),
    )
    expect(source).toContain('/api/planning/alternatives')
    expect(source).toContain('/api/planning/generate-v3')
    expect(source).toContain('chosen_recipes')
  })

  it('« Réorganiser la suite » passe par le moteur en portée `days`', () => {
    const source = sansCommentaires(
      readFileSync(path.join(RACINE, 'app/planning/components/TodayMeals.jsx'), 'utf8'),
    )
    expect(source).toMatch(/scope:\s*'days'/)
  })
})

describe('l’issue de secours est visible à l’écran', () => {
  /**
   * Le plan nomme le risque du livrable et sa parade : « perte de fonction
   * perçue pendant la bascule → la Routine reste disponible pour la rédaction,
   * et le statut `review_required` du solveur devient la seule issue de
   * secours, VISIBLE À L'ÉCRAN ». Un toast ne tient pas cette promesse : il
   * s'efface, et l'écran d'accueil est celui qu'on rouvre le lendemain.
   */
  const accueil = readFileSync(path.join(RACINE, 'app/planning/components/TodayMeals.jsx'), 'utf8')
  const styles = readFileSync(path.join(RACINE, 'app/planning/components/TodayMeals.css'), 'utf8')
  const planning = readFileSync(path.join(RACINE, 'app/planning/page.js'), 'utf8')

  it('l’accueil rend un bandeau persistant quand la semaine est en revue', () => {
    const code = sansCommentaires(accueil)
    expect(code).toContain("review_required")
    expect(code).toContain('tm-revue')
    expect(code).toMatch(/\{revue && \(/)
    expect(styles).toContain('.tm-revue')
  })

  it('le bandeau affiche le motif du moteur, pas une phrase fabriquée ici', () => {
    const code = sansCommentaires(accueil)
    expect(code).toContain('revue.motif')
    expect(code).toContain('planIssues')
  })

  it('le bandeau renvoie vers le détail de la semaine', () => {
    expect(sansCommentaires(accueil)).toContain('href="/planning"')
  })

  it('l’écran de planning garde son propre bandeau de revue', () => {
    expect(sansCommentaires(planning)).toContain("readiness.reason === 'review_required'")
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// §9.3 — « zéro écriture dans les tables de planning hors publication atomique »
// ═══════════════════════════════════════════════════════════════════════════

/**
 * CE QUE CE RELEVÉ EST, ET CE QU'IL N'EST PAS.
 *
 * L'interdit du §9.3 n'est PAS tenu, et ce fichier ne prétend pas le tenir.
 * Mesure du 17 septembre 2026, avant et après ce livrable : 28 sites
 * d'écriture dans `app/`, `components/` et `lib/`, soit 22 couples
 * (fichier, verbe, table) distincts. Le livrable 4.4 retire des APPELANTS de
 * routes qui font décider un modèle de langage ; il ne retire aucun site
 * d'écriture, et le chiffre est donc le même avant et après.
 *
 * CE QUE LE RELEVÉ APPORTE MALGRÉ TOUT : un cliquet. Chaque site est nommé avec
 * son motif. Un site de plus fait rougir ce test, et personne ne peut en
 * ajouter un sans l'écrire ici. Les quatre familles restantes sont, par ordre
 * de gravité décroissante pour le §9.3 :
 *
 *   1. `lib/nutritionPlanService.js` — le chemin d'IMPORT hérité (un plan JSON
 *      versé en base repas par repas). C'est la seule voie qui écrive encore
 *      `nutrition_plan_meals` hors publication atomique. Sa convergence n'est
 *      inscrite à aucune phase du plan ; elle reste due.
 *   2. `plan_regen_requests` (`generate-plan`, `replan-week`) — la file des
 *      Routines. Depuis ce livrable, AUCUN écran ne la remplit : les deux
 *      routes n'ont plus d'appelant dans `app/` ni `components/`, ce que le
 *      premier `describe` ci-dessus vérifie. Les routes sont conservées plutôt
 *      que supprimées : le §8 du plan demande de les retirer « si elles n'ont
 *      pas servi en un mois », et c'est une décision du foyer, pas de ce
 *      livrable.
 *   3. `nutrition_plan_shopping_items` — la liste de courses (cases cochées,
 *      images, résolution d'ingrédients, reconstruction). Sa source unique de
 *      vérité est le livrable 4.5, pas celui-ci.
 *   4. `inventory_reservations` et `meal_plan_slots.locked` — deux écritures
 *      qui n'élisent aucun plat : la consommation d'un lot au moment de
 *      cuisiner, et l'épingle. Voir l'arbitrage ci-dessous.
 */
const RELEVE_DES_ECRITURES = [
  // ── 1. Import hérité d'un plan JSON ──
  { fichier: 'lib/nutritionPlanService.js', verbe: 'insert', table: 'nutrition_plan_imports', sites: 1, motif: 'import hérité : verse un plan JSON en base' },
  { fichier: 'lib/nutritionPlanService.js', verbe: 'delete', table: 'nutrition_plan_imports', sites: 1, motif: 'suppression d’un import par l’utilisateur' },
  { fichier: 'lib/nutritionPlanService.js', verbe: 'insert', table: 'nutrition_plan_meals', sites: 1, motif: 'import hérité : les repas du plan JSON' },
  { fichier: 'lib/nutritionPlanService.js', verbe: 'update', table: 'nutrition_plan_meals', sites: 1, motif: 'import hérité : recalage des macros' },
  { fichier: 'lib/nutritionPlanService.js', verbe: 'insert', table: 'nutrition_plan_prep_tasks', sites: 1, motif: 'import hérité : tâches de préparation du plan JSON' },
  { fichier: 'lib/nutritionPlanService.js', verbe: 'insert', table: 'nutrition_plan_shopping_items', sites: 2, motif: 'import hérité : liste de courses du plan JSON' },
  { fichier: 'lib/nutritionPlanService.js', verbe: 'update', table: 'nutrition_plan_shopping_items', sites: 1, motif: 'import hérité : recalage de la liste' },
  { fichier: 'lib/nutritionPlanService.js', verbe: 'delete', table: 'nutrition_plan_shopping_items', sites: 1, motif: 'import hérité : reconstruction de la liste' },
  { fichier: 'app/api/ai/plan/generate/route.js', verbe: 'delete', table: 'nutrition_plan_shopping_items', sites: 1, motif: 'génération héritée par LLM : purge avant réécriture' },
  { fichier: 'app/api/ai/plan/generate/route.js', verbe: 'insert', table: 'nutrition_plan_shopping_items', sites: 1, motif: 'génération héritée par LLM : liste de courses' },

  // ── 2. File des Routines : plus aucun appelant depuis ce livrable ──
  { fichier: 'app/api/routine/generate-plan/route.js', verbe: 'insert', table: 'plan_regen_requests', sites: 1, motif: 'file de régénération — route sans appelant depuis le 4.4' },
  { fichier: 'app/api/routine/replan-week/route.js', verbe: 'insert', table: 'plan_regen_requests', sites: 1, motif: 'file de régénération — route sans appelant depuis le 4.4' },

  // ── 3. Liste de courses (livrable 4.5) ──
  { fichier: 'app/api/courses/add-to-stock/route.js', verbe: 'update', table: 'nutrition_plan_shopping_items', sites: 2, motif: 'coche d’un article rangé au garde-manger' },
  { fichier: 'app/api/courses/fetch-images/route.js', verbe: 'update', table: 'nutrition_plan_shopping_items', sites: 3, motif: 'vignette d’un article — aucun effet sur le plan' },
  { fichier: 'app/api/courses/shopping-items/[id]/route.js', verbe: 'update', table: 'nutrition_plan_shopping_items', sites: 1, motif: 'coche manuelle d’un article' },
  { fichier: 'app/api/ingredients/review/route.js', verbe: 'update', table: 'nutrition_plan_shopping_items', sites: 1, motif: 'résolution d’un ingrédient ambigu' },
  { fichier: 'lib/ingredientResolver.js', verbe: 'update', table: 'nutrition_plan_shopping_items', sites: 2, motif: 'rattachement d’un article à un aliment du catalogue' },
  { fichier: 'lib/shoppingListBuilder.js', verbe: 'delete', table: 'nutrition_plan_shopping_items', sites: 1, motif: 'reconstruction de la liste (chemin hérité, livrable 4.5)' },
  { fichier: 'lib/shoppingListBuilder.js', verbe: 'insert', table: 'nutrition_plan_shopping_items', sites: 1, motif: 'reconstruction de la liste (chemin hérité, livrable 4.5)' },
  { fichier: 'lib/shoppingListBuilder.js', verbe: 'update', table: 'nutrition_plan_shopping_items', sites: 1, motif: 'reconstruction de la liste (chemin hérité, livrable 4.5)' },

  // ── 4. Deux écritures qui n'élisent aucun plat ──
  { fichier: 'lib/server/legacyMealCookRoute.js', verbe: 'update', table: 'inventory_reservations', sites: 2, motif: 'consommation d’une réservation au moment de cuisiner' },
  { fichier: 'app/api/planning/epinglage/route.js', verbe: 'update', table: 'meal_plan_slots', sites: 1, motif: 'EXCEPTION NOMMÉE — voir l’arbitrage ci-dessous' },
]

function releverLeDepot() {
  const par = new Map()
  for (const racine of ['app', 'components', 'lib']) {
    for (const fichier of fichiersSources(path.join(RACINE, racine))) {
      for (const { table, verbe } of ecrituresDePlanning(readFileSync(fichier, 'utf8'))) {
        const cle = `${relatif(fichier)}|${verbe}|${table}`
        par.set(cle, (par.get(cle) || 0) + 1)
      }
    }
  }
  return par
}

describe('§9.3 — le relevé des écritures de planning, nommé site par site', () => {
  const releve = releverLeDepot()

  it('aucune écriture qui ne soit pas au relevé', () => {
    const declares = new Set(RELEVE_DES_ECRITURES.map((e) => `${e.fichier}|${e.verbe}|${e.table}`))
    const inconnues = [...releve.keys()].filter((cle) => !declares.has(cle)).sort()
    expect(inconnues).toEqual([])
  })

  it('aucune ligne du relevé qui ne corresponde plus à rien', () => {
    // Le cliquet doit serrer dans les deux sens : une ligne périmée le
    // desserrerait en silence le jour où une écriture réapparaîtrait au même
    // endroit.
    const perimees = RELEVE_DES_ECRITURES
      .map((e) => `${e.fichier}|${e.verbe}|${e.table}`)
      .filter((cle) => !releve.has(cle))
      .sort()
    expect(perimees).toEqual([])
  })

  it('le nombre de sites par ligne est celui qui a été relevé', () => {
    for (const entree of RELEVE_DES_ECRITURES) {
      const cle = `${entree.fichier}|${entree.verbe}|${entree.table}`
      expect(releve.get(cle), cle).toBe(entree.sites)
    }
  })

  it('le total est de 28 sites — la cible du §9.3 est ZÉRO, et n’est pas tenue', () => {
    const total = [...releve.values()].reduce((somme, n) => somme + n, 0)
    expect(total).toBe(28)
    expect(RELEVE_DES_ECRITURES.reduce((somme, e) => somme + e.sites, 0)).toBe(28)
  })

  it('aucun COMPOSANT n’écrit dans une table de planning', () => {
    // Le sous-interdit qui, lui, EST tenu, et qui est la règle du CLAUDE.md :
    // une mutation passe par une route `app/api/`, jamais depuis un composant.
    const composants = [...releve.keys()].filter((cle) => {
      const fichier = cle.split('|')[0]
      return fichier.startsWith('components/') || (fichier.startsWith('app/') && !fichier.startsWith('app/api/'))
    })
    expect(composants).toEqual([])
  })

  it('chaque ligne du relevé porte un motif écrit', () => {
    for (const entree of RELEVE_DES_ECRITURES) {
      expect(entree.motif.length, `${entree.fichier} ${entree.verbe} ${entree.table}`).toBeGreaterThan(20)
    }
  })
})

describe('l’arbitrage de l’épingle — la tension laissée ouverte par la phase 3', () => {
  /**
   * LE CHOIX, ET SA RAISON. `/api/planning/epinglage` écrit `meal_plan_slots`,
   * donc une table de planning hors publication atomique. Deux issues
   * possibles : changer de chemin (une table parallèle, relue à la génération),
   * ou en faire une exception nommée. C'est la seconde qui est retenue.
   *
   * POURQUOI. Une table parallèle donnerait DEUX sources de vérité pour l'état
   * d'un créneau — la colonne `locked` que le solveur lit déjà
   * (`lib/domain/planning/slotProtection.js`), que `generate-v3` respecte et que
   * la transaction de publication reporte d'une version à la suivante, et une
   * seconde table qu'il faudrait réconcilier. Le §9.3 vise les écritures qui
   * DÉCIDENT d'un repas ; une épingle n'élit aucun plat, n'écrit ni recette, ni
   * portion, ni quantité : elle enregistre une déclaration du foyer SUR un
   * créneau déjà publié, et c'est la génération suivante — donc la publication
   * atomique — qui en tire les conséquences.
   *
   * CE QUI REND L'EXCEPTION TENABLE : elle est BORNÉE mécaniquement, pas
   * déclarée. Le patch envoyé à Supabase ne contient que `locked`, et
   * `tests/planning/epinglage.test.js` (« n'écrit QUE `locked` ») le relit
   * colonne par colonne. Le jour où cette route écrirait un plat, ce test
   * rougirait avant celui-ci.
   */
  const source = readFileSync(path.join(RACINE, 'app/api/planning/epinglage/route.js'), 'utf8')

  it('l’exception est la seule écriture de `meal_plan_slots` hors publication', () => {
    const releve = releverLeDepot()
    const surLesCreneaux = [...releve.keys()].filter((cle) => cle.endsWith('|meal_plan_slots'))
    expect(surLesCreneaux).toEqual(['app/api/planning/epinglage/route.js|update|meal_plan_slots'])
  })

  it('elle n’écrit qu’une colonne, et cette colonne est `locked`', () => {
    const code = sansCommentaires(source)
    const patch = code.match(/\.update\(\s*\{([^}]*)\}/)
    expect(patch, 'aucun .update({…}) trouvé').not.toBeNull()
    const colonnes = patch[1].split(',').map((brut) => brut.split(':')[0].trim()).filter(Boolean)
    expect(colonnes).toEqual(['locked'])
  })

  it('elle refuse un `locked` qui n’est pas un booléen — le piège de Number()', () => {
    // `Number(true)` vaut 1, `Number([])` vaut 0 : une garde numérique aurait
    // accepté `[]` comme « dépingler » et `true` comme « épingler », sans
    // jamais refuser un corps de requête mal formé.
    expect(sansCommentaires(source)).toContain("typeof body.locked !== 'boolean'")
  })

  it('le relevé la nomme comme exception, sans la cacher dans le lot', () => {
    const ligne = RELEVE_DES_ECRITURES.find((e) => e.fichier === 'app/api/planning/epinglage/route.js')
    expect(ligne).toBeDefined()
    expect(ligne.motif).toContain('EXCEPTION NOMMÉE')
  })
})
