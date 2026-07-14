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
  'https://ciqual.anses.fr/cms/sites/default/files/inline-files/Table%20Ciqual%202020_FR_2020%2007%2007.xls'
const VERSION = '2020-07-07'
const CACHE = join(__dirname, '..', '..', '..', '.data-cache')
const OUT = join(CACHE, 'ciqual_2020.xls')

async function main() {
  mkdirSync(CACHE, { recursive: true })
  const res = await fetch(URL)
  if (!res.ok) throw new Error(`Téléchargement Ciqual échoué : HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(OUT, buf)
  const sha256 = createHash('sha256').update(buf).digest('hex')
  console.log(JSON.stringify({
    source_dataset: 'ciqual_2020',
    source_version: VERSION,
    object_path: OUT,
    sha256,
    byte_size: statSync(OUT).size,
    mime_type: 'application/vnd.ms-excel',
    download_url: URL,
  }, null, 2))
}

main().catch((e) => { console.error(e.message); process.exit(1) })
