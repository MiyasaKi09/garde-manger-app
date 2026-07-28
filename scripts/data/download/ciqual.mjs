/**
 * Fabrique V2 — téléchargement Ciqual (étape Download + checksum).
 * Réf. MYKO_DATA_FOUNDATION_V2 §5.3-5.4. Écrit dans .data-cache (gitignoré) et
 * imprime la fiche blob (sha256/octets) à enregistrer dans source_raw.import_blobs.
 *
 * Usage : node scripts/data/download/ciqual.mjs
 */
import { createHash } from 'node:crypto'
import { writeFileSync, mkdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const URL =
  'https://entrepot.recherche.data.gouv.fr/api/access/datafile/:persistentId?persistentId=doi:10.57745/RPWYZD'
const VERSION = '1.0'
const EXPECTED_SHA256 = '5555c572fa3735991298d832d0427788fa69a11b4fd20a5d580d58942369fbb0'
const CACHE = join(__dirname, '..', '..', '..', '.data-cache')
const OUT = join(CACHE, 'ciqual_2025_v1.0.xlsx')

async function main() {
  mkdirSync(CACHE, { recursive: true })
  const res = await fetch(URL)
  if (!res.ok) throw new Error(`Téléchargement Ciqual échoué : HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const sha256 = createHash('sha256').update(buf).digest('hex')
  if (sha256 !== EXPECTED_SHA256) {
    throw new Error(`Empreinte Ciqual 2025 inattendue : ${sha256}`)
  }
  writeFileSync(OUT, buf)
  console.log(JSON.stringify({
    source_dataset: 'ciqual_2025',
    source_version: VERSION,
    object_path: OUT,
    sha256,
    byte_size: statSync(OUT).size,
    mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    download_url: URL,
  }, null, 2))
}

main().catch((e) => { console.error(e.message); process.exit(1) })
