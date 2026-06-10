'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { toast } from '@/components/Toast'

/**
 * Sécurité du compte :
 * - définir / changer le mot de passe (indispensable si le compte a été créé
 *   par magic link : il n'a alors AUCUN mot de passe) ;
 * - déconnecter tous les appareils (révoque tous les refresh tokens).
 * La déconnexion du header, elle, ne touche que l'appareil courant.
 */
export default function SecuritySettings() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [signingOutAll, setSigningOutAll] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    if (password.length < 8) { toast.error('8 caractères minimum'); return }
    if (password !== confirm) { toast.error('Les deux mots de passe ne correspondent pas'); return }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) toast.error(error.message)
      else {
        toast.success('Mot de passe enregistré — utilisable sur tous vos appareils')
        setPassword(''); setConfirm('')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSignOutEverywhere = async () => {
    setSigningOutAll(true)
    try {
      await supabase.auth.signOut({ scope: 'global' })
      router.push('/login')
      router.refresh()
    } finally {
      setSigningOutAll(false)
    }
  }

  return (
    <div className="v21-page narrow">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Paramètres</span>
          <h1 className="v21-title">Sécurité</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Mot de passe du compte et sessions des appareils.</p>
        </div>
      </header>

      <section className="v21-section flush">
        <div className="v21-bh"><span className="v21-bl">Mot de passe</span></div>
        <form onSubmit={handleSave} className="v21-form">
          <label className="v21-field">
            <span className="v21-field-l">Nouveau mot de passe (8+ caractères)</span>
            <input
              className="v21-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <label className="v21-field">
            <span className="v21-field-l">Confirmer</span>
            <input
              className="v21-input"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <div className="v21-form-actions">
            <button type="submit" className="v21-btn" disabled={saving}>
              {saving ? '…' : 'Enregistrer le mot de passe'}
            </button>
          </div>
        </form>
        <p className="v21-next">
          Une fois défini, connectez-vous depuis n&apos;importe quel appareil avec email + mot de passe.
          Chaque appareil garde ensuite sa session automatiquement.
        </p>
      </section>

      <section className="v21-section flush">
        <div className="v21-bh"><span className="v21-bl">Sessions</span></div>
        <p className="v21-lede" style={{ marginBottom: 10 }}>
          Le bouton de déconnexion du menu ne déconnecte que cet appareil.
          En cas de doute (appareil perdu, partagé…) :
        </p>
        <button type="button" className="v21-btn ghost" onClick={handleSignOutEverywhere} disabled={signingOutAll}>
          {signingOutAll ? '…' : 'Déconnecter tous les appareils'}
        </button>
      </section>
    </div>
  )
}
