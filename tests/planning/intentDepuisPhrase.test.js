import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * LE TRADUCTEUR DE PHRASE — livrable 4.1.
 *
 * CE QUE CE FICHIER ÉPROUVE, dans l'ordre du critère du plan :
 *   1. Le modèle rend les CINQ champs et rien d'autre : un sixième champ est
 *      refusé, un champ manquant est refusé.
 *   2. La validation par schéma REFUSE, elle ne corrige pas en silence — types
 *      faux (dont le piège de `Number()` : `true`, `''`, `[]`), valeurs hors
 *      bornes, prise inconnue, jour hors semaine.
 *   3. ZÉRO écriture Supabase depuis ce chemin, éprouvé DEUX FOIS : par le
 *      texte des deux fichiers, et en donnant à la route un client dont chaque
 *      verbe d'écriture lève. Le second est celui qui compte : le premier
 *      tomberait devant une écriture passée par un helper.
 *   4. Les cinq champs atterrissent sur des clés que le moteur lit RÉELLEMENT.
 *      Ce n'est pas une assertion de forme : le test rejoue `buildWeeklyBalance`
 *      et `buildPresenceIndex`, les fonctions du moteur elles-mêmes.
 *
 * QUATRE MUTATIONS JOUÉES AVANT D'ÉCRIRE CETTE PHRASE — un test qui ne peut pas
 * échouer ne vaut rien, et la relecture de la phase 3 en a trouvé trois.
 *   1. `validerPart` remplacée par `Number(valeur)` (la garde de type sautée) :
 *      3 tests rougissent, dont « starchCap : refuse true, '' et [] ».
 *   2. La clause `champ_inconnu` vidée (`const inconnus = []`) : 2 tests
 *      rougissent, dont « refuse un sixième champ, en le nommant ».
 *   3. Un `supabase.from('meal_presence').insert(...)` ajouté à la route avant
 *      sa réponse : 3 tests rougissent, dont « une traduction réussie n'ouvre
 *      AUCUNE table et n'écrit rien ». C'est le test que le critère du plan
 *      exige : il échoue bien quand une écriture apparaît.
 *   4. `contraintesDuMoteur` renommant ses clés vers un vocabulaire que le
 *      moteur ne lit pas (`feculentPartMax`, `dureeMax`) : 4 tests rougissent.
 *      C'est la garde contre le champ décoratif.
 *
 * MISE À JOUR DU LIVRABLE 4.2 : l'éclipse de `maxMinutes` que ce fichier
 * figeait est LEVÉE. `generate-v3` n'écrit plus les deux plafonds par prise en
 * dur ; il les abaisse au temps demandé (`plafondsParPrise`). Le test qui
 * portait la réserve garde le mécanisme — il est toujours vrai du moteur — et
 * vérifie désormais que la route ne le subit plus.
 */

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))

// `vi.mock` est hissé au-dessus des `const` du module : la fonction doit donc
// naître dans `vi.hoisted`, sans quoi le constructeur la lit avant son
// initialisation.
const { messagesCreate } = vi.hoisted(() => ({ messagesCreate: vi.fn() }))
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    constructor() { this.messages = { create: messagesCreate } }
  },
}))

import { POST as TRADUIRE } from '@/app/api/planning/intent-from-phrase/route'
import { authenticateRequest } from '@/lib/apiAuth'
import {
  CHAMPS_TRADUITS,
  CODES_REFUS,
  INTENTS_MOTEUR,
  MAX_MINUTES_BORNES,
  PHRASE_MAX,
  contraintesDuMoteur,
  messageUtilisateur,
  schemaDeSortie,
  systemPrompt,
  validerIntention,
  validerPhrase,
} from '@/lib/domain/planning/intentFromPhrase'
import { buildPresenceIndex } from '@/lib/domain/planning/mealPresence'
import { buildWeeklyBalance, plafondDuFeculent, weeklyBalanceFor } from '@/lib/domain/planning/weeklyBalance'
import { violatesHardConstraints } from '@/lib/domain/planning/closedLoopPlanner'

const RACINE = path.resolve(__dirname, '..', '..')
const lire = (relatif) => readFileSync(path.join(RACINE, relatif), 'utf8')

const DATES = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27']

const complet = (champs = {}) => ({
  presence: null, starchCap: null, meatQuota: null, maxMinutes: null, intent: null, ...champs,
})

const codes = (resultat) => resultat.refus.map((motif) => motif.code)
const champs = (resultat) => resultat.refus.map((motif) => motif.champ)

// ═══════════════════════════════════════════════════════════════════════════
// 1. CINQ CHAMPS, ET RIEN D'AUTRE
// ═══════════════════════════════════════════════════════════════════════════

describe('Le contrat de sortie : cinq champs, et rien d\'autre', () => {
  it('nomme exactement les cinq champs du critère', () => {
    expect([...CHAMPS_TRADUITS]).toEqual(['presence', 'starchCap', 'meatQuota', 'maxMinutes', 'intent'])
  })

  it('accepte les cinq champs à null — une phrase peut ne rien contraindre', () => {
    const resultat = validerIntention(complet(), { dates: DATES })
    expect(resultat.ok).toBe(true)
    expect(Object.keys(resultat.intention).sort()).toEqual([...CHAMPS_TRADUITS].sort())
  })

  it('refuse un sixième champ, en le nommant', () => {
    const resultat = validerIntention(complet({ recette: 'Poulet basquaise' }), { dates: DATES })
    expect(resultat.ok).toBe(false)
    expect(codes(resultat)).toContain(CODES_REFUS.INCONNU)
    expect(champs(resultat)).toContain('recette')
  })

  it('refuse un plat rendu à la place d\'une contrainte — le traducteur ne décide pas', () => {
    const resultat = validerIntention({ repas: [{ date: DATES[0], recipe_code: 'r-1' }] }, { dates: DATES })
    expect(resultat.ok).toBe(false)
    expect(codes(resultat)).toContain(CODES_REFUS.INCONNU)
  })

  it('refuse un champ manquant plutôt que de le combler', () => {
    const { intent, ...sansIntent } = complet()
    const resultat = validerIntention(sansIntent, { dates: DATES })
    expect(resultat.ok).toBe(false)
    expect(codes(resultat)).toEqual([CODES_REFUS.MANQUANT])
    expect(champs(resultat)).toEqual(['intent'])
    // La porte n'a RIEN rendu : pas d'intention à moitié remplie.
    expect(resultat.intention).toBeUndefined()
  })

  it('refuse une racine qui n\'est pas un objet', () => {
    for (const brut of [null, 'balanced', 42, [complet()]]) {
      const resultat = validerIntention(brut, { dates: DATES })
      expect(resultat.ok).toBe(false)
      expect(codes(resultat)).toEqual([CODES_REFUS.RACINE])
    }
  })

  it('le schéma envoyé au modèle interdit lui aussi le sixième champ', () => {
    const schema = schemaDeSortie()
    expect(schema.additionalProperties).toBe(false)
    expect(schema.required).toEqual([...CHAMPS_TRADUITS])
    expect(Object.keys(schema.properties).sort()).toEqual([...CHAMPS_TRADUITS].sort())
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 2. LA PORTE REFUSE, ELLE NE CORRIGE PAS
// ═══════════════════════════════════════════════════════════════════════════

describe('La validation refuse, et ne corrige jamais en silence', () => {
  it('starchCap : refuse true, \'\' et [] — le piège de Number()', () => {
    // Number(true) vaut 1 (« tous les créneaux »), Number('') et Number([])
    // valent 0. Aucune des trois n'est une part déclarée.
    for (const valeur of [true, false, '', [], {}, [0.2]]) {
      const resultat = validerIntention(complet({ starchCap: valeur }), { dates: DATES })
      expect(resultat.ok, `starchCap: ${JSON.stringify(valeur)}`).toBe(false)
      expect(codes(resultat)).toEqual([CODES_REFUS.TYPE])
    }
  })

  it('starchCap : refuse hors de ]0, 1] plutôt que de ramener à la borne', () => {
    for (const valeur of [0, 1.5, -0.2]) {
      const resultat = validerIntention(complet({ starchCap: valeur }), { dates: DATES })
      expect(resultat.ok, `starchCap: ${valeur}`).toBe(false)
      expect(codes(resultat)).toEqual([CODES_REFUS.BORNES])
    }
    expect(validerIntention(complet({ starchCap: 1 }), { dates: DATES }).ok).toBe(true)
    expect(validerIntention(complet({ starchCap: 0.15 }), { dates: DATES }).intention.starchCap).toBe(0.15)
  })

  it('meatQuota : refuse true et [] — la faute déjà trouvée sur le quota carné', () => {
    for (const valeur of [true, false, [], '', {}, 2.5]) {
      const resultat = validerIntention(complet({ meatQuota: valeur }), { dates: DATES })
      expect(resultat.ok, `meatQuota: ${JSON.stringify(valeur)}`).toBe(false)
      expect(codes(resultat)).toEqual([CODES_REFUS.TYPE])
    }
  })

  it('meatQuota : 0 est une déclaration valide, 15 est hors bornes', () => {
    expect(validerIntention(complet({ meatQuota: 0 }), { dates: DATES }).intention.meatQuota).toBe(0)
    expect(validerIntention(complet({ meatQuota: 14 }), { dates: DATES }).intention.meatQuota).toBe(14)
    const trop = validerIntention(complet({ meatQuota: 15 }), { dates: DATES })
    expect(trop.ok).toBe(false)
    expect(codes(trop)).toEqual([CODES_REFUS.BORNES])
  })

  it('maxMinutes : refuse les bornes absurdes, garde celles du moteur', () => {
    for (const valeur of [0, 4, 241, 1000]) {
      const resultat = validerIntention(complet({ maxMinutes: valeur }), { dates: DATES })
      expect(resultat.ok, `maxMinutes: ${valeur}`).toBe(false)
      expect(codes(resultat)).toEqual([CODES_REFUS.BORNES])
    }
    expect(validerIntention(complet({ maxMinutes: MAX_MINUTES_BORNES.min }), { dates: DATES }).ok).toBe(true)
    expect(validerIntention(complet({ maxMinutes: MAX_MINUTES_BORNES.max }), { dates: DATES }).ok).toBe(true)
    expect(validerIntention(complet({ maxMinutes: true }), { dates: DATES }).ok).toBe(false)
  })

  it('intent : refuse une intention que matchesIntent ne sait pas lire', () => {
    const resultat = validerIntention(complet({ intent: 'gourmand' }), { dates: DATES })
    expect(resultat.ok).toBe(false)
    expect(codes(resultat)).toEqual([CODES_REFUS.VALEUR])
    for (const intent of INTENTS_MOTEUR) {
      expect(validerIntention(complet({ intent }), { dates: DATES }).ok, intent).toBe(true)
    }
  })

  it('presence : refuse une prise inconnue, un jour hors semaine, un present non booléen', () => {
    const ligne = (surcharge) => complet({
      presence: [{ person: 'Zoé', date: DATES[1], mealType: 'diner', present: false, ...surcharge }],
    })
    expect(codes(validerIntention(ligne({ mealType: 'brunch' }), { dates: DATES }))).toEqual([CODES_REFUS.VALEUR])
    expect(codes(validerIntention(ligne({ date: '2026-10-05' }), { dates: DATES }))).toEqual([CODES_REFUS.BORNES])
    expect(codes(validerIntention(ligne({ date: '05/10/2026' }), { dates: DATES }))).toEqual([CODES_REFUS.TYPE])
    // `present: 0` et `present: 'false'` : Boolean('false') vaut true, ce qui
    // retournerait le sens de la phrase. Refus, pas coercition.
    for (const present of [0, 1, 'false', 'true', null]) {
      expect(codes(validerIntention(ligne({ present }), { dates: DATES })), `present: ${present}`)
        .toEqual([CODES_REFUS.TYPE])
    }
    expect(codes(validerIntention(ligne({ note: 'restaurant' }), { dates: DATES }))).toEqual([CODES_REFUS.INCONNU])
  })

  it('presence : accepte une déclaration bien formée et la rend telle quelle', () => {
    const resultat = validerIntention(complet({
      presence: [{ person: ' Zoé ', date: DATES[1], mealType: 'diner', present: false }],
    }), { dates: DATES })
    expect(resultat.ok).toBe(true)
    expect(resultat.intention.presence).toEqual([{ person: 'Zoé', date: DATES[1], mealType: 'diner', present: false }])
  })

  it('cumule les motifs plutôt que de s\'arrêter au premier', () => {
    const resultat = validerIntention(complet({ starchCap: true, meatQuota: 99, intent: 'gourmand' }), { dates: DATES })
    expect(resultat.ok).toBe(false)
    expect(champs(resultat).sort()).toEqual(['intent', 'meatQuota', 'starchCap'])
  })

  it('la phrase elle-même est validée avant tout appel', () => {
    expect(validerPhrase('Pas de viande cette semaine')).toBeNull()
    expect(validerPhrase('   ').code).toBe(CODES_REFUS.MANQUANT)
    expect(validerPhrase(42).code).toBe(CODES_REFUS.TYPE)
    expect(validerPhrase('a'.repeat(PHRASE_MAX + 1)).code).toBe(CODES_REFUS.TROP_LONG)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 3. LES CINQ CHAMPS TOMBENT SUR DES CONTRAINTES QUE LE MOTEUR LIT
// ═══════════════════════════════════════════════════════════════════════════

describe('Les cinq champs atterrissent sur des contraintes réellement lues', () => {
  it('starchCap et meatQuota passent par buildWeeklyBalance — le moteur, pas une copie', () => {
    const { contraintes } = { contraintes: contraintesDuMoteur({ starchCap: 0.15, meatQuota: 3 }) }
    expect(contraintes.weekly_balance).toEqual({ starchMaxShare: 0.15, meatMax: 3 })

    // La preuve : les mêmes clés, données au moteur, DÉPLACENT le plafond.
    const avant = weeklyBalanceFor({ balance: buildWeeklyBalance({}), totalSlots: 14 })
    const apres = weeklyBalanceFor({ balance: buildWeeklyBalance(contraintes.weekly_balance), totalSlots: 14 })
    expect(plafondDuFeculent('riz', avant)).toBe(3)
    expect(plafondDuFeculent('riz', apres)).toBe(2)
    expect(avant.meatMax).toBe(4)
    expect(apres.meatMax).toBe(3)
  })

  it('presence passe par buildPresenceIndex — l\'index du moteur reconnaît la déclaration', () => {
    const contraintes = contraintesDuMoteur({
      presence: [{ person: 'Zoé', date: DATES[1], mealType: 'diner', present: false }],
    })
    expect(contraintes.presence).toEqual([
      { person_name: 'Zoé', meal_date: DATES[1], meal_type: 'diner', present: false },
    ])
    const index = buildPresenceIndex(contraintes.presence)
    expect(index.size).toBe(1)
    expect(index.absent({ name: 'Zoé' }, DATES[1], 'diner')).toBe(true)
    expect(index.absent({ name: 'Zoé' }, DATES[1], 'dejeuner')).toBe(false)
    expect(index.absent({ name: 'Julien' }, DATES[1], 'diner')).toBe(false)
  })

  it('maxMinutes sort sous la clé que violatesHardConstraints refuse RÉELLEMENT', () => {
    const contraintes = contraintesDuMoteur({ maxMinutes: 30 })
    expect(contraintes).toEqual({ maxTotalMinutes: 30 })

    // Le moteur lui-même, pas une copie du moteur. Un plat de 45 minutes est
    // refusé avec le motif `time_limit` ; un plat de 25 passe.
    const plat = (minutes) => ({
      code: 'T-1', eligible: true, prepMinutes: minutes, cookMinutes: 0,
      exactIngredients: [], category: 'plat principal', family: 'test',
    })
    expect(violatesHardConstraints(plat(45), contraintes)).toBe('time_limit')
    expect(violatesHardConstraints(plat(25), contraintes)).toBeNull()
    // Sans la contrainte, le plat de 45 minutes passe : c'est bien elle qui
    // refuse, et non une autre porte du moteur.
    expect(violatesHardConstraints(plat(45), {})).toBeNull()
  })

  it("maxTotalMinutes serait ÉCLIPSÉ par une clé par prise — et la route ne l'écrit plus en dur", () => {
    // LE MÉCANISME EST TOUJOURS LÀ, et c'est pour cela qu'il garde un test :
    // `closedLoopPlanner.js:936` lit `maxMinutesByMeal?.[prise] ?? maxTotalMinutes`,
    // donc toute clé par prise ÉCLIPSE la contrainte traduite. Le livrable 4.1
    // avait figé ce fait parce que la route posait alors `{ dejeuner: 120,
    // diner: 240 }` en dur, et qu'ajouter `maxTotalMinutes` n'aurait rien
    // changé.
    const plat = { code: 'T-2', eligible: true, prepMinutes: 45, cookMinutes: 0, exactIngredients: [], category: 'plat principal', family: 'test' }
    const eclipse = {
      ...contraintesDuMoteur({ maxMinutes: 30 }),
      maxMinutesByMeal: { dejeuner: 120, diner: 240 },
      currentMealType: 'dejeuner',
    }
    expect(violatesHardConstraints(plat, eclipse)).toBeNull()
    // La même contrainte mord dès que la clé par prise ne couvre pas la prise.
    expect(violatesHardConstraints(plat, { ...eclipse, maxMinutesByMeal: {} })).toBe('time_limit')

    // LA ROUTE, ELLE, A CHANGÉ : les deux plafonds ne sont plus écrits en dur,
    // ils sont ABAISSÉS au temps demandé. Le détail du raccord et sa mesure sur
    // le moteur vivent dans `tests/planning/confirmationContraintes.test.js`.
    const route = lire('app/api/planning/generate-v3/route.js')
    expect(route).not.toContain('maxMinutesByMeal: { dejeuner: 120, diner: 240 }')
    expect(route).toContain('plafondsParPrise')
  })

  it("Number(true) vaudrait 1 minute côté moteur — la garde de type est ce qui l'en empêche", () => {
    // Le moteur fait `Number(...)` sur cette grandeur. `true` y vaudrait « aucun
    // plat de plus d'une minute », donc une semaine vide.
    const plat = { code: 'T-3', eligible: true, prepMinutes: 10, cookMinutes: 0, exactIngredients: [], category: 'plat principal', family: 'test' }
    expect(violatesHardConstraints(plat, { maxTotalMinutes: true })).toBe('time_limit')
    // La porte refuse la valeur avant qu'elle n'atteigne le moteur.
    expect(validerIntention(complet({ maxMinutes: true }), { dates: DATES }).ok).toBe(false)
  })

  it('intent sort sous la clé que matchesIntent lit, et ne prend que ses cinq valeurs', () => {
    expect(contraintesDuMoteur({ intent: 'quick' })).toEqual({ intent: 'quick' })
    const route = lire('app/api/planning/generate-v3/route.js')
    for (const intent of INTENTS_MOTEUR) expect(route).toContain(`'${intent}'`)
  })

  it('un champ à null ne produit AUCUNE clé — une contrainte absente n\'est pas une contrainte à zéro', () => {
    expect(contraintesDuMoteur({
      presence: null, starchCap: null, meatQuota: null, maxMinutes: null, intent: null,
    })).toEqual({})
    // meatQuota: 0 en produit une, lui : « zéro repas carné » est une consigne.
    expect(contraintesDuMoteur({ meatQuota: 0 })).toEqual({ weekly_balance: { meatMax: 0 } })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 4. ZÉRO ÉCRITURE SUPABASE DEPUIS CE CHEMIN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Un client Supabase PIÉGÉ : toute lecture passe, tout verbe d'écriture lève.
 * C'est ce qui rend ce test capable d'échouer — un mock inerte laisserait une
 * écriture ajoutée demain passer sans bruit.
 */
function supabasePiege(journal) {
  const piege = (verbe) => (...args) => {
    journal.push({ verbe, args })
    throw new Error(`ÉCRITURE SUPABASE INTERDITE SUR CE CHEMIN : ${verbe}()`)
  }
  const constructeur = {
    select: () => constructeur,
    eq: () => constructeur,
    in: () => constructeur,
    order: () => constructeur,
    limit: () => constructeur,
    single: async () => ({ data: null, error: null }),
    maybeSingle: async () => ({ data: null, error: null }),
    then: (resoudre) => resoudre({ data: [], error: null }),
    insert: piege('insert'),
    upsert: piege('upsert'),
    update: piege('update'),
    delete: piege('delete'),
  }
  return {
    from: (table) => { journal.push({ verbe: 'from', args: [table] }); return constructeur },
    rpc: piege('rpc'),
    auth: { getUser: async () => ({ data: { user: { id: 'u-1' } }, error: null }) },
  }
}

describe('Zéro écriture Supabase depuis le chemin de traduction', () => {
  let journal

  beforeEach(() => {
    journal = []
    process.env.ANTHROPIC_API_KEY = 'cle-de-test'
    messagesCreate.mockReset()
    authenticateRequest.mockReset()
    authenticateRequest.mockResolvedValue({ supabase: supabasePiege(journal), user: { id: 'u-1' }, error: null })
  })

  afterEach(() => { vi.clearAllMocks() })

  const requete = (corps) => ({ json: async () => corps, headers: { get: () => null } })

  const repond = (objet) => messagesCreate.mockResolvedValue({
    content: [{ type: 'text', text: JSON.stringify(objet) }],
  })

  it('une traduction réussie n\'ouvre AUCUNE table et n\'écrit rien', async () => {
    repond(complet({ intent: 'quick', maxMinutes: 30 }))
    const reponse = await TRADUIRE(requete({ phrase: 'Semaine chargée, rien au-delà de 30 minutes', window_start: DATES[0] }))
    expect(reponse.status).toBe(200)
    const corps = await reponse.json()
    expect(corps.intention).toEqual(complet({ intent: 'quick', maxMinutes: 30 }))
    expect(corps.contraintes).toEqual({ intent: 'quick', maxTotalMinutes: 30 })
    // Ni écriture, ni même une table ouverte : la route ne touche pas la base.
    expect(journal).toEqual([])
  })

  it('une traduction refusée n\'écrit rien non plus', async () => {
    repond(complet({ starchCap: true }))
    const reponse = await TRADUIRE(requete({ phrase: 'Moins de pâtes', window_start: DATES[0] }))
    expect(reponse.status).toBe(422)
    const corps = await reponse.json()
    expect(corps.code).toBe('traduction_refusee')
    expect(corps.refus[0].champ).toBe('starchCap')
    expect(journal).toEqual([])
  })

  it('une sortie illisible est refusée, pas devinée', async () => {
    messagesCreate.mockResolvedValue({ content: [{ type: 'text', text: 'Je te propose un poulet basquaise.' }] })
    const reponse = await TRADUIRE(requete({ phrase: 'Quoi ce soir ?', window_start: DATES[0] }))
    expect(reponse.status).toBe(422)
    expect((await reponse.json()).code).toBe('reponse_illisible')
    expect(journal).toEqual([])
  })

  it('la phrase est refusée avant même l\'appel au modèle', async () => {
    const reponse = await TRADUIRE(requete({ phrase: '   ', window_start: DATES[0] }))
    expect(reponse.status).toBe(400)
    expect(messagesCreate).not.toHaveBeenCalled()
    expect(journal).toEqual([])
  })

  it('un appelant non authentifié n\'atteint ni la base ni le modèle', async () => {
    authenticateRequest.mockResolvedValue({ supabase: null, user: null, error: 'Non authentifié' })
    const reponse = await TRADUIRE(requete({ phrase: 'Rapide cette semaine' }))
    expect(reponse.status).toBe(401)
    expect(messagesCreate).not.toHaveBeenCalled()
  })

  it('l\'appel au modèle porte max_tokens, le schéma et le point de cache', async () => {
    repond(complet({ intent: 'vegetarian' }))
    await TRADUIRE(requete({ phrase: 'Semaine sans viande', window_start: DATES[0] }))
    const params = messagesCreate.mock.calls[0][0]
    expect(Number.isInteger(params.max_tokens)).toBe(true)
    expect(params.max_tokens).toBeGreaterThan(0)
    expect(params.system[0].cache_control).toEqual({ type: 'ephemeral' })
    expect(params.output_config.format.schema.additionalProperties).toBe(false)
    expect(params.output_config.format.schema.required).toEqual([...CHAMPS_TRADUITS])
    // Le contexte envoyé se limite à la semaine et à la phrase : rien de quoi
    // décider d'un plat.
    expect(params.messages[0].content).toContain(DATES[0])
    expect(params.messages[0].content).toContain('Semaine sans viande')
  })

  it('la semaine se déduit de window_start, et un jour hors semaine est refusé', async () => {
    repond(complet({ presence: [{ person: 'Zoé', date: '2026-10-12', mealType: 'diner', present: false }] }))
    const reponse = await TRADUIRE(requete({ phrase: 'Zoé absente', window_start: DATES[0] }))
    expect(reponse.status).toBe(422)
    expect((await reponse.json()).refus[0].code).toBe(CODES_REFUS.BORNES)
  })

  it('aucun verbe d\'écriture n\'apparaît dans le texte des deux fichiers du chemin', () => {
    const verbes = ['.insert(', '.upsert(', '.update(', '.delete(', '.rpc(']
    for (const relatif of [
      'lib/domain/planning/intentFromPhrase.js',
      'app/api/planning/intent-from-phrase/route.js',
    ]) {
      const source = lire(relatif)
      for (const verbe of verbes) {
        expect(source.includes(verbe), `${relatif} contient ${verbe}`).toBe(false)
      }
      // Aucun IMPORT de client Supabase : la mention du mot dans un
      // commentaire ne compte pas, c'est la dépendance qui compte.
      const imports = source.match(/^import[\s\S]*?from '[^']+'/gm) || []
      for (const ligne of imports) {
        expect(/supabase/i.test(ligne), `${relatif} importe ${ligne}`).toBe(false)
      }
    }
    // Le module de domaine est PUR : il n'importe ni base, ni réseau, ni SDK.
    const domaine = lire('lib/domain/planning/intentFromPhrase.js')
    expect(domaine).not.toContain('@anthropic-ai/sdk')
    expect(domaine).not.toContain('fetch(')
  })

  it('le champ de saisie de l\'assistant vise cette route, et aucune autre', () => {
    const page = lire('app/planning/assistant/page.js')
    expect(page).toContain('/api/planning/intent-from-phrase')
    expect(page).toContain('<textarea')
    // Aucun appel de Routine sur ce chemin : c'est ce que le 4.4 achèvera, et
    // ce champ ne doit pas l'y ramener.
    expect(page).not.toContain('/api/routine/')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 5. LE PROMPT RESTE CACHABLE
// ═══════════════════════════════════════════════════════════════════════════

describe('Le system prompt est stable, donc cachable', () => {
  it('ne contient ni date, ni prénom, ni phrase — rien qui invalide le préfixe', () => {
    const prompt = systemPrompt()
    expect(prompt).toBe(systemPrompt())
    expect(prompt).not.toMatch(/\d{4}-\d{2}-\d{2}/)
    const volatile = messageUtilisateur({ phrase: 'Zoé absente mardi', dates: DATES, membres: ['Zoé'] })
    expect(volatile).toContain('Zoé')
    expect(prompt).not.toContain('Zoé')
  })

  it('nomme les cinq champs et les cinq intentions au modèle', () => {
    const prompt = systemPrompt()
    for (const champ of CHAMPS_TRADUITS) expect(prompt).toContain(champ)
    for (const intent of INTENTS_MOTEUR) expect(prompt).toContain(intent)
  })
})
