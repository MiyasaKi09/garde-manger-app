/**
 * Profil de conservation STRUCTURÉ de chaque recette du corpus.
 *
 * Pourquoi ce script existe. Le moteur de planification décidait de la
 * congélation, de la durée d'une production et du service froid en lisant la
 * PROSE du champ « conservation » — ou pire, le nom et la catégorie du plat.
 * La mesure (docs/PLAN_PLANNING_PARFAIT.md §2.5) a montré ce que cela donne :
 * 90 plats « congelables » qui refusent la congélation dans leur propre
 * phrase, un pan bagnat à 24 h produit pour trois jours puis « réchauffé »,
 * et une DLC constante de 3 jours pour toute production, la « 24 heures » de
 * la prose n'étant jamais lue.
 *
 * Ce script lit la prose UNE fois, ici, et écrit dans chaque recette un objet
 * `conservation_profile` :
 *
 *   { fridge_hours, eat_immediately, freezable, freezer_months, serve_cold, source }
 *
 * Le moteur ne lit plus que cet objet. Ce qu'il ne contient pas est ABSENT :
 * une recette sans durée lisible n'a pas de durée (null), et le planificateur
 * n'en produit pas de portions d'avance au lieu de lui inventer trois jours.
 *
 * Deux sources, et l'ordre entre elles :
 * 1. le PARSÉ — ce que la prose déclare de façon lisible à la machine (durées
 *    en chiffres et en lettres, heures et jours, lieu de conservation, mention
 *    d'une consommation immédiate, autorisation ou refus de congélation, mois
 *    au congélateur) ;
 * 2. le MANUEL — data/recipes/arbitrations/conservation-manuelle.json, relu à la
 *    main pour les proses que le parseur ne peut pas trancher (durées par
 *    composant, service froid). Une décision manuelle PRIME champ par champ,
 *    null compris : « null » y est une réponse (« la prose ne dit rien du
 *    plat servi »), pas un oubli.
 *
 * `serve_cold` n'est JAMAIS parsé : aucun mot-clé ne dit si un plat se mange
 * froid (un « taboulé » se sert froid, une « salade de lentilles tièdes » non).
 * C'est la décision manuelle ou rien.
 *
 * Congélation : une prose qui MENTIONNE la congélation sans l'autoriser en
 * toutes lettres ni la refuser donne `freezable: null` — pas true. « Congeler
 * avant friture » ou « pour la congélation, congeler la base sans crème » ne
 * disent pas que le plat servi se congèle. Et un refus l'emporte toujours sur
 * une autorisation dans la même prose : « la sauce se congèle, mais le plat
 * monté supporte mal la congélation » décrit un plat non congelable.
 *
 * Usage :
 *   node scripts/data/recipes/derive-conservation-profiles.mjs            # rapport seul
 *   node scripts/data/recipes/derive-conservation-profiles.mjs --write    # écrit conservation_profile
 *   node scripts/data/recipes/derive-conservation-profiles.mjs --check    # sort en erreur si incohérent
 *   options : --corpus <chemin> (copie de travail, tests), --manual <chemin>
 *
 * Importé par merge-recipe-batch.mjs : toute recette versée reçoit son profil
 * au versement, un lot futur ne peut pas en perdre.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..', '..')
export const CORPUS_PATH = join(ROOT, 'data', 'recipes', 'corpus-v3.json')
export const MANUAL_PATH = join(ROOT, 'data', 'recipes', 'arbitrations', 'conservation-manuelle.json')
const FOOD_REPORT_PATH = join(__dirname, '..', 'out', 'recipe-food-match-report.json')

export const PROFILE_FIELDS = Object.freeze(['fridge_hours', 'eat_immediately', 'freezable', 'freezer_months', 'serve_cold'])

// ─── Normalisation ───────────────────────────────────────────────────────────
// Sans accents, sans œ, sans apostrophes typographiques, en minuscules. Les
// traits d'union deviennent des espaces pour lire « vingt-quatre » comme
// « vingt quatre ». « décongélation » et « recongeler » contiennent « congel »
// sans parler de congélation du plat : on les remplace AVANT toute lecture,
// sinon « réchauffer sans décongélation » serait lu « sans congélation ».
export function foldProse(value) {
  return String(value || '')
    .replace(/œ/gi, 'oe')
    .replace(/æ/gi, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/ | /g, ' ')
    .replace(/-/g, ' ')
    .replace(/decongel\w*/g, 'degel')
    .replace(/recongel\w*/g, 'regel')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Découpe en clauses : une phrase ou un membre après « ; ». Les deux-points
 * ne coupent PAS (« Congélation : acceptable pour la chair crue, déconseillée
 * pour le plat » doit rester une seule clause pour que le refus soit vu). */
const splitClauses = (text) => text.split(/[.;!?]+/).map((clause) => clause.trim()).filter(Boolean)

// ─── Nombres en lettres ──────────────────────────────────────────────────────
// Les composés d'abord (« vingt quatre » avant « vingt »), sinon l'alternative
// courte gagnerait et « vingt-quatre heures » vaudrait vingt heures.
const NUMBER_WORDS = [
  ['soixante douze', 72], ['quarante huit', 48], ['trente six', 36], ['vingt quatre', 24],
  ['dix huit', 18], ['dix sept', 17], ['dix neuf', 19],
  ['quinze', 15], ['quatorze', 14], ['treize', 13], ['seize', 16], ['douze', 12], ['onze', 11],
  ['dix', 10], ['neuf', 9], ['huit', 8], ['sept', 7], ['six', 6], ['cinq', 5], ['quatre', 4],
  ['trois', 3], ['deux', 2], ['une', 1], ['un', 1], ['soixante', 60], ['quarante', 40],
  ['trente', 30], ['vingt', 20], ['cent', 100],
]
const NUMBER_PATTERN = `(?:\\d+(?:[.,]\\d+)?|${NUMBER_WORDS.map(([word]) => word).join('|')})`
const numberValue = (raw) => {
  const text = String(raw).trim()
  if (/^\d/.test(text)) return Number(text.replace(',', '.'))
  const found = NUMBER_WORDS.find(([word]) => word === text)
  return found ? found[1] : null
}

// Une durée : « 3 jours », « deux à trois jours », « 24 h », « 48 heures »,
// « une semaine ». Pour une fourchette on retient la borne BASSE — la seule
// que la prose garantit (même règle que les décisions manuelles).
const DURATION = new RegExp(
  `\\b(${NUMBER_PATTERN})(?:\\s*(?:a|ou|à)\\s*(${NUMBER_PATTERN}))?\\s*(heures?|h|jours?|semaines?|mois)\\b`,
  'g',
)

function durationsIn(clause) {
  const found = []
  for (const match of clause.matchAll(DURATION)) {
    const value = numberValue(match[1])
    if (value == null) continue
    const unit = match[3]
    let hours = null
    if (/^h/.test(unit)) hours = value
    else if (/^j/.test(unit)) hours = value * 24
    else if (/^s/.test(unit)) hours = value * 24 * 7
    found.push({ value, unit, hours, index: match.index, text: match[0] })
  }
  return found
}

// ─── Lexiques ────────────────────────────────────────────────────────────────
const FRIDGE_PLACE = /refrigerateur|frigo|au frais|au froid|4 ?°c|0 et 4|degres|refrigere/
const AMBIENT_PLACE = /temperature ambiante|a l'ambiante|a l'air libre|hors du refrigerateur|boite metallique|dans un linge|a temperature de la piece|(?:jamais|pas|hors) (?:au|du) (?:refrigerateur|frigo|froid)/
// Une durée qui décrit un PROCÉDÉ (réchauffer 20 minutes, reposer 12 h, sortir
// une heure avant de servir, mariner 6 heures) n'est pas une durée de garde.
const PROCESS_BEFORE = /(?:rechauff|cuire|cuisson|enfourn|sortir|sorti|repos|mariner|marinade|tremper|trempage|pousse|lever|degel|attendre|attend|patiente)\w*\s*(?:\w+\s){0,3}$|(?:en moins d'|moins d'|\bd'|les premieres|premieres)\s*$/
const PROCESS_AFTER = /^\s*(?:au refrigerateur |au frais |au froid |a 4 ?°c )?(?:de cuisson|de repos|de marinade|de pousse|de trempage|avant de servir|avant de les servir|avant le service|avant d'ouvrir|a l'avance|d'avance)/
// Une durée dite d'une forme CRUE (« la pâte crue se garde 48 h », « crues,
// les boulettes se gardent 24 h ») décrit un état avant cuisson, pas le plat
// servi. On regarde les mots qui PRÉCÈDENT la durée, jusqu'au dernier
// deux-points : « la sauce contient un jaune cru : 48 heures au maximum »
// parle bien du plat.
// Une forme AVANT la dernière cuisson (« congélation possible deux mois avant
// gratinage », « monté mais non enfourné ») est du même ordre qu'une forme
// crue : ce n'est pas le plat servi. Relevé sur SRC-031 (aubergines farcies),
// dont la prose n'autorise le congélateur que sur la farce non gratinée.
const RAW_SUBJECT = /\bcrue?s?\b|avant (?:cuisson|friture|gratinage|enfournement|montage|assemblage|de (?:cuire|frire|gratiner|enfourner|monter))|non enfourne|non cuite?s?\b/
// « pas plus de 24 heures », « 48 heures maximum » : une borne de garde
// explicite vaut un lieu nommé — c'est une durée de garde sans ambiguïté.
const BOUNDED_BEFORE = /(?:pas plus de|pas au dela de|au maximum|maximum|au plus|jusqu'a)\s*$/
const BOUNDED_AFTER = /^\s*(?:maximum|au maximum|au plus|tout au plus)/
// Un VERBE DE GARDE devant la durée (« la poule se conserve 3 jours »,
// « consommez dans les 24 heures ») dit que la durée est une garde, aussi
// clairement qu'un lieu nommé ou une borne. Sans lui, le lieu était le seul
// signal, et une garde énoncée sans lieu perdait contre une garde plus LONGUE
// énoncée avec lieu : la poule au pot (SRC-001) prenait les 4 jours de son
// bouillon « au froid » contre les 3 jours de la poule, et la piperade aux
// œufs (SRC-048-D1) les 4 jours de « la fondue de légumes seule » contre les
// 24 heures du plat une fois les œufs incorporés. La convention du dépôt est
// la garde la PLUS COURTE ; encore faut-il voir toutes les gardes.
const GUARD_VERB_BEFORE = /(?:se (?:garde|gardent|conserve|conservent|tient|tiennent|mange|mangent)|tient|tiennent|garder|conserver|consomme|consommer|consommez|consommes|dure|durent)\w*\s*(?:[\w'’,°]+\s+){0,4}$/
// « 15 jours au congélateur » est une durée congélateur, pas réfrigérateur.
const followedByFreezer = (clause, duration) => /^\s*au congelateur/.test(clause.slice(duration.index + duration.text.length))

// Consommation immédiate. La liste est fermée et chaque motif dit ce qu'il
// vise ; « immédiatement » seul est trop large (« meilleur immédiatement »
// n'interdit pas de garder le plat), « dans l'heure » aussi (« refroidir dans
// l'heure qui suit la cuisson » parle du refroidissement).
const CONSUME_VERBS = "(?:se mange(?:nt)?|a manger|se deguste(?:nt)?|deguster|se consomme(?:nt)?|a consommer|consommer|a servir|servir|se sert|se servent)"
const EAT_IMMEDIATELY = [
  /a consommer immediatement/, /consommer immediatement/, /se mange(?:nt)? immediatement/,
  /a manger immediatement/, /a deguster immediatement/, /servir immediatement/, /a servir immediatement/,
  new RegExp(`${CONSUME_VERBS} aussitot`), /servi(?:e|s|es)? aussitot/,
  new RegExp(`${CONSUME_VERBS} dans l'heure\\b`),
  /dans la foulee/,
  new RegExp(`${CONSUME_VERBS} (?:a la minute|dans la minute|sur le champ|sans attendre|au sortir|des la sortie|a la sortie|dans les (?:\\w+ )?minutes qui suiv)`),
  // « ne se garde pas » — mais pas « ne se garde pas AU-DELÀ de deux heures »,
  // qui est une durée, pas une interdiction.
  /ne se (?:garde|gardent|conserve|conservent) pas\b(?! au dela| plus de)/,
  /rien ne se (?:garde|conserve)/,
]

// Refus de congélation, dans une clause qui parle de congélation. La liste du
// contrat, plus les tournures relevées dans le corpus qui disent la même chose
// (« ne congelez pas », « à proscrire », « ne la supporte pas », « non
// congelable »). Un refus l'emporte sur une autorisation de la même prose.
const FREEZE_REFUSALS = [
  /ne pas (?:le |la |les )?congel/, /pas de congel/, /deconseill/, /sans congel/, /exclu/,
  /a eviter/, /evite[rz] de (?:le |la |les )?congel/, /impossible/, /proscri/,
  /ne se congel\w* (?:pas|ni|guere|jamais)/, /ne (?:le |la |les )?congel\w* (?:pas|jamais)/,
  /supporte(?:nt)? mal/, /se congel\w* (?:mal|tres mal)/, /jamais au congelateur/,
  /ne (?:le |la |les )?supporte(?:nt)? pas/, /interdit/, /non congelable/, /pas congelable/,
  /ne (?:passe|passent|tient|tiennent|resiste|resistent) pas/,
  /pas (?:conseill|recommand|possible|envisageable)/, /peu (?:conseill|recommand)/,
  /n'est pas (?:conseill|recommand|possible|envisageable)/,
  /n'aime(?:nt)? pas/, /craint|craignent|redoute/, /mauvaise idee/, /rien ne se congel/, /rien [^,]*ne supporte/, /en aucun cas/,
  // « Ni la sauce ni le poisson ne supportent la congélation » : un refus
  // énoncé par « ni … ni … ne », donc sans « pas ». Relevé sur SRC-055 et ses
  // deux dérivées, que le parseur lisait comme une AUTORISATION — « supportent
  // la congélation » matchant l'autorisation sans que le « ne » soit vu.
  /\bni\b[^.;]*\bne (?:le |la |les )?(?:supporte|supportent|congel|se congel|passe|passent|tient|tiennent|resiste|resistent)/,
  /\bne (?:le |la |les )?supporte(?:nt)? (?:pas )?(?:la congelation|le congelateur)/,
]

// Autorisation EXPLICITE de congélation. Tout ce qui n'est ni ici ni dans les
// refus est une simple mention, et une mention ne vaut pas autorisation.
const FREEZE_AUTHORIZATIONS = [
  /se congel/,
  /peu(?:t|vent) (?:se |etre |aussi se |tres bien se |parfaitement se |egalement se )?congel/,
  /peu(?:t|vent) passer au congelateur/,
  /congelation (?:est )?(?:tres bien |bien |parfaitement |tout a fait )?(?:possible|acceptable|autorisee|envisageable|tolerable|toleree|recommandee|conseillee|excellente|bonne|facile|sans probleme|sans dommage|admise|permise|ok)/,
  new RegExp(`congelation(?: :)? (?:jusqu'a )?(?:possible )?${NUMBER_PATTERN} mois`),
  new RegExp(`${NUMBER_PATTERN} (?:mois|semaines?|jours?) au congelateur`),
  /(?:supporte|supportent|tolere|tolerent|tient|tiennent|passe|passent|va|vont|resiste|resistent) (?:tres bien |bien |parfaitement |sans dommage |bien sur )?(?:la congelation|le congelateur|au congelateur)/,
  /congele(?:nt)? (?:tres )?bien/, /se prete(?:nt)? (?:bien |tres bien )?a la congelation/,
  /bon(?:ne)?s? candidat/, /\bcongelable/,
]

// Une autorisation restreinte à un COMPOSANT (« la sauce seule se congèle »,
// « se congèle 3 mois, sans les pâtes », « uniquement sur la base non crémée »)
// n'autorise pas la congélation du plat servi : simple mention, donc null.
const COMPONENT_ONLY = /\bseule?s?\b|uniquement|sans (?:la |le |les |l')/

const clauseMatches = (clause, patterns) => patterns.some((pattern) => pattern.test(clause))

// Une autorisation NIÉE n'est pas une autorisation. « ne supportent la
// congélation », « n'accepte le congélateur » : la négation est devant le
// verbe, pas dans le motif. On regarde donc ce qui précède immédiatement la
// tournure trouvée — au plus trois mots — plutôt que d'écrire chaque
// autorisation en double, une fois affirmative et une fois niée.
const NEGATION_BEFORE = /\b(?:ne|n'|ni)\s+(?:[\w'’]+\s+){0,3}$/
function authorizationIn(clause) {
  for (const pattern of FREEZE_AUTHORIZATIONS) {
    const match = clause.match(pattern)
    if (!match) continue
    if (NEGATION_BEFORE.test(clause.slice(0, match.index))) continue
    return pattern
  }
  return null
}

// ─── Lecture de la prose ─────────────────────────────────────────────────────
/**
 * Lit une prose de conservation. Rend le profil parsé ET les indices qui
 * l'expliquent (`evidence`), pour que --check et le rapport puissent dire
 * pourquoi une valeur est ce qu'elle est. Aucune valeur n'est fabriquée : ce
 * que la prose ne dit pas est null.
 */
export function parseConservation(prose) {
  const text = foldProse(prose)
  const clauses = splitClauses(text)
  const evidence = { fridge: null, immediate: null, freezeRefusal: null, freezeAuthorization: null, freezerMonths: null }

  // Durée réfrigérateur. Chaque durée en heures ou en jours est lue avec son
  // voisinage : une durée « au congélateur », « à température ambiante »,
  // « jamais au réfrigérateur », d'un procédé (réchauffer, reposer, sortir
  // avant de servir) ou d'une forme crue est écartée. Parmi ce qui reste, on
  // retient la PLUS COURTE : un plat ne se garde pas plus longtemps que celui
  // de ses composants qui se garde le moins (« la sauce 4 jours ; les pâtes
  // enrobées 24 heures » décrit un plat à 24 heures) — c'est la borne basse,
  // la même règle que pour une fourchette. Une durée sans lieu (« 5 jours ;
  // meilleur réchauffé ») est gardée telle quelle, sans décider du lieu.
  let fridgeHours = null
  const candidates = []
  for (const clause of clauses) {
    for (const duration of durationsIn(clause).filter((candidate) => candidate.hours != null)) {
      const start = duration.index
      const end = duration.index + duration.text.length
      const before = clause.slice(Math.max(0, start - 45), start)
      const after = clause.slice(end, end + 45)
      if (followedByFreezer(clause, duration)) continue
      if (PROCESS_BEFORE.test(before) || PROCESS_AFTER.test(after)) continue
      const subject = clause.slice(0, start).split(':').pop()
      if (RAW_SUBJECT.test(subject)) continue
      if (AMBIENT_PLACE.test(after)) continue
      const placeNearby = FRIDGE_PLACE.test(before) || FRIDGE_PLACE.test(after)
      if (!placeNearby && AMBIENT_PLACE.test(clause)) continue
      const bounded = BOUNDED_BEFORE.test(before) || BOUNDED_AFTER.test(after)
      const guardVerb = GUARD_VERB_BEFORE.test(before)
      candidates.push({ hours: duration.hours, text: duration.text, clause, withPlace: placeNearby || bounded || guardVerb })
    }
  }
  // Une durée dont le lieu est nommé à côté, bornée en toutes lettres (« pas
  // plus de », « maximum ») ou portée par un verbe de garde (« se conserve »,
  // « consommez dans ») est une durée de garde sans ambiguïté ; elle passe
  // avant une durée nue (« les feuilles tombent en une heure » décrit une
  // dégradation, pas une garde). Entre deux gardes, la PLUS COURTE.
  candidates.sort((left, right) => Number(right.withPlace) - Number(left.withPlace) || left.hours - right.hours)
  if (candidates.length) {
    fridgeHours = candidates[0].hours
    evidence.fridge = { clause: candidates[0].clause, text: candidates[0].text, withPlace: candidates[0].withPlace }
  }

  // Consommation immédiate.
  let eatImmediately = false
  for (const clause of clauses) {
    const pattern = EAT_IMMEDIATELY.find((candidate) => candidate.test(clause))
    if (pattern) { eatImmediately = true; evidence.immediate = { clause, pattern: String(pattern) }; break }
  }

  // Congélation : refus > autorisation > mention (null).
  let refusal = null
  let authorization = null
  let freezerMonths = null
  for (const clause of clauses) {
    if (!clause.includes('congel')) continue
    if (!refusal && clauseMatches(clause, FREEZE_REFUSALS)) {
      refusal = { clause, pattern: String(FREEZE_REFUSALS.find((pattern) => pattern.test(clause))) }
    }
    // Même règle que pour les durées : « le poulet mariné cru se congèle »
    // autorise la congélation d'une forme crue, pas du plat servi ; et une
    // autorisation NIÉE (« ni la sauce ni le poisson ne supportent la
    // congélation ») n'autorise rien — d'où authorizationIn plutôt qu'un
    // simple test de motif.
    if (!authorization && !clauseMatches(clause, FREEZE_REFUSALS) && !COMPONENT_ONLY.test(clause)
      && !RAW_SUBJECT.test(clause)) {
      const pattern = authorizationIn(clause)
      if (pattern) authorization = { clause, pattern: String(pattern) }
    }
    // Mois au congélateur : le plus court cité dans une clause de congélation
    // (borne basse, comme pour les durées réfrigérateur).
    for (const duration of durationsIn(clause).filter((candidate) => candidate.unit === 'mois')) {
      if (freezerMonths == null || duration.value < freezerMonths) {
        freezerMonths = duration.value
        evidence.freezerMonths = { clause, text: duration.text }
      }
    }
  }
  evidence.freezeRefusal = refusal
  evidence.freezeAuthorization = authorization
  const freezable = refusal ? false : (authorization ? true : null)

  return {
    profile: {
      fridge_hours: fridgeHours,
      eat_immediately: eatImmediately,
      freezable,
      // Les mois ne sont reportés que si la congélation est autorisée : « 2
      // mois pour la sauce seule » d'un plat refusé n'est pas une durée du plat.
      freezer_months: freezable === true ? freezerMonths : null,
      serve_cold: null,
    },
    evidence,
    mentionsFreezing: text.includes('congel'),
  }
}

// ─── Décisions manuelles ─────────────────────────────────────────────────────
export function loadManualDecisions(path = MANUAL_PATH) {
  if (!existsSync(path)) return new Map()
  const file = JSON.parse(readFileSync(path, 'utf8'))
  const byCode = new Map()
  for (const decision of file.decisions || []) {
    if (!decision?.code || !decision.profile) throw new Error(`Décision manuelle sans code ou sans profil : ${JSON.stringify(decision).slice(0, 120)}`)
    if (byCode.has(decision.code)) throw new Error(`Décision manuelle en double : ${decision.code}`)
    for (const field of Object.keys(decision.profile)) {
      if (!PROFILE_FIELDS.includes(field)) throw new Error(`${decision.code} : champ inconnu « ${field} » dans la décision manuelle`)
    }
    byCode.set(decision.code, decision)
  }
  return byCode
}

/**
 * Profil d'UNE recette : parsé, puis les décisions manuelles champ par champ.
 * `source` dit d'où vient chaque profil : 'parsed', 'manual' (tous les champs
 * tranchés à la main) ou 'parsed+manual'.
 */
export function deriveConservationProfile(recipe, manualByCode = new Map()) {
  const parsed = parseConservation(recipe?.conservation)
  const manual = manualByCode.get(recipe?.code) || null
  const profile = { ...parsed.profile }
  const manualFields = []
  if (manual) {
    for (const field of PROFILE_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(manual.profile, field)) continue
      profile[field] = manual.profile[field] ?? null
      manualFields.push(field)
    }
    if (profile.eat_immediately == null) profile.eat_immediately = false
  }
  // Une décision manuelle qui parle d'une AUTRE prose que celle du corpus est
  // périmée : la recette a été reprise depuis. On refuse plutôt que d'appliquer
  // un verdict pris sur un texte qui n'existe plus.
  if (manual && manual.prose != null && String(manual.prose) !== String(recipe?.conservation ?? '')) {
    throw new Error(`${recipe.code} : la décision manuelle cite une prose différente de celle du corpus — à relire`)
  }
  const declared = profile.fridge_hours != null || profile.eat_immediately === true
    || profile.freezable != null || profile.freezer_months != null || profile.serve_cold != null
  if (!declared) return { profile: null, parsed, manual }
  const source = !manualFields.length ? 'parsed'
    : (manualFields.length === PROFILE_FIELDS.length ? 'manual' : 'parsed+manual')
  return { profile: { ...profile, source }, parsed, manual }
}

/** Applique le profil à chaque recette (copie, sans muter l'entrée). */
export function applyConservationProfiles(recipes, manualByCode = new Map()) {
  return recipes.map((recipe) => {
    const { profile } = deriveConservationProfile(recipe, manualByCode)
    return { ...recipe, conservation_profile: profile }
  })
}

// ─── Contrôle ────────────────────────────────────────────────────────────────
/**
 * Erreurs qui empêchent de publier :
 * - une recette publiable sans profil (le moteur ne saurait rien en faire) ;
 * - un profil freezable=true alors que sa prose refuse la congélation ;
 * - fridge_hours null alors que la recette n'est pas à consommer immédiatement
 *   et que la prose porte une durée lisible (une décision manuelle a effacé
 *   une durée que le parseur lit : à relire, pas à taire).
 */
export function checkConservationProfiles(recipes, { manualByCode = new Map(), publishableCodes = null } = {}) {
  const errors = []
  for (const recipe of recipes) {
    const { profile, parsed } = deriveConservationProfile(recipe, manualByCode)
    const stored = recipe.conservation_profile ?? null
    const publishable = publishableCodes ? publishableCodes.has(recipe.code) : true
    if (publishable && !stored) errors.push(`${recipe.code} : recette publiable sans profil de conservation`)
    if (stored && JSON.stringify(stored) !== JSON.stringify(profile)) {
      errors.push(`${recipe.code} : conservation_profile diffère de la dérivation courante — relancer --write`)
    }
    if (!stored) continue
    if (stored.freezable === true && parsed.evidence.freezeRefusal) {
      errors.push(`${recipe.code} : freezable=true alors que la prose refuse la congélation (« ${parsed.evidence.freezeRefusal.clause} »)`)
    }
    if (stored.fridge_hours == null && stored.eat_immediately !== true && parsed.profile.fridge_hours != null) {
      errors.push(`${recipe.code} : fridge_hours null alors que la prose porte « ${parsed.evidence.fridge.text} »`)
    }
    if (stored.freezer_months != null && stored.freezable !== true) {
      errors.push(`${recipe.code} : freezer_months posé sans freezable=true`)
    }
  }
  return errors
}

export function summarizeProfiles(recipes, publishableCodes = null) {
  const counts = {
    recettes: recipes.length,
    publiables: publishableCodes ? recipes.filter((recipe) => publishableCodes.has(recipe.code)).length : null,
    avec_profil: 0,
    sans_profil: [],
    sources: {},
    congelables: 0,
    non_congelables: 0,
    congelation_non_declaree: 0,
    a_consommer_immediatement: 0,
    servis_froids: 0,
    servis_chauds_declares: 0,
    fridge_hours_null_sans_immediat: [],
    fridge_hours_moins_de_48: 0,
  }
  for (const recipe of recipes) {
    const publishable = publishableCodes ? publishableCodes.has(recipe.code) : true
    const profile = recipe.conservation_profile
    if (!profile) { if (publishable) counts.sans_profil.push(recipe.code); continue }
    if (!publishable) continue
    counts.avec_profil += 1
    counts.sources[profile.source] = (counts.sources[profile.source] || 0) + 1
    if (profile.freezable === true) counts.congelables += 1
    else if (profile.freezable === false) counts.non_congelables += 1
    else counts.congelation_non_declaree += 1
    if (profile.eat_immediately) counts.a_consommer_immediatement += 1
    if (profile.serve_cold === true) counts.servis_froids += 1
    if (profile.serve_cold === false) counts.servis_chauds_declares += 1
    if (profile.fridge_hours == null && !profile.eat_immediately) counts.fridge_hours_null_sans_immediat.push(recipe.code)
    if (profile.fridge_hours != null && profile.fridge_hours < 48) counts.fridge_hours_moins_de_48 += 1
  }
  return counts
}

function loadPublishableCodes() {
  if (!existsSync(FOOD_REPORT_PATH)) return null
  const report = JSON.parse(readFileSync(FOOD_REPORT_PATH, 'utf8'))
  return new Set((report.recipe_eligibility || [])
    .filter((item) => item.eligible_for_publication === true)
    .map((item) => item.code))
}

// ─── Ligne de commande ───────────────────────────────────────────────────────
function main() {
  const args = process.argv.slice(2)
  const valueOf = (flag) => {
    const position = args.indexOf(flag)
    return position >= 0 ? args[position + 1] : null
  }
  const corpusPath = resolve(valueOf('--corpus') || CORPUS_PATH)
  const manualPath = resolve(valueOf('--manual') || MANUAL_PATH)
  const write = args.includes('--write')
  const check = args.includes('--check')

  const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'))
  const manualByCode = loadManualDecisions(manualPath)
  const publishable = loadPublishableCodes()
  const recipes = applyConservationProfiles(corpus.recipes, manualByCode)

  const orphanManual = [...manualByCode.keys()].filter((code) => !corpus.recipes.some((recipe) => recipe.code === code))
  if (orphanManual.length) {
    console.error(`Décisions manuelles sans recette au corpus : ${orphanManual.join(', ')}`)
    process.exit(1)
  }

  if (write) {
    writeFileSync(corpusPath, `${JSON.stringify({ ...corpus, recipes }, null, 2)}\n`)
    console.log(`conservation_profile écrit pour ${recipes.length} recettes dans ${corpusPath}`)
  }

  const summary = summarizeProfiles(write ? recipes : corpus.recipes, publishable)
  console.log(JSON.stringify(summary, null, 2))
  if (!publishable) console.log('(rapport de publiabilité absent : scripts/data/out/recipe-food-match-report.json — toutes les recettes comptées)')

  if (check) {
    const errors = checkConservationProfiles(corpus.recipes.map((recipe, index) => (write ? recipes[index] : recipe)), { manualByCode, publishableCodes: publishable })
    if (errors.length) {
      console.error(`\n${errors.length} erreur(s) :`)
      for (const error of errors) console.error(`  - ${error}`)
      process.exit(1)
    }
    console.log('\n--check : aucun écart.')
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main()
}
