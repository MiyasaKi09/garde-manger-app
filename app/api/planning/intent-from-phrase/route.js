import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { authenticateRequest } from '@/lib/apiAuth'
import {
  MAX_MINUTES_BORNES,
  contraintesDuMoteur,
  messageUtilisateur,
  schemaDeSortie,
  systemPrompt,
  validerIntention,
  validerPhrase,
} from '@/lib/domain/planning/intentFromPhrase'
import {
  budgetTraduction,
  intentionDeRepli,
  repliDeclare,
} from '@/lib/domain/planning/budgetTraduction'

export const dynamic = 'force-dynamic'

/**
 * POST /api/planning/intent-from-phrase — livrable 4.1.
 *
 * `{ phrase, window_start?, dates?, members? }` → `{ intention, contraintes }`.
 *
 * CE QUE CETTE ROUTE NE FAIT PAS, ET C'EST SA RAISON D'ÊTRE.
 *   — Elle n'écrit RIEN. Pas une ligne de `meal_presence`, pas un réglage de
 *     foyer, pas une table de planning. Le client Supabase que
 *     `authenticateRequest` rend sert à une seule chose : savoir qui appelle.
 *     `tests/planning/intentDepuisPhrase.test.js` le vérifie deux fois — par le
 *     texte du fichier, et en donnant à la route un client dont chaque verbe
 *     d'écriture lève.
 *   — Elle ne génère aucune semaine et ne choisit aucun plat. Elle rend des
 *     CONTRAINTES ; c'est `generate-v3` qui décide, comme avant.
 *   — Elle ne devine rien. Une sortie de modèle qui ne passe pas la porte de
 *     `validerIntention` est REFUSÉE avec ses motifs (422), jamais corrigée en
 *     silence : c'est ce que l'écran de confirmation montre.
 *
 * LE BUDGET DE LATENCE — livrable 4.3. L'appel au modèle est COUPÉ au budget
 * (`budgetTraduction`, 5 s par défaut, le chiffre du plan). Au-delà, la route
 * répond 200 avec l'intention de repli — `intent: 'balanced'`, aucune autre
 * contrainte — et un objet `repli` qui porte le motif, le budget et la durée
 * RÉELLEMENT attendue. Elle ne renvoie pas une erreur : une erreur ferait
 * croire qu'il n'y a rien à générer, alors que la semaine peut partir. Elle ne
 * renvoie pas non plus une réponse muette : `repli.applique` est ce que l'écran
 * affiche, et le critère dit « visible, jamais silencieux ».
 *
 * CE QUI NE TOMBE PAS SOUS LE REPLI : un refus de la porte (422), une clé
 * absente (503), une erreur du modèle (502). Rien n'y est substitué — on n'a
 * donc rien à avouer, et les motifs sont déjà nommés à l'écran.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

// La traduction d'une phrase tient en cinq champs : quelques centaines de
// tokens suffisent. Le plafond est écrit, comme le CLAUDE.md l'exige, et il est
// bas exprès — une sortie qui le dépasserait serait une sortie qui déborde du
// contrat, pas une traduction.
const MAX_TOKENS = 1024

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function joursDeLaSemaine(body) {
  if (Array.isArray(body?.dates)) {
    const dates = body.dates.filter((date) => typeof date === 'string' && ISO_DATE.test(date))
    if (dates.length) return dates
  }
  const debut = body?.window_start
  if (typeof debut !== 'string' || !ISO_DATE.test(debut)) return []
  return Array.from({ length: 7 }, (_, index) => {
    const jour = new Date(`${debut}T00:00:00Z`)
    jour.setUTCDate(jour.getUTCDate() + index)
    return jour.toISOString().slice(0, 10)
  })
}

/** Le premier bloc de texte de la réponse, ou `null`. */
function texteDeLaReponse(message) {
  for (const bloc of message?.content || []) {
    if (bloc?.type === 'text' && typeof bloc.text === 'string' && bloc.text.trim()) return bloc.text
  }
  return null
}

export async function POST(request) {
  const { user, error: authError } = await authenticateRequest(request)
  if (authError || !user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  let body = {}
  try { body = await request.json() } catch { /* corps vide → refus ci-dessous */ }

  const phraseRefusee = validerPhrase(body?.phrase)
  if (phraseRefusee) return NextResponse.json({ error: phraseRefusee.message, refus: [phraseRefusee] }, { status: 400 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Traduction indisponible : clé Anthropic absente.', code: 'traducteur_indisponible' }, { status: 503 })
  }

  const dates = joursDeLaSemaine(body)

  // Le budget de latence (livrable 4.3). La coupure est posée ICI, autour de
  // l'appel, et pas seulement confiée au SDK : c'est la route qui doit garantir
  // qu'aucune génération n'attend plus que le budget, quel que soit le
  // comportement du transport. Le signal est transmis au SDK en plus, pour que
  // la requête HTTP soit réellement abandonnée et non simplement oubliée.
  const budgetMs = budgetTraduction(process.env)
  const controleur = new AbortController()
  let minuterie = null
  const depart = Date.now()
  const coupure = new Promise((_, rejeter) => {
    minuterie = setTimeout(() => {
      controleur.abort()
      const erreur = new Error(`Traduction coupée au budget de ${budgetMs} ms.`)
      erreur.code = 'budget_traduction'
      rejeter(erreur)
    }, budgetMs)
  })

  let message
  try {
    const appel = anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: MAX_TOKENS,
      // Le point de cache est posé sur le system prompt, qui est le seul
      // contenu STABLE de la requête (ni date, ni prénom, ni phrase n'y
      // entrent). Mesure du 17 septembre 2026 : il fait 1 392 caractères sur
      // 19 lignes, soit de l'ordre de 400 tokens — nettement sous le préfixe
      // minimal cachable, qui part de 1 024. La coupure est donc
      // INERTE aujourd'hui, et elle est écrite ici pour que le prompt puisse
      // grandir sans qu'on ait à y revenir. Annoncer une économie serait faux.
      system: [{ type: 'text', text: systemPrompt(), cache_control: { type: 'ephemeral' } }],
      // Le schéma est une consigne ; `validerIntention` est la porte. Voir
      // l'en-tête de `schemaDeSortie`.
      output_config: { effort: 'low', format: { type: 'json_schema', schema: schemaDeSortie() } },
      messages: [{
        role: 'user',
        content: messageUtilisateur({ phrase: body.phrase, dates, membres: body.members }),
      }],
    }, { signal: controleur.signal })
    // La promesse PERDUE par la course doit garder un gestionnaire : sans lui,
    // l'abandon de l'appel après la coupure remonterait en rejet non capté et
    // ferait tomber le processus Node, budget respecté ou non.
    appel.catch(() => {})
    message = await Promise.race([coupure, appel])
  } catch (error) {
    if (error?.code === 'budget_traduction') {
      // LE REPLI DÉCLARÉ. 200, parce qu'il y a bien de quoi générer ; `repli`,
      // parce qu'on a substitué une valeur et qu'on le dit.
      const intention = intentionDeRepli()
      return NextResponse.json({
        intention,
        contraintes: contraintesDuMoteur(intention),
        bornes: { maxMinutes: MAX_MINUTES_BORNES },
        repli: repliDeclare({ ms: Date.now() - depart, budgetMs }),
        requires_confirmation: true,
      })
    }
    return NextResponse.json({ error: `Traduction impossible : ${error.message}`, code: 'traducteur_en_erreur' }, { status: 502 })
  } finally {
    // Sans cette ligne, la minuterie de cinq secondes survivrait à la réponse
    // et retiendrait la boucle d'événements — y compris en test, où le budget
    // est court mais où le timer resterait armé après un appel réussi.
    if (minuterie) clearTimeout(minuterie)
  }

  const texte = texteDeLaReponse(message)
  if (!texte) {
    return NextResponse.json(
      { error: 'Le traducteur n\'a rien rendu.', code: 'reponse_vide', refus: [] },
      { status: 422 },
    )
  }

  let brut
  try { brut = JSON.parse(texte) } catch {
    return NextResponse.json(
      { error: 'Le traducteur n\'a pas rendu du JSON.', code: 'reponse_illisible', refus: [] },
      { status: 422 },
    )
  }

  const validation = validerIntention(brut, { dates })
  if (!validation.ok) {
    return NextResponse.json({
      error: 'Phrase traduite hors contrat.',
      code: 'traduction_refusee',
      refus: validation.refus,
    }, { status: 422 })
  }

  return NextResponse.json({
    intention: validation.intention,
    contraintes: contraintesDuMoteur(validation.intention),
    bornes: { maxMinutes: MAX_MINUTES_BORNES },
    // Aucun repli : la phrase a bien été lue. Le champ est TOUJOURS présent
    // pour que l'écran n'ait pas à deviner son absence.
    repli: null,
    // La semaine n'a pas bougé et ne bougera pas par cette route : la
    // traduction se CONFIRME à l'écran, puis se génère — et c'est la
    // publication atomique de `generate-v3` qui écrit.
    requires_confirmation: true,
  })
}
