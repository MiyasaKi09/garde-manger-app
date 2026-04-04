'use client'

import { glassBase } from './glass'

/**
 * Carte avec effet glass-morphism réutilisable.
 * Remplace les `style={{ ...glassBase }}` inline à travers l'app.
 */
export default function GlassCard({ children, style, className, padding = 20, radius = 16, onClick, ...props }) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        ...glassBase,
        borderRadius: radius,
        padding,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
