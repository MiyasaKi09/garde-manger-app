'use client'

import { Check, AlertTriangle, ShoppingCart } from 'lucide-react'
import './StockBadge.css'

/**
 * StockBadge — Indicateur visuel de disponibilité en stock pour un ingrédient.
 *
 * Props :
 *   hasEnough      {boolean}          – quantité suffisante en stock
 *   inStock        {boolean}          – présent en stock (même si quantité insuffisante)
 *   loading        {boolean}          – état de chargement (affiche un placeholder)
 *   title          {string}           – tooltip personnalisé (optionnel)
 *   variant        {'dot'|'chip'}     – 'dot' = pastille seule, 'chip' = pastille + label
 */
export default function StockBadge({ hasEnough, inStock, loading = false, title, variant = 'dot' }) {
  if (loading) {
    return <span className="sb-placeholder" aria-hidden="true" />
  }

  let status, defaultTitle, icon

  if (hasEnough) {
    status = 'ok'
    defaultTitle = 'En stock'
    icon = <Check size={9} strokeWidth={3} />
  } else if (inStock) {
    status = 'partial'
    defaultTitle = 'Stock insuffisant'
    icon = <AlertTriangle size={9} strokeWidth={2.5} />
  } else {
    status = 'missing'
    defaultTitle = 'À acheter'
    icon = <ShoppingCart size={9} strokeWidth={2} />
  }

  const label = title || defaultTitle

  if (variant === 'chip') {
    return (
      <span className={`sb-chip sb-${status}`} title={label} aria-label={label}>
        {icon}
        <span className="sb-chip-label">{label}</span>
      </span>
    )
  }

  return (
    <span className={`sb-dot sb-${status}`} title={label} aria-label={label}>
      {icon}
    </span>
  )
}
