import manifest from '@/data/encyclopedia/manifest.json'
import index from '@/data/encyclopedia/index.json'
import { buildEncyclopediaView } from '@/lib/domain/encyclopedia/catalog'
import EncyclopediaExplorer from './EncyclopediaExplorer'
import './encyclopedie.css'

export const metadata = {
  title: 'Encyclopédie culinaire — Myko',
  description: 'Les 48 volumes et 282 livres qui structurent le corpus culinaire Myko.',
}

export default function EncyclopediaPage() {
  const initialView = buildEncyclopediaView(manifest, index)
  return <EncyclopediaExplorer initialView={initialView} />
}
