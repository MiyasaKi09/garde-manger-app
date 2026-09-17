/**
 * exportListe.js — composition du texte de la liste de courses (phase 0a bis).
 *
 * POURQUOI CE MODULE EXISTE, ET POURQUOI IL EST PUR
 *
 * Jusqu'ici la liste de courses ne sortait pas de l'application : aucune des
 * trois API de sortie du navigateur (presse-papiers, partage natif, écriture de
 * texte) n'avait d'occurrence dans `app/`, `components/` et `lib/`. Une liste
 * qu'on ne peut pas emporter est une liste qu'on recopie à la main, donc qu'on
 * n'utilise pas.
 *
 * Les noms d'API ne sont volontairement pas écrits ici : `rapportQualiteSemaine.test.js`
 * les cherche dans `app/`, `components/` et `lib/` pour établir l'état de P17, et
 * un nom cité dans un commentaire compterait comme une sortie qui existe.
 *
 * La composition du texte est séparée de son écriture dans le presse-papiers,
 * parce que ce sont deux problèmes différents : le premier est déterministe et
 * se vérifie ligne à ligne (c'est ce fichier), le second dépend du navigateur,
 * du contexte sécurisé et d'une permission (c'est `app/courses/page.js`). Ce
 * module ne touche donc ni `window`, ni `document`, ni `navigator` : il se teste
 * seul, sans DOM.
 *
 * CE QUE LE TEXTE CONTIENT — LE CONTRAT
 *
 * Exactement une ligne d'article par ligne de `nutrition_plan_shopping_items`
 * de la semaine demandée : aucune perdue, aucune ajoutée. Les articles sont
 * groupés par rayon, dans l'ordre des six rayons déclaré par la chaîne de
 * publication (`lib/domain/planning/canonicalPlanPayload.js` lignes 40-60, et
 * la même table dans `lib/domain/planning/finalDemands.js` lignes 51-71, qui
 * est celle qui construit réellement les articles).
 *
 * CE QUI N'EST PAS DÉCLARÉ EST ABSENT
 *
 * Trois cas où l'on refuse de deviner, et où le module le DIT au lieu de
 * combler :
 *   — un article dont la catégorie n'est aucun des six rayons n'est pas rangé
 *     « au plus proche » : il va dans une section « Rayon non déclaré », en fin
 *     de texte, et son nom de catégorie remonte dans `anomalies.rayons_non_declares` ;
 *   — un article sans quantité chiffrée ET sans quantité déjà rédigée sort sans
 *     quantité du tout, et remonte dans `anomalies.articles_sans_quantite` ;
 *   — une quantité reprise du texte déjà composé à la publication (au lieu
 *     d'être recomposée depuis le chiffre) remonte dans
 *     `anomalies.articles_a_quantite_repliee`.
 * Aucun de ces trois cas ne fait perdre une ligne : la ligne sort toujours.
 *
 * CE QUE « RAYON NON DÉCLARÉ » NE RATTRAPE PAS, ET IL FAUT LE SAVOIR
 *
 * Sur une semaine fraîchement publiée, `rayons_non_declares` est normalement
 * vide — et ce n'est PAS parce que toutes les catégories sont déclarées. C'est
 * que la publication a déjà tranché à notre place : `finalDemands.js:581` et
 * `:696` rangent dans « Épicerie » toute catégorie absente de `categoryLabels`.
 * Mesuré le 17 septembre 2026 : 244 des 549 formes de
 * `scripts/data/out/recipe-food-catalog.json` (44,4 %) portent une catégorie
 * que `categoryLabels` ne déclare pas — dont `volailles`, `epices`,
 * `condiments_sauces`, `matieres_grasses` et 24 formes sans catégorie du tout ;
 * et sur la semaine du 21 septembre 2026, 34 des 100 articles arrivent ici
 * étiquetés « Épicerie », dont « Poulet entier cru ». Cette
 * section ne peut donc rattraper que ce que l'export voit encore non déclaré :
 * les lignes des imports historiques, dont la catégorie est du texte libre
 * (`lib/jsonPlanParser.js:218`, `lib/xlsxParser.js:667`). Réparer le défaut
 * amont demande de toucher la table des rayons de la chaîne de publication,
 * qui n'est pas de cette phase : c'est dit ici plutôt que laissé croire.
 *
 * LES TROIS SORTIES, ET POURQUOI ELLES N'EN FONT QU'UNE (phase 3.5)
 *
 * `exporterListeCourses` est le seul endroit où l'ordre des rayons, le filtre de
 * semaine, l'arrondi des quantités et le comptage des anomalies sont décidés.
 * Les trois sorties déclarées par `SORTIES_LISTE` en descendent toutes :
 *   — `presse-papiers` prend `.texte` tel quel ;
 *   — `partage` (`chargePartageListe`) prend LE MÊME `.texte`, à l'octet près,
 *     et n'y ajoute qu'un titre de message ;
 *   — `impression` (`documentImprimableListe`) prend `.rayons` et n'en change ni
 *     l'ordre, ni le contenu : elle le redécoupe en champs pour que la page
 *     puisse le poser en HTML sans rien trier de son côté.
 * Trois sorties qui divergeraient sur l'ordre des rayons seraient pires que
 * deux : c'est pour cela qu'aucune des deux nouvelles ne refait le travail de la
 * première, et que `tests/courses/exportListe.test.js` compare leurs trois
 * séquences de rayons à la même semaine publiée.
 *
 * CE QUI N'EST PAS ICI
 *
 * Aucun nom d'API navigateur — ni l'écriture dans le presse-papiers, ni le
 * partage natif, ni l'ouverture de la boîte d'impression. Ce module se teste
 * sans DOM ; `app/courses/page.js` porte les trois appels, et la feuille
 * `@media print` colocalisée dans `app/courses/courses.css` porte la mise en
 * page imprimée. Aucune bibliothèque PDF n'est employée : le PDF est celui que
 * le navigateur écrit lui-même depuis la feuille d'impression.
 */

import { formatQuantityHuman } from '../planning/humanQuantities'

/**
 * Les six rayons, dans l'ordre du parcours en magasin.
 *
 * Recopiés — et non importés — de `canonicalPlanPayload.js:53-60` : ce fichier
 * importe `node:crypto` et ne peut pas descendre dans le bundle navigateur d'une
 * page cliente. La recopie est tenue par un test
 * (`tests/courses/exportListe.test.js`) qui relit les deux fichiers source et
 * échoue si un rayon y est ajouté, retiré ou déplacé.
 */
export const RAYONS_ORDONNES = Object.freeze([
  'Fruits et légumes',
  'Viandes',
  'Poissons',
  'Crèmerie',
  'Féculents',
  'Épicerie',
])

/** Section d'accueil des catégories hors des six rayons. Jamais un rangement deviné. */
export const RAYON_NON_DECLARE = 'Rayon non déclaré'

/** Codes d'achat comptables : la quantité se compte, elle ne se pèse pas. */
const UNITES_COMPTABLES = new Set(['u', 'unite', 'unité'])

/** Générique employé quand la ligne ne déclare aucun mot pour son unité comptable. */
const COMPTABLE_GENERIQUE = 'unité'

/**
 * Le mot que la ligne déclare pour son unité comptable — « œufs », « pièces ».
 *
 * `finalDemands.js:641` réduit bien « œuf » et « pièce » au même code d'ACHAT
 * `u`, mais il ne perd pas le mot : la ligne suivante (`:642`) garde un
 * `displayUnit` (« œufs », « pièces »), `shoppingItemFromRequirement` le compose
 * dans `display_quantity`, et la RPC de publication écrit cette chaîne dans la
 * colonne `quantity` (INSERT de `20260717000002_p2_planned_productions.sql`).
 * Vérifié sur la semaine du 21 septembre 2026 : « Œufs durs » arrive avec
 * `quantity = '8 œufs'` et « Banane » avec `quantity = '2 pièces'`. Le mot est
 * donc DÉCLARÉ par la ligne qu'on lit — le rendre « unité » effacerait ce que la
 * ligne dit et ce que l'écran montre, pour rien.
 *
 * On le lit, on ne le fabrique pas : le motif n'accepte qu'un nombre suivi de
 * lettres. « 1 pièce (~120 g) » ou « boîte de 6 œufs » n'y répondent pas, et on
 * retombe alors sur le générique. Écarté : deviner « œufs » depuis le nom du
 * produit, et re-conjuguer le mot au singulier — la publication le stocke au
 * pluriel (`finalDemands.js:642`), c'est là qu'il se corrigerait, pas ici.
 */
function motComptableDeclare(item) {
  const trouve = String(item?.quantity ?? '').trim()
    .match(/^\d+(?:[.,]\d+)?\s+(\p{L}[\p{L}\u2019'\- ]*)$/u)
  return trouve ? trouve[1].trim() : null
}

/** Premier nombre écrit dans un texte ; null s'il n'y en a pas. */
function premierNombre(texte) {
  const trouve = String(texte).match(/\d+(?:[.,]\d+)?/)
  return trouve ? Number(trouve[0].replace(',', '.')) : null
}

/**
 * La quantité déclarée, écrite avec juste assez de décimales pour ne pas être
 * nulle. Sert uniquement à rattraper l'arrondi humain quand il écrase un
 * besoin réel à zéro.
 */
function quantiteDeclaree(quantite, unite) {
  for (const decimales of [1, 2, 3]) {
    const arrondie = Number(quantite.toFixed(decimales))
    if (arrondie > 0) return `${arrondie.toLocaleString('fr-FR')} ${unite}`
  }
  return `${quantite} ${unite}`
}

/** Rang d'un rayon dans le parcours ; -1 quand la catégorie n'est pas déclarée. */
export function rangDuRayon(categorie) {
  return RAYONS_ORDONNES.indexOf(String(categorie ?? '').trim())
}

/**
 * Quantité lisible d'un article.
 *
 * Ordre de préférence, et sa raison :
 *   1. `purchase_qty` + `purchase_unit` passés par `formatQuantityHuman`. C'est
 *      le chiffre que la publication a décidé, et l'arrondi de `humanQuantities`
 *      est celui qu'on peut lire dans un rayon (« environ 600 g » plutôt que
 *      « 597.33 g »).
 *   2. Repli sur `quantity`, le texte déjà composé à la publication, pour les
 *      lignes anciennes qui n'ont pas de quantité chiffrée. C'est une donnée
 *      déclarée de la ligne, pas une reconstitution — mais elle est signalée.
 *   3. Rien. La ligne sort sans quantité et l'article est nommé dans les
 *      anomalies.
 *
 * UNE EXCEPTION À L'ARRONDI HUMAIN, ET UNE SEULE. `formatQuantityHuman` arrondit
 * à 5 g près sous 100 g : tout besoin strictement inférieur à 2,5 g y devient
 * « environ 0 g ». Mesuré sur la semaine du 21 septembre 2026 : 2 lignes sur 99
 * — thym séché, 2,35 g déclarés, et clou de girofle, 0,233 g. Une ligne qui
 * annonce zéro dit d'acheter rien, alors que la ligne déclare un besoin réel :
 * c'est une absence FABRIQUÉE par l'affichage, exactement ce qu'on s'interdit.
 * Dans ce cas seulement, on rend la quantité déclarée. `humanQuantities.js`
 * n'est pas modifié : il sert d'autres écrans et n'est pas de cette phase.
 *
 * @returns {{ texte: string|null, source: 'purchase_qty'|'quantity_publiee'|null }}
 */
export function quantiteLisible(item) {
  const quantite = Number(item?.purchase_qty)
  const unite = String(item?.purchase_unit ?? '').trim()

  if (Number.isFinite(quantite) && quantite > 0 && unite) {
    // Une unité comptable n'a pas de mot en elle-même : `formatQuantityHuman`
    // écrirait « 8 u ». On lui passe le mot que la ligne déclare, ou le
    // générique, accordé sur l'entier que la fonction rendra elle-même.
    const etiquette = UNITES_COMPTABLES.has(unite.toLowerCase())
      ? motComptableDeclare(item)
        || `${COMPTABLE_GENERIQUE}${Math.max(1, Math.round(quantite)) > 1 ? 's' : ''}`
      : null
    const { display } = formatQuantityHuman(quantite, unite, etiquette)
    if (premierNombre(display) === 0) {
      return { texte: quantiteDeclaree(quantite, unite), source: 'purchase_qty' }
    }
    return { texte: display, source: 'purchase_qty' }
  }

  const dejaRedigee = String(item?.quantity ?? '').trim()
  if (dejaRedigee) return { texte: dejaRedigee, source: 'quantity_publiee' }

  return { texte: null, source: null }
}

/**
 * Conditionnement, quand la ligne le déclare. La publication le pose
 * elle-même — `shoppingItemFromRequirement` (`finalDemands.js:200-247`) rend
 * `container_qty` / `container_size` / `container_unit`, et l'UPDATE de
 * `20260721195504_planning_final_demand_truth.sql:302-304` les écrit. Vérifié
 * sur la semaine du 21 septembre 2026 : « Skyr nature » arrive en 2 × 200 g.
 * « 2 × 500 g » est ce qu'on prend dans le rayon ; sans les trois champs, on
 * n'écrit rien.
 */
function conditionnementLisible(item) {
  const nombre = Number(item?.container_qty)
  const taille = Number(item?.container_size)
  const unite = String(item?.container_unit ?? '').trim()
  if (!Number.isFinite(nombre) || nombre <= 0) return null
  if (!Number.isFinite(taille) || taille <= 0 || !unite) return null
  return `${nombre} × ${taille} ${unite}`
}

/** Préfixe de ligne : l'état « acheté » est une donnée de la ligne, on la rend. */
const prefixeLigne = (item) => (item?.checked ? '- [x] ' : '- [ ] ')

/**
 * Replie les blancs en un seul espace.
 *
 * Une ligne source qui porterait un retour chariot dans son nom de produit
 * ferait deux lignes dans le texte copié, donc « une ligne ajoutée ». Le contrat
 * est une ligne par article : il se tient ici, pas par confiance dans la donnée.
 */
const surUneLigne = (valeur) => String(valeur).replace(/\s+/g, ' ').trim()

/**
 * Le motif que suit toute ligne d'article, et aucune autre ligne du texte.
 * Exporté pour que le test de bout en bout compte les lignes rendues sans
 * réécrire le format de son côté.
 */
export const MOTIF_LIGNE_ARTICLE = /^- \[[ x]\] /

const pluriel = (n, singulier, plurielForme) => `${n} ${n > 1 ? plurielForme : singulier}`

/**
 * Compose le texte de la liste de courses.
 *
 * @param {Array<object>} items  lignes de `nutrition_plan_shopping_items`
 * @param {object} [options]
 * @param {string|null} [options.semaine]  `week_label` à retenir ; null = toutes
 * @param {string} [options.titre]         première ligne du texte
 * @returns {{
 *   titre: string,
 *   texte: string,
 *   lignes: Array<{ item: object, rayon: string, rayonDeclare: boolean, texte: string, quantite: object }>,
 *   rayons: Array<{ nom: string, declare: boolean, articles: Array<object> }>,
 *   compte: { articles: number, rayons: number, achetes: number, restants: number },
 *   anomalies: { rayons_non_declares: string[], articles_sans_quantite: string[], articles_a_quantite_repliee: string[] }
 * }}
 */
export function exporterListeCourses(items, options = {}) {
  const { semaine = null, titre = null } = options
  const source = Array.isArray(items) ? items : []

  // Filtre de semaine : une comparaison de libellés, pas de date. `week_label`
  // est le découpage que la publication a écrit ; on ne le recalcule pas.
  const retenus = semaine == null
    ? source.slice()
    : source.filter((item) => String(item?.week_label ?? '') === String(semaine))

  const anomalies = {
    rayons_non_declares: [],
    articles_sans_quantite: [],
    articles_a_quantite_repliee: [],
  }

  const lignes = retenus.map((item) => {
    const rang = rangDuRayon(item?.category)
    const declare = rang >= 0
    const categorieBrute = String(item?.category ?? '').trim()
    if (!declare && categorieBrute && !anomalies.rayons_non_declares.includes(categorieBrute)) {
      anomalies.rayons_non_declares.push(categorieBrute)
    }

    const nom = surUneLigne(item?.product_name ?? '') || '(article sans nom)'
    const quantite = quantiteLisible(item)
    if (quantite.source === null) anomalies.articles_sans_quantite.push(nom)
    if (quantite.source === 'quantity_publiee') anomalies.articles_a_quantite_repliee.push(nom)

    const conditionnement = conditionnementLisible(item)
    const suffixe = [
      quantite.texte ? ` — ${surUneLigne(quantite.texte)}` : '',
      conditionnement ? ` (${conditionnement})` : '',
    ].join('')

    return {
      item,
      rang: declare ? rang : RAYONS_ORDONNES.length,
      rayon: declare ? RAYONS_ORDONNES[rang] : RAYON_NON_DECLARE,
      rayonDeclare: declare,
      nom,
      quantite,
      // Le conditionnement est déjà dans `texte` entre parenthèses ; la sortie
      // imprimée lui donne sa propre colonne et ne peut pas le redécouper d'une
      // chaîne. On le rend donc à part, sans le recalculer deux fois.
      conditionnement,
      texte: `${prefixeLigne(item)}${nom}${suffixe}`,
    }
  })

  // Ordre : les six rayons d'abord, dans leur ordre de parcours, puis les
  // catégories non déclarées. À l'intérieur d'un rayon, l'ordre alphabétique
  // français — le même comparateur que `finalDemands.js:851`, complété par la
  // locale pour que deux exécutions rendent le même texte.
  lignes.sort((gauche, droite) => gauche.rang - droite.rang
    || gauche.nom.localeCompare(droite.nom, 'fr')
    || String(gauche.item?.id ?? '').localeCompare(String(droite.item?.id ?? '')))

  const rayons = []
  for (const ligne of lignes) {
    const dernier = rayons[rayons.length - 1]
    if (dernier && dernier.nom === ligne.rayon) dernier.articles.push(ligne)
    else rayons.push({ nom: ligne.rayon, declare: ligne.rayonDeclare, articles: [ligne] })
  }

  const achetes = lignes.filter((ligne) => Boolean(ligne.item?.checked)).length
  const compte = {
    articles: lignes.length,
    rayons: rayons.length,
    achetes,
    restants: lignes.length - achetes,
  }

  const entete = titre || (semaine ? `Liste de courses — ${semaine}` : 'Liste de courses')
  const blocs = [entete]

  if (lignes.length === 0) {
    // On le dit plutôt que de rendre une chaîne vide : un presse-papiers vide
    // ne se distingue pas d'une copie qui a échoué.
    blocs.push('', 'Aucun article pour cette semaine.')
  } else {
    blocs.push(`${pluriel(compte.articles, 'article', 'articles')} · ${pluriel(compte.rayons, 'rayon', 'rayons')}`)
    for (const rayon of rayons) {
      blocs.push('', `${rayon.nom.toLocaleUpperCase('fr-FR')} (${rayon.articles.length})`)
      for (const ligne of rayon.articles) blocs.push(ligne.texte)
    }
  }

  return { titre: entete, texte: blocs.join('\n'), lignes, rayons, compte, anomalies }
}

/* ────────────────────────────────────────────────────────────────────────────
 * LES TROIS SORTIES (phase 3.5)
 *
 * P17 demande trois sorties « respectant les six rayons et leur ordre ». La
 * seule façon d'en être sûr est qu'aucune ne décide de cet ordre : les trois
 * appellent `exporterListeCourses`, qui le décide une fois.
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * Les trois sorties, nommées. Le test de bout en bout les parcourt par ce
 * tableau plutôt que de les citer une par une : une quatrième sortie ajoutée
 * ici sans être comparée aux deux autres ferait échouer la comparaison, pas
 * passer le test par omission.
 */
export const SORTIES_LISTE = Object.freeze(['presse-papiers', 'partage', 'impression'])

/**
 * Sortie « partage » : la charge d'un message à envoyer.
 *
 * Le corps est `texte` À L'OCTET PRÈS — pas une variante « adaptée au partage ».
 * Deux sorties qui diraient la même liste avec deux ordres de rayons seraient
 * pires qu'une seule, et le seul moyen de ne pas diverger est de ne pas
 * recomposer. Le titre, lui, n'est pas du contenu : c'est le sujet que certaines
 * cibles de partage (courriel, notes) posent en en-tête, et que les autres
 * ignorent. Il reprend l'en-tête du texte, qui reste la première ligne du corps
 * pour que le message soit lisible seul quand le titre est ignoré.
 *
 * Ce module ne partage rien : il compose. L'appel au partage natif, sa détection
 * et son repli visible sont dans `app/courses/page.js`.
 *
 * @returns {{ titre: string, texte: string, rayons: Array<object>, compte: object, anomalies: object }}
 */
export function chargePartageListe(items, options = {}) {
  const { titre, texte, rayons, compte, anomalies } = exporterListeCourses(items, options)
  return { titre, texte, rayons, compte, anomalies }
}

/**
 * Sortie « impression » : le document que la feuille `@media print` met en page.
 *
 * Elle rend des CHAMPS, pas du HTML ni une chaîne : la page n'a plus qu'à poser
 * chaque champ dans son élément, sans trier, sans regrouper et sans reformater.
 * C'est ce qui garantit que la page imprimée porte les mêmes rayons dans le même
 * ordre que le texte copié — la page n'a pas la main pour en décider autrement.
 *
 * `achete` est rendu tel que la ligne le déclare : on imprime la liste dans
 * l'état où elle est, cases cochées comprises. La feuille d'impression décide de
 * l'apparence d'une case cochée, pas ce module.
 *
 * Aucune bibliothèque PDF : « imprimer en PDF » est la fonction du navigateur,
 * et elle part de cette même page. Une bibliothèque PDF aurait été une deuxième
 * mise en page à tenir en accord avec celle-ci — soit exactement la divergence
 * qu'on cherche à éviter.
 *
 * @returns {{
 *   titre: string,
 *   resume: string|null,
 *   rayons: Array<{ nom: string, declare: boolean, articles: Array<{
 *     cle: string, nom: string, quantite: string|null, conditionnement: string|null, achete: boolean
 *   }> }>,
 *   compte: object,
 *   anomalies: object
 * }}
 */
export function documentImprimableListe(items, options = {}) {
  const { titre, rayons, compte, anomalies } = exporterListeCourses(items, options)

  return {
    titre,
    // Le même résumé que la deuxième ligne du texte, et null quand il n'y a
    // rien : une feuille imprimée qui annonce « 0 article » vaut mieux qu'une
    // feuille blanche, mais c'est à la page de le dire, pas à un faux résumé.
    resume: compte.articles === 0
      ? null
      : `${pluriel(compte.articles, 'article', 'articles')} · ${pluriel(compte.rayons, 'rayon', 'rayons')}`,
    rayons: rayons.map((rayon) => ({
      nom: rayon.nom,
      declare: rayon.declare,
      articles: rayon.articles.map((ligne, index) => ({
        // Clé de rendu : l'identifiant de la ligne source quand elle en a un.
        // Le rang dans le rayon n'est un repli que pour les lignes sans `id`.
        cle: String(ligne.item?.id ?? `${rayon.nom}-${index}`),
        nom: ligne.nom,
        quantite: ligne.quantite.texte,
        conditionnement: ligne.conditionnement,
        achete: Boolean(ligne.item?.checked),
      })),
    })),
    compte,
    anomalies,
  }
}
