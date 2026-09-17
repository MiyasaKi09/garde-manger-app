import { describe, expect, it } from 'vitest'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { listerTranches } from '@/scripts/data/prices/check-price-provenance.mjs'

/**
 * `npm run prices:check` CONTRÔLE CE QU'IL SERT — livrable 3.6, réserve (b).
 *
 * CE QUI ÉTAIT FAUX, ET QUE LE §2.2 DU PLAN NOMME. Le script cherchait
 * `data/prices/reference-fr.json`, le fichier unique que le §9 du contrat des
 * prix prévoit « à terme ». Il n'existe pas. Le script répondait donc « Aucun
 * référentiel […] — rien à contrôler » et SORTAIT EN ZÉRO, c'est-à-dire en
 * vert, dans `ci.yml` (ligne 44). Pendant ce temps, les 259 relevés que le dépôt
 * portait alors — `data/prices/tranches/`, onze fichiers importés au build par
 * `lib/domain/pricing/tranches.js` — n'étaient vérifiés par personne. Il en
 * reste 254 après la correction ci-dessous, les cinq autres étant déplacées et
 * non détruites.
 *
 * LA CORRECTION TIENT EN DEUX RÈGLES, et ce fichier les éprouve toutes les
 * deux :
 *   1. le contrôle lit le DOSSIER DES TRANCHES, celui que l'application
 *      importe ;
 *   2. un contrôle qui ne trouve RIEN à contrôler ÉCHOUE. Il ne dit pas que
 *      tout va bien : il dit qu'il ne sait pas.
 *
 * CE QUE LA CORRECTION A TROUVÉ, dès sa première exécution : cinq entrées de
 * `surgeles.json` cotaient des formes absentes du catalogue — donc raccordées à
 * rien, donc jamais lues. Elles sont déplacées dans `entrees_hors_catalogue` du
 * même fichier, sans être détruites, et le dernier test de ce fichier le
 * vérifie : rien de sourcé ne disparaît d'un dépôt qui refuse les chiffres
 * invérifiables.
 *
 * Ces tests LANCENT le script. C'est volontaire : c'est le comportement de la
 * ligne de commande — le code de sortie — que la CI consomme, et une fonction
 * exportée testée à part ne dirait rien du code de sortie.
 */

const RACINE = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..')
const SCRIPT = join(RACINE, 'scripts', 'data', 'prices', 'check-price-provenance.mjs')
const TRANCHES = join(RACINE, 'data', 'prices', 'tranches')

const lancer = (arguments_ = []) => spawnSync('node', [SCRIPT, ...arguments_], { cwd: RACINE, encoding: 'utf8' })

describe('le contrôle lit le référentiel réellement servi', () => {
  it('contrôle les onze tranches, sans qu’on ait à les nommer', () => {
    const resultat = lancer(['--json'])
    expect(resultat.status, resultat.stderr).toBe(0)
    const rapport = JSON.parse(resultat.stdout)
    // Les fichiers contrôlés sont EXACTEMENT ceux du dossier : ni un de moins
    // (une tranche oubliée est une tranche non vérifiée), ni un de plus.
    const attendus = readdirSync(TRANCHES).filter((nom) => nom.endsWith('.json')).sort()
    expect(rapport.files.map((chemin) => chemin.split('/').pop())).toEqual(attendus)
    expect(rapport.files.length).toBeGreaterThanOrEqual(11)
    expect(rapport.violations).toEqual([])
    // Le détail par tranche est rendu à côté du total : un total de violations
    // ne dit pas laquelle est en faute, et c'est la tranche qu'on corrige.
    expect(rapport.sets).toHaveLength(rapport.files.length)
    expect(rapport.sets.reduce((somme, jeu) => somme + jeu.entrees, 0)).toBe(rapport.entrees)
    // ET LE TOTAL EST CELUI DU DISQUE, recompté ici plutôt que recopié : un
    // nombre écrit en dur vieillit dès la tranche suivante et ne dirait plus
    // rien. Mesuré le 17 septembre 2026 : 254 relevés servis (259 avant le
    // déplacement des cinq entrées hors catalogue).
    const surDisque = attendus.reduce((somme, nom) => somme
      + (JSON.parse(readFileSync(join(TRANCHES, nom), 'utf8')).entries || []).length, 0)
    expect(rapport.entrees).toBe(surDisque)
    expect(rapport.entrees).toBeGreaterThanOrEqual(254)
  })

  it('ne contrôle plus le fichier unique que le contrat prévoit « à terme »', () => {
    // Il n'existe pas, et c'est précisément ce qui rendait la porte verte.
    // `listerTranches` ne le nomme nulle part.
    expect(listerTranches()).not.toContain(join(RACINE, 'data', 'prices', 'reference-fr.json'))
    expect(listerTranches().every((chemin) => chemin.startsWith(TRANCHES))).toBe(true)
  })
})

describe('un contrôle qui n’a rien à contrôler échoue', () => {
  it('rend 2 et le dit quand le dossier des tranches est vide', () => {
    // On ne peut pas vider le vrai dossier : on éprouve la fonction qui le lit,
    // sur un dossier vide et sur un dossier absent. Les deux rendent la liste
    // vide, et c'est elle qui fait sortir le script en 2.
    const vide = mkdtempSync(join(tmpdir(), 'tranches-vides-'))
    try {
      expect(listerTranches(vide)).toEqual([])
      expect(listerTranches(join(vide, 'absent'))).toEqual([])
    } finally {
      rmSync(vide, { recursive: true, force: true })
    }
    // Et la sortie en 2 est bien celle que le script écrit pour ce cas : on
    // relit la branche plutôt que de supposer qu'elle existe.
    const source = readFileSync(SCRIPT, 'utf8')
    expect(source).toContain('if (!chemins.length)')
    expect(source).toContain('le contrôle n\'a rien lu')
    // Et la phrase d'avant — « rien à contrôler » — n'est plus une SORTIE du
    // script. Elle survit dans le commentaire qui raconte la correction, et
    // c'est très bien : interdire de citer la faute reviendrait à effacer la
    // correction avec elle. On relit donc les lignes de CODE, pas la prose.
    const codeSeul = source.split('\n')
      .filter((ligne) => !/^\s*(\/\/|\*|\/\*)/.test(ligne))
      .join('\n')
    expect(codeSeul).not.toContain('rien à contrôler')
    expect(codeSeul).not.toContain('REFERENTIEL_PAR_DEFAUT')
  })

  it('rend 2 sur un fichier explicitement demandé et absent', () => {
    const resultat = lancer([join(RACINE, 'data', 'prices', 'reference-fr.json')])
    expect(resultat.status).toBe(2)
    expect(resultat.stderr).toContain('Fichier introuvable')
  })

  it('rend 1, et non 0, quand une tranche viole le contrat', () => {
    // La porte doit MORDRE. On lui donne le gabarit du contrat, dont la forme
    // « huile d'olive vierge extra » n'est pas au catalogue des formes de ce
    // dépôt : le contrôle doit le refuser au lieu de l'accepter en silence.
    const resultat = lancer([join(RACINE, 'data', 'prices', 'exemple-gabarit.json'), '--json'])
    expect(resultat.status).toBe(1)
    const rapport = JSON.parse(resultat.stdout)
    expect(rapport.violations.length).toBeGreaterThan(0)
  })
})

describe('ce que la correction a retiré n’est pas détruit', () => {
  const surgeles = JSON.parse(readFileSync(join(TRANCHES, 'surgeles.json'), 'utf8'))

  it('les cinq entrées hors catalogue sont conservées, avec leur motif', () => {
    expect(surgeles.entrees_hors_catalogue.entries).toHaveLength(5)
    expect(surgeles.entrees_hors_catalogue.motif).toContain('form_unknown')
    // Chacune garde sa provenance et sa citation : c'est ce qui permettra de la
    // réintégrer le jour où une recette appellera la forme, sans re-sourcer.
    for (const entree of surgeles.entrees_hors_catalogue.entries) {
      expect(entree.provenance?.citation, entree.form_normalized).toBeTruthy()
      expect(entree.provenance?.source_url, entree.form_normalized).toBeTruthy()
      expect(entree.per_kg?.central, entree.form_normalized).toBeGreaterThan(0)
    }
  })

  it('les deux entrées servies restent servies', () => {
    expect(surgeles.entries.map((entree) => entree.form_normalized).sort())
      .toEqual(['epinard surgele', 'filet de merlu surgele'])
  })

  it('le chiffre de l’erratum est recompté, pas recopié', () => {
    // L'ERRATUM ANNONCE COMBIEN DES VINGT-CINQ FORMES DU LOT19 SONT AU
    // CATALOGUE. Sa première rédaction écrivait « quatre » ; il y en a cinq. Un
    // nombre écrit dans une note de données est un nombre que personne ne
    // recompte — sauf si un test le fait. Il le fait ici.
    const lot = JSON.parse(readFileSync(join(RACINE, 'data', 'foods', 'arbitrations', 'lot19-formes-surgelees.json'), 'utf8'))
    const catalogue = new Set(JSON.parse(
      readFileSync(join(RACINE, 'scripts', 'data', 'out', 'recipe-food-catalog.json'), 'utf8'),
    ).forms.map((forme) => forme.canonical_name_normalized))
    expect(lot.decisions).toHaveLength(25)
    const auCatalogue = lot.decisions.map((decision) => decision.cle).filter((cle) => catalogue.has(cle))
    expect(auCatalogue).toHaveLength(5)
    expect(surgeles.notes).toContain('Cinq des vingt-cinq formes du lot19')
    // Et les deux que cette tranche sert en font partie : c'est ce qui rend le
    // déplacement des cinq autres sans effet sur ce que l'application lit.
    for (const servie of surgeles.entries) expect(auCatalogue, servie.form_normalized).toContain(servie.form_normalized)
  })

  it('l’erratum est écrit dans la note de la tranche', () => {
    // La note annonçait que le lot19 « fait entrer 25 formes surgelées au
    // catalogue » ; c'est faux, le catalogue se construit à partir des formes
    // que le corpus APPELLE. Effacer la phrase aurait effacé la trace ; elle
    // reste, et l'erratum la corrige juste en dessous.
    expect(surgeles.notes).toContain('ERRATUM DU 17 SEPTEMBRE 2026')
    expect(surgeles.notes).toContain('entrees_hors_catalogue')
  })
})
