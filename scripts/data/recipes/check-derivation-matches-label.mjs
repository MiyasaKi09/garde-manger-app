/**
 * Confronte le DELTA d'une variante dérivée à ce que son ÉTIQUETTE annonce.
 *
 * Le moteur de dérivation vérifie qu'un delta est cohérent : ses cibles
 * existent, ses retraits ne laissent pas d'étape orpheline, ses ajouts servent
 * à quelque chose. Il ne vérifie pas qu'il fait ce qu'il PROMET. Une variante
 * étiquetée « doubler le poireau et réduire la carotte de moitié » dont le
 * delta ne touche que la carotte passe tous les contrôles : elle est cohérente,
 * elle est simplement fausse.
 *
 * Ce script lit l'étiquette comme une consigne et cherche l'opération
 * correspondante. Il SIGNALE, il ne refuse pas : une étiquette est de la prose,
 * et « une sauce plus vive » peut se traduire par un retrait d'oignon sans que
 * le mot « oignon » figure dans la phrase. C'est au relecteur de trancher, avec
 * la base sous les yeux.
 *
 *   node scripts/data/recipes/check-derivation-matches-label.mjs data/recipes/derivations/lot07-*.json
 *   node scripts/data/recipes/check-derivation-matches-label.mjs --tous
 */
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { normalizeName } from '../lib/normalize.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
const CORPUS = join(ROOT, 'data', 'recipes', 'corpus-v3.json')
const DOSSIER = join(ROOT, 'data', 'recipes', 'derivations')

const MOTS_VIDES = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'et', 'ou', 'en', 'au', 'aux',
  'pour', 'par', 'dans', 'sur', 'avec', 'sans', 'plus', 'moins', 'tout', 'toute',
  'son', 'sa', 'ses', 'leur', 'cette', 'ce', 'qui', 'que', 'est', 'sont', 'fait',
  'version', 'variante', 'faire', 'laisser', 'puis', 'ensuite', 'bien', 'tres',
])

const radical = (mot) => mot.replace(/(?:eaux|aux)$/, 'eau').replace(/[sx]$/, '')
const mots = (texte) => normalizeName(texte).split(' ').filter((mot) => mot.length > 3 && !MOTS_VIDES.has(mot)).map(radical)

/** Mot de tête d'un nom de forme : celui qui la nomme. */
const tete = (forme) => {
  const trouves = normalizeName(forme).split(' ').filter((mot) => mot.length > 2 && !MOTS_VIDES.has(mot))
  return trouves[0] ? radical(trouves[0]) : null
}

/**
 * Consignes lisibles dans une étiquette, et l'opération qu'on attend en face.
 * Chaque motif capture le mot d'ingrédient qui suit la consigne.
 */
// L'article peut être élidé — « supprimer l'oignon » n'a pas d'espace après
// l'apostrophe — d'où \s* et non \s+ après le groupe.
const ARTICLES = `(?:l[ea]s?|l['’]|du|de\\s+la|des|d['’]|aux?|un[e]?|quelques|tout\\s+ou\\s+partie\\s+d[eu]s?)`
// Les verbes se cherchent par leur radical : une étiquette écrit aussi bien
// « on supprime la tomate » que « supprimer la tomate », et exiger l'infinitif
// laissait passer la moitié des consignes.
const CONSIGNES = [
  { regex: new RegExp(`\\b(?:sans|supprim\\w*|retir\\w*|omet\\w*|[ôo]t\\w*|remplac\\w*)\\s+(?:${ARTICLES}\\s*)?([a-zàâäéèêëîïôöùûüç-]+)`, 'gi'), nom: 'un retrait' },
  { regex: new RegExp(`\\bdoubl\\w*\\s+(?:${ARTICLES}\\s*)?(?:dose\\s+de\\s+)?([a-zàâäéèêëîïôöùûüç-]+)`, 'gi'), nom: 'un doublement' },
  // « ajouter AUX oignons des tomates » ajoute les tomates, pas les oignons : le
  // complément d'attribution nomme le destinataire. Le motif exclut donc « à »,
  // « au » et « aux » juste après le verbe.
  { regex: new RegExp(`\\b(?:ajout\\w*|incorpor\\w*|parsem\\w*\\s+de)\\s+(?!aux?\\b|à\\b)(?:${ARTICLES}\\s*)?([a-zàâäéèêëîïôöùûüç-]+)`, 'gi'), nom: 'un ajout' },
  { regex: new RegExp(`\\b(?:substitu\\w*|troqu\\w*)\\s+(?:${ARTICLES}\\s*)?([a-zàâäéèêëîïôöùûüç-]+)`, 'gi'), nom: 'une substitution' },
]

/**
 * « avant d'ajouter la farine » situe un geste dans le temps, il ne réclame pas
 * de farine supplémentaire. La consigne d'ajout ne vaut que si rien ne la
 * subordonne à un autre geste.
 */
const TEMPOREL = /\b(?:avant|apr[èe]s|lorsqu|quand|d[èe]s\s+que|au\s+moment)\b[^.]{0,20}$/i

function analyser(derivation, base) {
  const remarques = []
  const operations = derivation.operations || []
  const parType = new Map()
  for (const operation of operations) {
    if (!parType.has(operation.op)) parType.set(operation.op, [])
    parType.get(operation.op).push(operation)
  }
  // Un mot d'ingrédient est « traité » s'il apparaît dans une opération, quelle
  // qu'elle soit : c'est déjà la preuve que le delta l'a vu.
  const motsTraites = new Set()
  for (const operation of operations) {
    for (const champ of [operation.form, operation.with]) {
      const mot = champ ? tete(champ) : null
      if (mot) motsTraites.add(mot)
    }
  }
  const motsBase = new Set((base.ingredients || []).map((ingredient) => tete(ingredient.form)).filter(Boolean))

  const etiquette = derivation.variant_label || ''
  for (const consigne of CONSIGNES) {
    consigne.regex.lastIndex = 0
    let trouve
    while ((trouve = consigne.regex.exec(etiquette)) !== null) {
      const mot = radical(normalizeName(trouve[1]))
      // On ne réclame une opération que si le mot désigne un ingrédient DE LA
      // BASE. « Sans attendre », « ajouter de l'eau » sur une base qui n'a pas
      // d'eau : ce sont des tournures, pas des consignes d'ingrédient.
      if (!mot || MOTS_VIDES.has(mot) || !motsBase.has(mot)) continue
      if (motsTraites.has(mot)) continue
      if (TEMPOREL.test(etiquette.slice(0, trouve.index))) continue
      remarques.push(`l'étiquette annonce ${consigne.nom} sur « ${trouve[1]} », qu'aucune opération ne touche`)
    }
  }

  // Nota : on ne signale PAS une variante sans opération d'ingrédient au seul
  // motif que son étiquette nomme un aliment. « Cuisson en autocuiseur, crème
  // ajoutée à l'ouverture » nomme la crème sans rien y changer, et c'est le cas
  // de presque toutes les variantes de technique. Seules les CONSIGNES ci-dessus
  // — retirer, doubler, ajouter, substituer — appellent une opération.

  // Plausibilité des quantités, ramenées à la portion.
  //
  // Le rôle DÉCLARÉ décide de ce qui est un assaisonnement, pas le nom : chercher
  // « épice » dans le libellé faisait passer le pain d'épices pour une épice, et
  // « piment » condamnait le piment doux d'Anglet, qui est un légume.
  const portions = Number(derivation.servings || base.servings) || 1
  const roleDeBase = new Map((base.ingredients || []).map((ingredient) => [normalizeName(ingredient.form), ingredient.role]))
  const quantiteDeBase = new Map((base.ingredients || []).map((ingredient) => [normalizeName(ingredient.form), Number(ingredient.quantity)]))
  const MASSES = new Set(['g', 'ml'])
  for (const operation of operations) {
    const quantite = Number(operation.quantity)
    if (!Number.isFinite(quantite)) continue
    const forme = operation.with || operation.form || ''
    const unite = operation.unit || roleDeBase.has(normalizeName(operation.form)) ? (operation.unit || 'g') : 'g'
    // Seules les masses se comparent à un seuil. Une pièce, une tranche ou une
    // feuille se comptent : un œuf pour quatre parts n'est pas « trop peu ».
    if (!MASSES.has(unite)) continue
    const role = operation.role || roleDeBase.get(normalizeName(operation.form)) || ''
    // Le rôle se lit par son MOT DE TÊTE : « fromage d'assaisonnement » est un
    // fromage, et un parmesan à 22 g par part n'a rien d'aberrant. Chercher
    // « assaisonnement » n'importe où dans le rôle le condamnait.
    const teteDuRole = normalizeName(role).split(' ')[0] || ''
    const estAssaisonnement = /^(?:assaisonnement|epice|epices)$/.test(teteDuRole)
    const estAromate = /^(?:aromate|aromatique)$/.test(teteDuRole)
    const parPortion = quantite / portions

    // Pour un assaisonnement, la référence n'est pas un seuil absolu mais la
    // DOSE DE LA BASE : un riz cantonais qui porte déjà 15 g de sauce soja par
    // part n'est pas fautif parce que sa variante en met 18. Ce qu'on cherche,
    // c'est un delta qui triple ou divise par trois sans le dire.
    const quantiteBase = quantiteDeBase.get(normalizeName(operation.form))
    if (estAssaisonnement && quantiteBase > 0 && operation.op !== 'add') {
      const rapport = quantite / quantiteBase
      if (rapport > 3 || rapport < 1 / 3) {
        remarques.push(`« ${forme} » passe de ${quantiteBase} à ${quantite} ${unite}, soit × ${rapport.toFixed(1)} : gros écart pour un ${role}`)
      }
    } else if (estAssaisonnement && parPortion > 6) {
      remarques.push(`« ${forme} » ajouté à ${parPortion.toFixed(1)} ${unite} par personne : beaucoup pour un ${role}`)
    }
    if (estAromate && parPortion > 50) {
      remarques.push(`« ${forme} » à ${parPortion.toFixed(1)} ${unite} par personne : beaucoup pour un ${role}`)
    }
    if (!estAssaisonnement && !estAromate && parPortion > 400) {
      remarques.push(`« ${forme} » à ${quantite} ${unite} pour ${portions} parts, soit ${parPortion.toFixed(0)} par personne : à vérifier`)
    }
    if (!estAssaisonnement && !estAromate && parPortion > 0 && parPortion < 1) {
      remarques.push(`« ${forme} » à ${parPortion.toFixed(2)} ${unite} par personne : trop peu pour se voir dans l'assiette`)
    }
  }

  return remarques
}

function principal() {
  const arguments_ = process.argv.slice(2)
  const fichiers = arguments_.includes('--tous')
    ? readdirSync(DOSSIER).filter((nom) => nom.endsWith('.json')).map((nom) => join(DOSSIER, nom)).sort()
    : arguments_
  if (!fichiers.length) {
    console.error('Usage : check-derivation-matches-label.mjs <lot.json…> | --tous')
    process.exit(2)
  }

  const corpus = JSON.parse(readFileSync(CORPUS, 'utf8'))
  const parCode = new Map(corpus.recipes.map((recette) => [recette.code, recette]))

  let total = 0
  let signalees = 0
  for (const fichier of fichiers) {
    const contenu = JSON.parse(readFileSync(fichier, 'utf8'))
    for (const derivation of contenu.derivations || []) {
      total += 1
      const base = parCode.get(derivation.base)
      if (!base) { console.log(`? ${derivation.code} — base ${derivation.base} introuvable au corpus`); continue }
      const remarques = analyser(derivation, base)
      if (!remarques.length) continue
      signalees += 1
      console.log(`\n${derivation.code}  ${derivation.family}`)
      console.log(`   étiquette : ${derivation.variant_label.slice(0, 130)}`)
      for (const remarque of remarques) console.log(`   → ${remarque}`)
    }
  }
  console.log(`\n${total} dérivations lues, ${signalees} à regarder de près.`)
  console.log('Ces remarques ne sont pas des refus : une étiquette est de la prose, et le delta')
  console.log('peut la tenir avec d\'autres mots. C\'est au relecteur de trancher, base sous les yeux.')
}

if (process.argv[1] && process.argv[1].endsWith('check-derivation-matches-label.mjs')) principal()

export { analyser }
