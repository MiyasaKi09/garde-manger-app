/** Split generated DO-block loaders into connector-sized deterministic chunks. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, join, basename } from 'node:path'

const [, , inputArg, outputArg, tagArg, blocksArg = '4'] = process.argv
if (!inputArg || !outputArg || !tagArg) {
  throw new Error('usage: node split-sql-publish.mjs <input.sql> <output-dir> <tag> [blocks-per-chunk]')
}

const input = resolve(inputArg)
const output = resolve(outputArg)
const blocksPerChunk = Math.max(1, Number.parseInt(blocksArg, 10) || 1)
const sql = readFileSync(input, 'utf8')
const escapedTag = tagArg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const pattern = new RegExp(`DO \\$${escapedTag}\\$[\\s\\S]*?\\n\\$${escapedTag}\\$;`, 'g')
const blocks = [...sql.matchAll(pattern)]
if (!blocks.length) throw new Error(`no DO $${tagArg}$ blocks found in ${input}`)

const prelude = sql.slice(0, blocks[0].index).trimEnd()
mkdirSync(output, { recursive: true })
writeFileSync(join(output, '000-setup.sql'), `${prelude}\n`)

const files = ['000-setup.sql']
for (let index = 0; index < blocks.length; index += blocksPerChunk) {
  const name = `${String(files.length).padStart(3, '0')}-${tagArg}-${Math.floor(index / blocksPerChunk) + 1}.sql`
  writeFileSync(join(output, name), `${blocks.slice(index, index + blocksPerChunk).map((match) => match[0]).join('\n\n')}\n`)
  files.push(name)
}

const manifest = {
  source: basename(input),
  tag: tagArg,
  blockCount: blocks.length,
  blocksPerChunk,
  files,
}
writeFileSync(join(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(JSON.stringify(manifest))
