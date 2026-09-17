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
 *     silence : c'est ce que le livrable 4.2 doit pouvoir montrer à l'écran.
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

  let message
  try {
    message = await anthropic.messages.create({
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
    })
  } catch (error) {
    return NextResponse.json({ error: `Traduction impossible : ${error.message}`, code: 'traducteur_en_erreur' }, { status: 502 })
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
    // La semaine n'a pas bougé et ne bougera pas par cette route : la
    // traduction se confirme (4.2) puis se génère (4.3), et c'est la
    // publication atomique qui écrit.
    requires_confirmation: true,
  })
}
