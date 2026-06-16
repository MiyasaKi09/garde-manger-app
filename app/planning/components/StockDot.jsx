// StockDot.jsx
// Pastille de couverture stock d'un repas.
// Glyphe + aria-label + title : jamais la couleur seule (accessibilité WCAG 1.4.1).
// "use client" non requis : pas de hooks, pas d'events navigateur.
import './StockDot.css'

/**
 * @param {object} props
 * @param {'full'|'partial'|'none'|'unknown'} props.status
 * @param {number}   [props.have]    nb d'ingrédients en stock
 * @param {number}   [props.need]    nb d'ingrédients nécessaires
 * @param {string[]} [props.missing] noms des ingrédients manquants
 * @param {boolean}  [props.faded]   affichage pâle (repas déjà cuisiné)
 */
export default function StockDot({ status, have, need, missing = [], faded = false }) {
  if (!status) return null

  const GLYPHS = {
    full:    '✓',
    partial: '~',
    none:    '✕',
    unknown: '?',
  }

  const LABELS = {
    full:    'Tout en stock',
    partial: need != null ? `Partiellement en stock (${have}/${need})` : 'Partiellement en stock',
    none:    'Rien en stock',
    unknown: 'Recette non détaillée',
  }

  function buildTitle() {
    switch (status) {
      case 'full':
        return 'Tout en stock'
      case 'partial': {
        const base = need != null ? `${have}/${need} ingrédients en stock` : 'Partiellement en stock'
        return missing.length
          ? `${base} · manque : ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`
          : base
      }
      case 'none':
        return missing.length
          ? `Rien en stock · manque : ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`
          : 'Rien en stock'
      case 'unknown':
        return 'Recette non détaillée'
      default:
        return ''
    }
  }

  const glyph = GLYPHS[status] ?? '?'
  const ariaLabel = LABELS[status] ?? status
  const title = buildTitle()

  return (
    <span
      className={`sd-dot${faded ? ' sd-faded' : ''}`}
      data-status={status}
      aria-label={ariaLabel}
      title={title}
      role="img"
    >
      <span className="sd-pip" aria-hidden="true" />
      <span className="sd-glyph" aria-hidden="true">{glyph}</span>
      {status === 'partial' && have != null && need != null && (
        <span className="sd-frac" aria-hidden="true">{have}/{need}</span>
      )}
    </span>
  )
}
