/**
 * build-icons.mjs — fabrique les icônes de l'application installable (3.7).
 *
 * POURQUOI UN SCRIPT PLUTÔT QUE DES FICHIERS POSÉS À LA MAIN
 *
 * Les icônes d'un manifeste ne sont pas des illustrations : ce sont cinq tailles
 * du MÊME dessin, plus une version « maskable » dont le motif doit tenir dans le
 * cercle de sécurité qu'Android découpe. Posées à la main, elles divergent au
 * premier retouchage — et personne ne s'en aperçoit avant de voir l'icône
 * rognée sur l'écran d'accueil. Elles sont donc engendrées, et le script est
 * relu plutôt que les binaires.
 *
 * AUCUNE DÉPENDANCE. Le dépôt n'embarque ni bibliothèque graphique ni encodeur
 * d'image, et ce n'est pas la place d'en ajouter une pour six fichiers. Le
 * script écrit le PNG lui-même : `node:zlib` pour la compression (c'est ce
 * qu'exige le format), un CRC-32 de vingt lignes pour les blocs, et un
 * suréchantillonnage ×4 puis une moyenne pour les bords lisses.
 *
 * Reproductible : deux exécutions rendent les mêmes octets. `--check` le
 * vérifie sans rien écrire, et c'est ce que `tests/pwa/manifeste.test.js`
 * appelle pour que les icônes du dépôt ne puissent pas dériver du dessin décrit
 * ici.
 *
 * Usage :
 *   npm run pwa:icons    # écrit public/icons/
 *   npm run pwa:check    # échoue si un fichier diffère du dessin décrit ici
 */

import { deflateSync } from 'node:zlib'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DOSSIER = join(RACINE, 'public', 'icons')

/** Les couleurs du thème, recopiées de `app/globals.css`. */
const PAPIER = [0xF3, 0xEF, 0xE4]   // --paper
const FORET = [0x2F, 0x5D, 0x3A]    // --brand
const ENCRE = [0x18, 0x1C, 0x16]    // --ink-1

/** Suréchantillonnage : on dessine en dur, on moyenne ensuite. */
const ECHELLE = 4

// ── PNG ──────────────────────────────────────────────────────────────────────

const TABLE_CRC = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(octets) {
  let c = 0xFFFFFFFF
  for (const octet of octets) c = TABLE_CRC[(c ^ octet) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

function bloc(type, donnees) {
  const entete = Buffer.alloc(8)
  entete.writeUInt32BE(donnees.length, 0)
  entete.write(type, 4, 'ascii')
  const corps = Buffer.concat([entete.subarray(4), donnees])
  const fin = Buffer.alloc(4)
  fin.writeUInt32BE(crc32(corps), 0)
  return Buffer.concat([entete, donnees, fin])
}

/** PNG couleur vraie 8 bits, sans canal alpha : les icônes sont opaques. */
function encoderPng(largeur, hauteur, pixels) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(largeur, 0)
  ihdr.writeUInt32BE(hauteur, 4)
  ihdr[8] = 8    // profondeur
  ihdr[9] = 2    // type couleur : RGB
  const brut = Buffer.alloc(hauteur * (largeur * 3 + 1))
  for (let y = 0; y < hauteur; y += 1) {
    const debut = y * (largeur * 3 + 1)
    brut[debut] = 0 // filtre « none » : la compression suffit à cette taille
    pixels.copy(brut, debut + 1, y * largeur * 3, (y + 1) * largeur * 3)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    bloc('IHDR', ihdr),
    bloc('IDAT', deflateSync(brut, { level: 9 })),
    bloc('IEND', Buffer.alloc(0)),
  ])
}

// ── Dessin ───────────────────────────────────────────────────────────────────

/** Une toile en coordonnées unitaires : (0,0) en haut à gauche, (1,1) en bas. */
function toile(cote, fond) {
  const n = cote * ECHELLE
  const px = Buffer.alloc(n * n * 3)
  for (let i = 0; i < n * n; i += 1) {
    px[i * 3] = fond[0]; px[i * 3 + 1] = fond[1]; px[i * 3 + 2] = fond[2]
  }

  const poser = (x, y, couleur) => {
    if (x < 0 || y < 0 || x >= n || y >= n) return
    const i = (y * n + x) * 3
    px[i] = couleur[0]; px[i + 1] = couleur[1]; px[i + 2] = couleur[2]
  }

  return {
    n,
    px,
    /** Disque plein, rayon en fraction du côté. */
    disque(cx, cy, r, couleur) {
      const [x0, y0, rayon] = [cx * n, cy * n, r * n]
      const borne = Math.ceil(rayon) + 1
      for (let y = Math.floor(y0 - borne); y <= y0 + borne; y += 1) {
        for (let x = Math.floor(x0 - borne); x <= x0 + borne; x += 1) {
          if ((x + 0.5 - x0) ** 2 + (y + 0.5 - y0) ** 2 <= rayon ** 2) poser(x, y, couleur)
        }
      }
    },
    /** Segment à bouts ronds, épaisseur en fraction du côté. */
    segment(ax, ay, bx, by, epaisseur, couleur) {
      const [x0, y0, x1, y1, e] = [ax * n, ay * n, bx * n, by * n, (epaisseur * n) / 2]
      const dx = x1 - x0
      const dy = y1 - y0
      const longueur2 = dx * dx + dy * dy || 1
      const minX = Math.floor(Math.min(x0, x1) - e - 1)
      const maxX = Math.ceil(Math.max(x0, x1) + e + 1)
      const minY = Math.floor(Math.min(y0, y1) - e - 1)
      const maxY = Math.ceil(Math.max(y0, y1) + e + 1)
      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          const t = Math.max(0, Math.min(1, ((x + 0.5 - x0) * dx + (y + 0.5 - y0) * dy) / longueur2))
          const px0 = x0 + t * dx
          const py0 = y0 + t * dy
          if ((x + 0.5 - px0) ** 2 + (y + 0.5 - py0) ** 2 <= e * e) poser(x, y, couleur)
        }
      }
    },
    /** Moyenne des blocs ×4 : c'est là que naissent les bords lisses. */
    rendre() {
      const sortie = Buffer.alloc(cote * cote * 3)
      const aire = ECHELLE * ECHELLE
      for (let y = 0; y < cote; y += 1) {
        for (let x = 0; x < cote; x += 1) {
          const somme = [0, 0, 0]
          for (let sy = 0; sy < ECHELLE; sy += 1) {
            for (let sx = 0; sx < ECHELLE; sx += 1) {
              const i = ((y * ECHELLE + sy) * n + (x * ECHELLE + sx)) * 3
              somme[0] += px[i]; somme[1] += px[i + 1]; somme[2] += px[i + 2]
            }
          }
          const j = (y * cote + x) * 3
          sortie[j] = Math.round(somme[0] / aire)
          sortie[j + 1] = Math.round(somme[1] / aire)
          sortie[j + 2] = Math.round(somme[2] / aire)
        }
      }
      return sortie
    },
  }
}

/**
 * Le réseau mycorhizien : une tige qui monte, deux fois deux ramifications, un
 * nœud à chaque extrémité, et la ligne de sol d'où tout part.
 *
 * `echelleMotif` resserre le dessin pour la variante « maskable » : Android
 * découpe l'icône en cercle, carré arrondi ou goutte selon le lanceur, et ne
 * garantit que le disque central de 80 % du côté. Un motif qui remplirait la
 * tuile y perdrait ses branches.
 */
function dessinerMarque(cv, encre, echelleMotif) {
  const k = echelleMotif
  const c = (v) => 0.5 + (v - 0.5) * k
  const e = (v) => v * k

  const tige = e(0.055)
  const branche = e(0.042)
  const brindille = e(0.032)
  const noeud = e(0.040)

  // Sol
  cv.segment(c(0.20), c(0.815), c(0.80), c(0.815), e(0.034), encre)
  // Tige
  cv.segment(c(0.50), c(0.815), c(0.50), c(0.505), tige, encre)
  // Deux branches maîtresses
  cv.segment(c(0.50), c(0.545), c(0.255), c(0.375), branche, encre)
  cv.segment(c(0.50), c(0.545), c(0.745), c(0.375), branche, encre)
  // Quatre brindilles
  cv.segment(c(0.255), c(0.375), c(0.175), c(0.225), brindille, encre)
  cv.segment(c(0.255), c(0.375), c(0.380), c(0.215), brindille, encre)
  cv.segment(c(0.745), c(0.375), c(0.620), c(0.215), brindille, encre)
  cv.segment(c(0.745), c(0.375), c(0.825), c(0.225), brindille, encre)
  // Nœuds : les connexions, qui sont le sujet
  for (const [x, y] of [[0.175, 0.225], [0.380, 0.215], [0.620, 0.215], [0.825, 0.225]]) {
    cv.disque(c(x), c(y), noeud, encre)
  }
  cv.disque(c(0.50), c(0.545), e(0.052), encre)
}

/** Icône claire : motif forêt sur papier. Celle des écrans d'accueil clairs. */
function iconeClaire(cote, echelleMotif = 1) {
  const cv = toile(cote, PAPIER)
  dessinerMarque(cv, FORET, echelleMotif)
  return encoderPng(cote, cote, cv.rendre())
}

/** Icône « maskable » : fond plein forêt, motif papier, motif resserré à 62 %. */
function iconeMaskable(cote) {
  const cv = toile(cote, FORET)
  dessinerMarque(cv, PAPIER, 0.62)
  return encoderPng(cote, cote, cv.rendre())
}

/** Icône Apple : iOS n'applique aucun masque et pose un carré arrondi opaque. */
function iconeApple(cote) {
  const cv = toile(cote, PAPIER)
  dessinerMarque(cv, ENCRE, 0.84)
  return encoderPng(cote, cote, cv.rendre())
}

// ── Sortie ───────────────────────────────────────────────────────────────────

export const ICONES = [
  ['myko-192.png', () => iconeClaire(192, 0.90)],
  ['myko-512.png', () => iconeClaire(512, 0.90)],
  ['myko-maskable-192.png', () => iconeMaskable(192)],
  ['myko-maskable-512.png', () => iconeMaskable(512)],
  ['apple-touch-icon-180.png', () => iconeApple(180)],
]

export function construireIcones() {
  return ICONES.map(([nom, fabriquer]) => [nom, fabriquer()])
}

function principal() {
  const controle = process.argv.includes('--check')
  mkdirSync(DOSSIER, { recursive: true })

  const ecarts = []
  for (const [nom, octets] of construireIcones()) {
    const chemin = join(DOSSIER, nom)
    if (controle) {
      if (!existsSync(chemin)) ecarts.push(`${nom} : absent`)
      else if (!readFileSync(chemin).equals(octets)) ecarts.push(`${nom} : diffère du dessin décrit par ce script`)
    } else {
      writeFileSync(chemin, octets)
      console.log(`${nom} · ${octets.length} octets`)
    }
  }

  if (controle) {
    if (ecarts.length > 0) {
      console.error(`Icônes hors contrat :\n  ${ecarts.join('\n  ')}`)
      process.exit(1)
    }
    console.log(`${ICONES.length} icônes conformes.`)
  }
}

if (process.argv[1] && process.argv[1].endsWith('build-icons.mjs')) principal()
