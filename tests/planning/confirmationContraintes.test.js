import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * L'ÉCRAN DE CONFIRMATION (4.2) ET LE BUDGET DE LATENCE (4.3).
 *
 * CE QUE CE FICHIER ÉPROUVE, dans l'ordre des deux critères du plan :
 *   1. Les cinq contraintes se lisent en français AVANT le plan, et le libellé
 *      dit la même chose que la valeur — une part de 0,15 s'affiche « 15 % »,
 *      jamais « 0 % » ni « 15 % » pour 15.
 *   2. Une contrainte mal déduite se corrige À LA MAIN, sans retaper la phrase,
 *      et la correction passe LA MÊME porte que la sortie du modèle. Le piège
 *      de `Number()` est éprouvé sur les trois champs numériques ET sur le
 *      formulaire, qui est l'endroit où il reviendrait le plus naturellement.
 *   3. La génération NE PART PAS tant qu'une absence déduite n'est appariée à
 *      personne. C'est la seule chose que l'écran BLOQUE, et c'est la seule qui
 *      écrirait sur la mauvaise personne.
 *   4. Les contraintes confirmées VOYAGENT. Le cinquième champ, `maxMinutes`,
 *      était ÉCLIPSÉ par une clé écrite en dur (réserve mesurée du livrable
 *      4.1) : le test rejoue `violatesHardConstraints` — la fonction du moteur,
 *      pas une copie — pour montrer que l'éclipse est levée, et qu'elle ne peut
 *      pas revenir en silence.
 *   5. Au-delà du budget, la route retombe sur `intent: 'balanced'` ET LE DIT.
 *      Le repli est mesuré sur la route elle-même, avec un budget court et un
 *      modèle lent simulé.
 *   6. Les cinq boutons d'intention restent le chemin rapide, sur les DEUX
 *      écrans, sans qu'aucun modèle soit appelé.
 *
 * SIX MUTATIONS JOUÉES AVANT D'ÉCRIRE CETTE PHRASE — un test qui ne peut pas
 * échouer ne vaut rien, et la relecture de la phase 3 en a trouvé trois. Les
 * comptes ci-dessous sont RELEVÉS, pas estimés : c'est le nombre de tests que
 * chaque mutation a réellement fait rougir.
 *   1. `plafondsParPrise` rendant toujours les défauts (la demande ignorée) :
 *      1 rouge — « L'ÉCLIPSE EST LEVÉE ».
 *   2. LE RACCORD NAÏF, celui que le livrable 4.1 annonçait comme inopérant :
 *      la route remet ses deux plafonds par prise en dur et se contente
 *      d'ajouter `maxTotalMinutes` : 2 rouges, ici et dans
 *      `intentDepuisPhrase.test.js`. C'est la mutation qui compte, parce que
 *      c'est la faute qu'on serait tenté de commettre.
 *   3. `valeurDepuisSaisie` coerçant par `Number(saisie)` : 1 rouge — « le
 *      formulaire refuse true, '', [] et {} ».
 *   4. `etatDeGeneration` rendant toujours `pret: true` : 1 rouge — « BLOQUE la
 *      génération tant qu'une absence n'est appariée à personne ».
 *   5. La coupure au budget retirée de la route (l'appel attendu sans course) :
 *      2 rouges, et le premier a mis 3 019 ms à tomber au lieu de couper à 120.
 *   6. `corpsDeGeneration` rendant `{}` : 4 rouges, dont « les trois
 *      contraintes réglables voyagent sous les clés que la route LIT ».
 *   7. `retirerLigne` reconstruisant les lignes au lieu de les filtrer (la
 *      dérive réellement trouvée en écrivant l'écran, et corrigée avant
 *      livraison) : 1 rouge — « retirer une absence n'efface pas la personne
 *      corrigée sur une AUTRE ».
 */

vi.mock('@/lib/apiAuth', () => ({ authenticateRequest: vi.fn() }))

const { messagesCreate } = vi.hoisted(() => ({ messagesCreate: vi.fn() }))
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    constructor() { this.messages = { create: messagesCreate } }
  },
}))

import { POST as TRADUIRE } from '@/app/api/planning/intent-from-phrase/route'
import { authenticateRequest } from '@/lib/apiAuth'
import {
  CIBLE_FOYER,
  INTENT_LIBELLE,
  STARCH_POURCENT_BORNES,
  apparierMembre,
  corpsDeGeneration,
  corrigerChamp,
  dateEnFrancais,
  declarationsAEcrire,
  enFrancais,
  estSansContrainte,
  etatApresTraduction,
  etatDeGeneration,
  intentionNeutre,
  lignesDePresence,
  partEnPourcent,
  retirerLigne,
  valeurDepuisSaisie,
  viserPresence,
} from '@/lib/domain/planning/confirmationContraintes'
import {
  BUDGET_TRADUCTION_MS,
  MARGE_CLIENT_MS,
  RAISONS_REPLI,
  budgetClient,
  budgetTraduction,
  intentionDeRepli,
  messageDeRepli,
  repliDeclare,
} from '@/lib/domain/planning/budgetTraduction'
import {
  INTENTS_MOTEUR,
  MAX_MINUTES_BORNES,
  PLAFONDS_PAR_PRISE_DEFAUT,
  maxMinutesDemande,
  plafondsParPrise,
  validerIntention,
} from '@/lib/domain/planning/intentFromPhrase'
import { MAX_MEAT_MEALS_PER_WEEK } from '@/lib/domain/planning/memberPlanningRules'
import { violatesHardConstraints } from '@/lib/domain/planning/closedLoopPlanner'
import { buildWeeklyBalance } from '@/lib/domain/planning/weeklyBalance'

const RACINE = path.resolve(__dirname, '..', '..')
const lire = (relatif) => readFileSync(path.join(RACINE, relatif), 'utf8')

const DATES = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27']
const MEMBRES = [{ id: 'm-julien', name: 'Julien' }, { id: 'm-zoe', name: 'Zoé' }]

const complet = (champs = {}) => ({
  presence: null, starchCap: null, meatQuota: null, maxMinutes: null, intent: null, ...champs,
})

const platDe = (minutes, code = 'T-1') => ({
  code, eligible: true, prepMinutes: minutes, cookMinutes: 0,
  exactIngredients: [], category: 'plat principal', family: 'test',
})

// ═══════════════════════════════════════════════════════════════════════════
// 1. LES CINQ CONTRAINTES, LISIBLES EN FRANÇAIS, AVANT LE PLAN
// ═══════════════════════════════════════════════════════════════════════════

describe('Les contraintes déduites s\'affichent en français, avant le plan', () => {
  it('rend la part de féculent en POUR CENT, et pas la part brute', () => {
    // C'est l'erreur d'unité qui coûterait le plus cher à lire : `starchCap`
    // vaut 0,15 dans le domaine et « 15 % » à l'écran. Les confondre donne
    // « 0 % des créneaux » (part lue comme pourcentage) ou « 1 500 % » (le
    // contraire), et les deux sont des chiffres affichés non calculés — ce que
    // le §9.3 du plan interdit.
    expect(partEnPourcent(0.15)).toBe(15)
    expect(enFrancais('starchCap', 0.15)).toBe('15 % des créneaux au plus')
    expect(enFrancais('starchCap', 0.25)).toBe('25 % des créneaux au plus')
    expect(enFrancais('starchCap', 1)).toBe('100 % des créneaux au plus')
  })

  it('rend les quatre autres contraintes, chacune dans son unité', () => {
    expect(enFrancais('intent', 'quick')).toBe('Rapide')
    expect(enFrancais('maxMinutes', 30)).toBe('30 minutes par plat au plus')
    expect(enFrancais('meatQuota', 3)).toBe('3 repas carnés dans la semaine au plus')
    expect(enFrancais('meatQuota', 1)).toBe('1 repas carné dans la semaine au plus')
  })

  it('n\'affiche RIEN pour une contrainte que la phrase ne porte pas', () => {
    for (const champ of ['intent', 'maxMinutes', 'starchCap', 'meatQuota', 'presence']) {
      expect(enFrancais(champ, null)).toBeNull()
    }
    expect(enFrancais('presence', [])).toBeNull()
    expect(estSansContrainte(intentionNeutre())).toBe(true)
    expect(estSansContrainte(complet({ meatQuota: 0 }))).toBe(false)
  })

  it('date une absence en français, en UTC et sans Intl', () => {
    // `new Date('2026-09-22')` est minuit UTC : lu en heure locale à l'ouest de
    // Greenwich, c'est le 21. Le piège n°4 du CLAUDE.md, sur un libellé.
    expect(dateEnFrancais('2026-09-22')).toBe('mardi 22 septembre')
    expect(dateEnFrancais('2026-01-01')).toBe('jeudi 1 janvier')
    expect(dateEnFrancais('pas-une-date')).toBe('pas-une-date')
  })

  it('nomme la personne d\'une absence, et dit le sens de la déclaration', () => {
    const intention = complet({
      presence: [{ person: 'Zoé', date: '2026-09-22', mealType: 'diner', present: false }],
    })
    const texte = enFrancais('presence', lignesDePresence(intention, MEMBRES), { membres: MEMBRES })
    expect(texte).toContain('Zoé')
    expect(texte).toContain('ne mange pas à la maison')
    expect(texte).toContain('mardi 22 septembre')
    expect(texte).toContain('dîner')
  })

  it('marque « déduit de ta phrase » les seuls champs que le modèle a rendus', () => {
    const etat = etatApresTraduction(
      { intention: complet({ intent: 'quick', maxMinutes: 30 }), repli: null },
      { membres: MEMBRES },
    )
    expect(etat.deduits.sort()).toEqual(['intent', 'maxMinutes'])
    expect(etat.attenteConfirmation).toBe(true)
  })

  it('une phrase sans contrainte demande QUAND MÊME confirmation', () => {
    // Le foyer doit voir ce qui a été compris — fût-ce « rien » — avant que la
    // semaine parte. Sinon un champ mal lu partirait sans être montré.
    const etat = etatApresTraduction({ intention: complet(), repli: null }, { membres: MEMBRES })
    expect(etat.deduits).toEqual([])
    expect(etat.attenteConfirmation).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 2. LA CORRECTION À LA MAIN — SANS RETAPER LA PHRASE
// ═══════════════════════════════════════════════════════════════════════════

describe('Une contrainte mal déduite se corrige à la main', () => {
  const deduite = complet({ intent: 'quick', maxMinutes: 15, starchCap: 0.1, meatQuota: 6 })

  it('corrige UNE contrainte et ne touche pas aux quatre autres', () => {
    const resultat = corrigerChamp(deduite, 'maxMinutes', '45', { dates: DATES })
    expect(resultat.ok).toBe(true)
    expect(resultat.intention.maxMinutes).toBe(45)
    expect(resultat.intention.intent).toBe('quick')
    expect(resultat.intention.starchCap).toBe(0.1)
    expect(resultat.intention.meatQuota).toBe(6)
  })

  it('un champ vidé RETIRE la contrainte, sans en inventer une autre', () => {
    const resultat = corrigerChamp(deduite, 'meatQuota', '', { dates: DATES })
    expect(resultat.ok).toBe(true)
    expect(resultat.intention.meatQuota).toBeNull()
    // Et une contrainte retirée ne produit plus aucune clé pour le moteur.
    expect(corpsDeGeneration(resultat.intention).weekly_balance).toEqual({ starchMaxShare: 0.1 })
  })

  it('la saisie du féculent est un POUR CENT, convertie en part', () => {
    const resultat = corrigerChamp(deduite, 'starchCap', '15', { dates: DATES })
    expect(resultat.ok).toBe(true)
    expect(resultat.intention.starchCap).toBe(0.15)
    // Et le tour est complet : ce que l'écran réaffiche est bien « 15 % ».
    expect(enFrancais('starchCap', resultat.intention.starchCap)).toBe('15 % des créneaux au plus')
  })

  it('le formulaire refuse true, \'\', [] et {} — le piège de Number() côté saisie', () => {
    // C'est ICI que le piège reviendrait le plus naturellement : un champ de
    // formulaire rend toujours une chaîne, et `Number('')` vaut 0. Un
    // `maxMinutes` à 0 est une semaine vide ; un `starchCap` à 0 aussi.
    for (const champ of ['maxMinutes', 'starchCap', 'meatQuota']) {
      for (const saisie of [true, false, [], {}, [30], 'trente']) {
        const resultat = valeurDepuisSaisie(champ, saisie)
        expect(resultat.valeur, `${champ} ← ${JSON.stringify(saisie)}`).toBeNull()
        expect(resultat.refus, `${champ} ← ${JSON.stringify(saisie)}`).not.toBeNull()
      }
      // Seule la chaîne VIDE est acceptée, et elle vaut « retire la contrainte ».
      expect(valeurDepuisSaisie(champ, '')).toEqual({ valeur: null, refus: null })
      expect(valeurDepuisSaisie(champ, '   ')).toEqual({ valeur: null, refus: null })
    }
  })

  it('refuse une saisie hors bornes en la nommant, et ne la rogne pas', () => {
    expect(corrigerChamp(deduite, 'maxMinutes', '2', { dates: DATES }).ok).toBe(false)
    expect(corrigerChamp(deduite, 'maxMinutes', '500', { dates: DATES }).ok).toBe(false)
    expect(corrigerChamp(deduite, 'maxMinutes', '30.5', { dates: DATES }).ok).toBe(false)
    expect(corrigerChamp(deduite, 'starchCap', '0', { dates: DATES }).ok).toBe(false)
    expect(corrigerChamp(deduite, 'starchCap', '140', { dates: DATES }).ok).toBe(false)
    expect(corrigerChamp(deduite, 'meatQuota', '-1', { dates: DATES }).ok).toBe(false)
    expect(corrigerChamp(deduite, 'meatQuota', String(MAX_MEAT_MEALS_PER_WEEK + 1), { dates: DATES }).ok).toBe(false)
    // La borne haute, elle, passe : on refuse au-delà, pas à la borne.
    expect(corrigerChamp(deduite, 'maxMinutes', String(MAX_MINUTES_BORNES.max), { dates: DATES }).ok).toBe(true)
    expect(corrigerChamp(deduite, 'starchCap', String(STARCH_POURCENT_BORNES.max), { dates: DATES }).ok).toBe(true)
    expect(corrigerChamp(deduite, 'meatQuota', String(MAX_MEAT_MEALS_PER_WEEK), { dates: DATES }).ok).toBe(true)
  })

  it('l\'intention corrigée ne prend que les cinq valeurs du moteur', () => {
    expect(corrigerChamp(deduite, 'intent', 'balanced', { dates: DATES }).intention.intent).toBe('balanced')
    expect(corrigerChamp(deduite, 'intent', '', { dates: DATES }).intention.intent).toBeNull()
    expect(corrigerChamp(deduite, 'intent', 'gourmand', { dates: DATES }).ok).toBe(false)
    expect(Object.keys(INTENT_LIBELLE).sort()).toEqual([...INTENTS_MOTEUR].sort())
  })

  it('la correction repasse par la MÊME porte que la sortie du modèle', () => {
    // La porte du livrable 4.1 est `validerIntention`. Si le formulaire avait la
    // sienne, ce serait le trou par lequel une valeur non validée atteindrait
    // enfin le moteur. On le vérifie en confrontant les deux : ce que le
    // formulaire accepte, la porte l'accepte — et réciproquement.
    const parLeFormulaire = corrigerChamp(intentionNeutre(), 'maxMinutes', '30', { dates: DATES })
    const parLeModele = validerIntention(complet({ maxMinutes: 30 }), { dates: DATES })
    expect(parLeFormulaire.ok).toBe(true)
    expect(parLeFormulaire.intention).toEqual(parLeModele.intention)
    // Et le module de confirmation importe bien cette porte, plutôt que d'en
    // écrire une seconde.
    expect(lire('lib/domain/planning/confirmationContraintes.js')).toContain('validerIntention')
  })

  it('une absence mal déduite se RETIRE sans toucher aux autres', () => {
    const intention = complet({
      presence: [
        { person: 'Zoé', date: '2026-09-22', mealType: 'diner', present: false },
        { person: 'Camille', date: '2026-09-24', mealType: 'dejeuner', present: false },
      ],
    })
    const lignes = lignesDePresence(intention, MEMBRES)
    const apres = retirerLigne(lignes, 0)
    expect(apres).toHaveLength(1)
    expect(apres[0].nomLu).toBe('Camille')
    expect(retirerLigne(apres, 1)).toEqual([])
  })

  it('retirer une absence n\'efface pas la personne corrigée sur une AUTRE', () => {
    // La dérive que ce test garde : reconstruire les lignes depuis l'intention
    // après chaque retrait effacerait les appariements déjà corrigés à la main.
    // Le foyer aurait dit « c'est Zoé » sur une ligne, retiré une autre ligne,
    // et vu la première redevenir « qui ? ».
    const intention = complet({
      presence: [
        { person: 'Camille', date: '2026-09-22', mealType: 'diner', present: false },
        { person: 'Inconnu', date: '2026-09-24', mealType: 'dejeuner', present: false },
      ],
    })
    const corrigees = viserPresence(lignesDePresence(intention, MEMBRES), 0, 'm-zoe')
    const apres = retirerLigne(corrigees, 1)
    expect(apres).toHaveLength(1)
    expect(apres[0].cible).toBe('m-zoe')
    expect(etatDeGeneration({ attenteConfirmation: true, lignes: apres, membres: MEMBRES }).pret).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 3. LA GÉNÉRATION NE PART QU'APRÈS CONFIRMATION
// ═══════════════════════════════════════════════════════════════════════════

describe('La génération ne part qu\'après confirmation', () => {
  const absence = (person) => complet({
    presence: [{ person, date: '2026-09-22', mealType: 'diner', present: false }],
  })

  it('apparie un prénom au membre du foyer, accents et casse compris', () => {
    expect(apparierMembre('Zoé', MEMBRES)).toBe('m-zoe')
    expect(apparierMembre('zoe', MEMBRES)).toBe('m-zoe')
    expect(apparierMembre('ZOÉ', MEMBRES)).toBe('m-zoe')
    expect(apparierMembre('', MEMBRES)).toBe(CIBLE_FOYER)
  })

  it('n\'apparie PERSONNE quand le prénom est ambigu ou inconnu', () => {
    // Deux réponses valent zéro réponse : écrire l'absence sur le mauvais
    // membre retirerait l'assiette de quelqu'un qui dîne à la maison, et cette
    // erreur-là ne se voit qu'au moment de passer à table.
    expect(apparierMembre('Camille', MEMBRES)).toBeNull()
    expect(apparierMembre('J', [{ id: 'a', name: 'Julien' }, { id: 'b', name: 'Juliette' }])).toBeNull()
  })

  it('BLOQUE la génération tant qu\'une absence n\'est appariée à personne', () => {
    const lignes = lignesDePresence(absence('Camille'), MEMBRES)
    expect(lignes[0].cible).toBeNull()
    const porte = etatDeGeneration({ attenteConfirmation: true, lignes, membres: MEMBRES })
    expect(porte.pret).toBe(false)
    expect(porte.motif).toBe('presence_non_resolue')
    expect(porte.message).toContain('Camille')
  })

  it('DÉBLOQUE dès que le foyer dit de qui il s\'agit — sans retaper la phrase', () => {
    const lignes = lignesDePresence(absence('Camille'), MEMBRES)
    const vises = viserPresence(lignes, 0, 'm-zoe')
    const porte = etatDeGeneration({ attenteConfirmation: true, lignes: vises, membres: MEMBRES })
    expect(porte.pret).toBe(true)
    expect(porte.libelle).toBe('Confirmer et générer')
    expect(declarationsAEcrire(vises, MEMBRES).declarations).toEqual([
      { household_member_id: 'm-zoe', meal_date: '2026-09-22', meal_type: 'diner', present: false },
    ])
  })

  it('DÉBLOQUE aussi quand l\'absence est retirée plutôt qu\'appariée', () => {
    const lignes = retirerLigne(lignesDePresence(absence('Camille'), MEMBRES), 0)
    expect(lignes).toEqual([])
    const porte = etatDeGeneration({ attenteConfirmation: true, lignes, membres: MEMBRES })
    expect(porte.pret).toBe(true)
  })

  it('sans traduction en attente, le bouton est le chemin direct', () => {
    const porte = etatDeGeneration({ attenteConfirmation: false, lignes: [], membres: MEMBRES })
    expect(porte.pret).toBe(true)
    expect(porte.libelle).toBe('Générer avec Myko')
  })

  it('« tout le foyer » se déplie en une déclaration par membre', () => {
    const lignes = lignesDePresence(absence(''), MEMBRES)
    expect(lignes[0].cible).toBe(CIBLE_FOYER)
    const { declarations, incompletes } = declarationsAEcrire(lignes, MEMBRES)
    expect(incompletes).toEqual([])
    expect(declarations.map((ligne) => ligne.household_member_id).sort()).toEqual(['m-julien', 'm-zoe'])
    // La table `meal_presence` est indexée par membre : « tout le foyer » n'y a
    // pas de ligne unique, et une déclaration perdue serait une assiette servie
    // à quelqu'un qui n'est pas là.
  })

  it('une ligne non résolue ne produit AUCUNE écriture, et se signale', () => {
    const lignes = lignesDePresence(absence('Camille'), MEMBRES)
    const { declarations, incompletes } = declarationsAEcrire(lignes, MEMBRES)
    expect(declarations).toEqual([])
    expect(incompletes).toHaveLength(1)
    expect(incompletes[0].nomLu).toBe('Camille')
  })

  it('l\'écran écrit les absences par la ROUTE de présence, jamais depuis le client', () => {
    const page = lire('app/planning/assistant/page.js')
    expect(page).toContain("'/api/planning/presence'")
    // Aucun client Supabase importé dans l'écran : la règle du CLAUDE.md
    // (« mutations par une route app/api/ ») se vérifie sur les imports.
    const imports = page.match(/^import[\s\S]*?from '[^']+'/gm) || []
    for (const ligne of imports) expect(/supabase/i.test(ligne), ligne).toBe(false)
    // Et aucune Routine LLM sur ce chemin : c'est le livrable 4.4 qui achèvera
    // de les retirer, et cet écran ne doit pas les y ramener.
    expect(page).not.toContain('/api/routine/')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 4. LES CONTRAINTES CONFIRMÉES VOYAGENT — ET L'ÉCLIPSE EST LEVÉE
// ═══════════════════════════════════════════════════════════════════════════

describe('Les contraintes confirmées atteignent le moteur', () => {
  const routeGeneration = lire('app/api/planning/generate-v3/route.js')

  it('les trois contraintes réglables voyagent sous les clés que la route LIT', () => {
    const corps = corpsDeGeneration(
      complet({ intent: 'quick', starchCap: 0.15, meatQuota: 3, maxMinutes: 30 }),
      { windowStart: DATES[0] },
    )
    expect(corps).toEqual({
      window_start: DATES[0],
      intent: 'quick',
      weekly_balance: { starchMaxShare: 0.15, meatMax: 3 },
      max_total_minutes: 30,
    })
    // Chaque clé est lue par la route — vérifié sur SON texte, pas sur cette liste.
    expect(routeGeneration).toContain('body.intent')
    expect(routeGeneration).toContain('body?.weekly_balance')
    expect(routeGeneration).toContain('body?.max_total_minutes')
  })

  it('une contrainte absente ne produit AUCUNE clé', () => {
    expect(corpsDeGeneration(intentionNeutre())).toEqual({})
    // meatQuota: 0 en produit une, lui : « zéro repas carné » est une consigne.
    expect(corpsDeGeneration(complet({ meatQuota: 0 }))).toEqual({ weekly_balance: { meatMax: 0 } })
  })

  it('la présence NE voyage PAS dans le corps de génération', () => {
    // `generate-v3` relit les déclarations en base (`loadPresenceDeclarations`).
    // Les envoyer aussi dans le corps créerait une seconde source de vérité
    // pour la même semaine.
    const corps = corpsDeGeneration(complet({
      presence: [{ person: 'Zoé', date: '2026-09-22', mealType: 'diner', present: false }],
    }))
    expect(corps.presence).toBeUndefined()
    expect(routeGeneration).toContain('loadPresenceDeclarations')
  })

  it('le plafond de féculent confirmé change bien le plafond du moteur', () => {
    const corps = corpsDeGeneration(complet({ starchCap: 0.15 }))
    // `buildWeeklyBalance` est la fonction du moteur, pas une copie.
    expect(buildWeeklyBalance(corps.weekly_balance).starchMaxShare).toBe(0.15)
    expect(buildWeeklyBalance({}).starchMaxShare).toBe(0.25)
  })

  it('L\'ÉCLIPSE EST LEVÉE : le temps demandé abaisse les plafonds par prise', () => {
    // La réserve mesurée du livrable 4.1 : `closedLoopPlanner.js:936` lit
    // `maxMinutesByMeal?.[prise] ?? maxTotalMinutes`. Tant que la première clé
    // couvrait la prise, la seconde était IGNORÉE — un « rien au-delà de
    // 30 minutes » n'avait AUCUN effet sur les déjeuners ni les dîners.
    expect(plafondsParPrise(null)).toEqual({ dejeuner: 120, diner: 240 })
    expect(plafondsParPrise(30)).toEqual({ dejeuner: 30, diner: 30 })
    // Une demande ne DESSERRE jamais une borne que le foyer n'a pas discutée.
    expect(plafondsParPrise(200)).toEqual({ dejeuner: 120, diner: 200 })

    // Et l'effet se rejoue sur la fonction du moteur, dans les deux sens.
    const plat = platDe(45)
    const commeAvant = { maxMinutesByMeal: PLAFONDS_PAR_PRISE_DEFAUT, currentMealType: 'dejeuner' }
    expect(violatesHardConstraints(plat, commeAvant)).toBeNull()
    const commeMaintenant = { maxMinutesByMeal: plafondsParPrise(30), maxTotalMinutes: 30, currentMealType: 'dejeuner' }
    expect(violatesHardConstraints(plat, commeMaintenant)).toBe('time_limit')
    expect(violatesHardConstraints(plat, { ...commeMaintenant, currentMealType: 'diner' })).toBe('time_limit')
    // Un plat qui tient dans le budget passe : la borne mord, elle ne bloque pas tout.
    expect(violatesHardConstraints(platDe(25), commeMaintenant)).toBeNull()
  })

  it('la route de génération n\'écrit plus les deux plafonds en dur', () => {
    // Le test du livrable 4.1 figeait ce littéral pour que le livrable qui
    // brancherait le champ sache qu'ajouter une clé ne suffisait pas. Il est
    // retiré : c'est la fonction qui les compose maintenant.
    expect(routeGeneration).not.toContain('maxMinutesByMeal: { dejeuner: 120, diner: 240 }')
    expect(routeGeneration).toContain('maxMinutesByMeal: plafondsParPrise(maxTotalMinutes)')
  })

  it('le temps demandé passe la MÊME garde de type que la sortie du modèle', () => {
    // `Number(true)` vaut 1 : une minute par plat, c'est-à-dire une semaine
    // vide. `Number('')` et `Number([])` valent 0, même conséquence.
    expect(maxMinutesDemande(null)).toEqual({ valeur: null, refus: null })
    expect(maxMinutesDemande(30).valeur).toBe(30)
    for (const valeur of [true, false, '', [], {}, [30], 'trente', 2, 500, 30.5]) {
      const resultat = maxMinutesDemande(valeur)
      expect(resultat.valeur, JSON.stringify(valeur)).toBeNull()
      expect(resultat.refus, JSON.stringify(valeur)).not.toBeNull()
    }
    // Seconde serrure : même si une valeur folle arrivait jusqu'ici, les
    // plafonds restent ceux d'avant plutôt que de tomber à `{ dejeuner: 1 }`.
    expect(plafondsParPrise(true)).toEqual({ dejeuner: 120, diner: 240 })
    expect(plafondsParPrise('')).toEqual({ dejeuner: 120, diner: 240 })
    expect(plafondsParPrise([])).toEqual({ dejeuner: 120, diner: 240 })
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 5. LE BUDGET DE LATENCE ET LE REPLI DÉCLARÉ (4.3)
// ═══════════════════════════════════════════════════════════════════════════

describe('Le budget de latence est celui du plan, et il ne se desserre pas', () => {
  it('vaut 5 s, le chiffre du critère', () => {
    expect(BUDGET_TRADUCTION_MS).toBe(5000)
    expect(budgetTraduction()).toBe(5000)
    expect(budgetTraduction({})).toBe(5000)
  })

  it('une surcharge peut RACCOURCIR le budget, jamais l\'allonger', () => {
    expect(budgetTraduction({ MYKO_BUDGET_TRADUCTION_MS: '250' })).toBe(250)
    expect(budgetTraduction({ MYKO_BUDGET_TRADUCTION_MS: '60000' })).toBe(5000)
  })

  it('refuse true, \'\' et [] plutôt que de les lire comme 1 ou 0 ms', () => {
    // `Number('')` vaut 0 : un budget de zéro milliseconde ferait retomber
    // TOUTE traduction sur `balanced`, et le traducteur ne servirait plus
    // jamais, sans une ligne pour le dire.
    for (const brut of [true, false, '', '   ', [], {}, 'vite', -1, 0, NaN]) {
      expect(budgetTraduction({ MYKO_BUDGET_TRADUCTION_MS: brut }), JSON.stringify(brut)).toBe(5000)
    }
  })

  it('le budget du navigateur dépasse celui du serveur, et pas l\'inverse', () => {
    // Si le client coupait le premier, le repli déclaré par la route ne serait
    // jamais lu : on aurait un repli silencieux, ce que le critère interdit.
    expect(budgetClient(BUDGET_TRADUCTION_MS)).toBe(BUDGET_TRADUCTION_MS + MARGE_CLIENT_MS)
    expect(budgetClient(BUDGET_TRADUCTION_MS)).toBeGreaterThan(BUDGET_TRADUCTION_MS)
  })

  it('l\'intention de repli est « balanced », et rien d\'autre', () => {
    expect(intentionDeRepli()).toEqual(complet({ intent: 'balanced' }))
    // Elle passe la porte du livrable 4.1 comme n'importe quelle sortie de
    // modèle : le repli n'est pas une porte dérobée.
    expect(validerIntention(intentionDeRepli(), { dates: DATES }).ok).toBe(true)
    // Et deux appels ne partagent pas le même objet.
    const premier = intentionDeRepli()
    premier.intent = 'quick'
    expect(intentionDeRepli().intent).toBe('balanced')
  })

  it('le repli DIT ce qu\'il a fait : le motif, le budget, et la durée attendue', () => {
    const repli = repliDeclare({ ms: 5243, budgetMs: 5000 })
    expect(repli.applique).toBe(true)
    expect(repli.raison).toBe(RAISONS_REPLI.DELAI)
    expect(repli.ms).toBe(5243)
    expect(repli.budget_ms).toBe(5000)
    expect(repli.intent).toBe('balanced')
    expect(repli.message).toContain('5 s')
    expect(repli.message).toContain('5243 ms')
    expect(repli.message).toContain('Équilibré')
    // Et il dit que la phrase n'a PAS été lue : c'est la partie du message
    // qu'on ne peut pas omettre sans tromper.
    expect(messageDeRepli({ ms: 5243 })).toContain('n\'a pas été lue')
  })

  it('un repli n\'est JAMAIS marqué « déduit de ta phrase »', () => {
    const etat = etatApresTraduction(
      { intention: intentionDeRepli(), repli: repliDeclare({ ms: 5100 }) },
      { membres: MEMBRES },
    )
    expect(etat.repli.applique).toBe(true)
    expect(etat.deduits).toEqual([])
    expect(etat.intention.intent).toBe('balanced')
  })
})

describe('La route coupe au budget, et le dit', () => {
  const requete = (corps) => ({ json: async () => corps, headers: { get: () => null } })
  let budgetInitial

  beforeEach(() => {
    budgetInitial = process.env.MYKO_BUDGET_TRADUCTION_MS
    process.env.ANTHROPIC_API_KEY = 'cle-de-test'
    // Budget COURT : on mesure la coupure, pas la patience du runner. Le
    // chiffre du plan (5 s) est éprouvé plus haut, sur le module.
    process.env.MYKO_BUDGET_TRADUCTION_MS = '120'
    messagesCreate.mockReset()
    authenticateRequest.mockReset()
    authenticateRequest.mockResolvedValue({ supabase: null, user: { id: 'u-1' }, error: null })
  })

  afterEach(() => {
    if (budgetInitial === undefined) delete process.env.MYKO_BUDGET_TRADUCTION_MS
    else process.env.MYKO_BUDGET_TRADUCTION_MS = budgetInitial
    vi.clearAllMocks()
  })

  it('au-delà du budget, elle rend 200, l\'intention de repli, et le repli DÉCLARÉ', async () => {
    // Un modèle qui répondrait, mais trop tard.
    messagesCreate.mockImplementation(() => new Promise((resoudre) => {
      setTimeout(() => resoudre({ content: [{ type: 'text', text: JSON.stringify(complet({ intent: 'quick' })) }] }), 3000)
    }))

    const debut = Date.now()
    const reponse = await TRADUIRE(requete({ phrase: 'Semaine chargée', window_start: DATES[0] }))
    const attendu = Date.now() - debut

    expect(reponse.status).toBe(200)
    const corps = await reponse.json()
    expect(corps.intention).toEqual(complet({ intent: 'balanced' }))
    expect(corps.contraintes).toEqual({ intent: 'balanced' })
    expect(corps.repli.applique).toBe(true)
    expect(corps.repli.raison).toBe(RAISONS_REPLI.DELAI)
    expect(corps.repli.budget_ms).toBe(120)
    // La route a bien COUPÉ : elle n'a pas attendu les 3 s du modèle simulé.
    expect(attendu).toBeLessThan(1500)
    expect(corps.repli.ms).toBeGreaterThanOrEqual(100)
  })

  it('la traduction rendue à temps ne porte AUCUN repli', async () => {
    messagesCreate.mockResolvedValue({ content: [{ type: 'text', text: JSON.stringify(complet({ intent: 'quick', maxMinutes: 30 })) }] })
    const reponse = await TRADUIRE(requete({ phrase: 'Rapide cette semaine', window_start: DATES[0] }))
    expect(reponse.status).toBe(200)
    const corps = await reponse.json()
    expect(corps.repli).toBeNull()
    expect(corps.intention).toEqual(complet({ intent: 'quick', maxMinutes: 30 }))
  })

  it('un REFUS de la porte n\'est pas un repli — rien n\'a été substitué', async () => {
    // Confondre les deux effacerait la différence entre « le modèle a mal
    // traduit » et « le modèle n'a pas répondu à temps », qui n'appellent pas
    // la même correction de la part du foyer.
    messagesCreate.mockResolvedValue({ content: [{ type: 'text', text: JSON.stringify(complet({ starchCap: true })) }] })
    const reponse = await TRADUIRE(requete({ phrase: 'Moins de pâtes', window_start: DATES[0] }))
    expect(reponse.status).toBe(422)
    const corps = await reponse.json()
    expect(corps.code).toBe('traduction_refusee')
    expect(corps.repli).toBeUndefined()
  })

  it('la coupure est posée dans la route, pas seulement confiée au SDK', () => {
    const route = lire('app/api/planning/intent-from-phrase/route.js')
    expect(route).toContain('budgetTraduction')
    expect(route).toContain('Promise.race')
    expect(route).toContain('controleur.abort()')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 6. LES CINQ BOUTONS RESTENT LE CHEMIN RAPIDE
// ═══════════════════════════════════════════════════════════════════════════

describe('La phrase s\'ajoute, elle ne remplace pas', () => {
  it('les cinq intentions restent des boutons dans app/planning/page.js', () => {
    const page = lire('app/planning/page.js')
    for (const intent of INTENTS_MOTEUR) expect(page).toContain(`value: '${intent}'`)
    expect(page).toContain('INTENTS.map')
    // Et cet écran n'appelle PAS le traducteur : cliquer « équilibré » ne coûte
    // ni un appel au modèle, ni cinq secondes d'attente.
    expect(page).not.toContain('/api/planning/intent-from-phrase')
  })

  it('l\'assistant offre les cinq intentions AVANT toute phrase', () => {
    const page = lire('app/planning/assistant/page.js')
    expect(page).toContain('INTENTS_MOTEUR.map')
    expect(page).toContain("corriger('intent'")
    // Le champ de phrase est annoncé facultatif : sans lui, les boutons
    // suffisent.
    expect(page).toContain('<textarea')
    expect(page).toContain('facultatif')
  })

  it('les cinq libellés français existent pour les cinq valeurs du moteur', () => {
    for (const intent of INTENTS_MOTEUR) {
      expect(INTENT_LIBELLE[intent], intent).toBeTruthy()
      expect(enFrancais('intent', intent)).toBe(INTENT_LIBELLE[intent])
    }
  })
})
