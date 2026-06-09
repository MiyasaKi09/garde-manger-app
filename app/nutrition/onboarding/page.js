'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authFetch } from '@/lib/authFetch'
import { calculateFullProfile, ACTIVITY_LABELS } from '@/lib/nutritionCalculator'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { toast } from '@/components/Toast'
import './onboarding.css'

const STEPS = [
  { id: 'person', title: 'Qui es-tu ?' },
  { id: 'goal', title: 'Ton objectif' },
  { id: 'activity', title: 'Ton activité' },
  { id: 'result', title: 'Tes besoins' },
]

const DEFAULT_PROFILE = {
  person_name: '',
  age: '',
  sex: 'M',
  height_cm: '',
  current_weight_kg: '',
  target_weight_kg: '',
  weight_loss_rate: 0.5,
  activity_level: 'moderate',
}

export default function NutritionOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [profiles, setProfiles] = useState([
    { ...DEFAULT_PROFILE, person_name: 'Julien' },
    { ...DEFAULT_PROFILE, person_name: 'Zoé', sex: 'F' },
  ])
  const [currentPerson, setCurrentPerson] = useState(0)
  const [results, setResults] = useState([])
  const [saving, setSaving] = useState(false)

  const profile = profiles[currentPerson]
  const updateProfile = (updates) => {
    setProfiles(prev => prev.map((p, i) => i === currentPerson ? { ...p, ...updates } : p))
  }

  const canProceed = () => {
    if (step === 0) return profile.age && profile.height_cm && profile.current_weight_kg
    if (step === 1) return profile.target_weight_kg
    if (step === 2) return profile.activity_level
    return true
  }

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1)
    } else if (step === 2) {
      // Calculate results for all profiles
      const res = profiles.map(p => ({
        ...p,
        ...calculateFullProfile({
          weight_kg: parseFloat(p.current_weight_kg),
          height_cm: parseFloat(p.height_cm),
          age: parseInt(p.age),
          sex: p.sex,
          activityLevel: p.activity_level,
          weightLossRate: parseFloat(p.weight_loss_rate),
          targetWeight: parseFloat(p.target_weight_kg),
        }),
      }))
      setResults(res)
      setStep(3)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const goalsPayload = results.map(r => ({
        person_name: r.person_name,
        target_calories: r.target_calories,
        target_protein_g: r.target_protein_g,
        target_fat_g: r.target_fat_g,
        target_carbs_g: r.target_carbs_g,
        target_fiber_g: r.target_fiber_g,
        target_weight_kg: parseFloat(r.target_weight_kg) || null,
        age: parseInt(r.age) || null,
        sex: r.sex || null,
        height_cm: parseFloat(r.height_cm) || null,
        current_weight_kg: parseFloat(r.current_weight_kg) || null,
        activity_level: r.activity_level || null,
        weight_loss_rate: parseFloat(r.weight_loss_rate) || null,
        bmr: r.bmr || null,
        tdee: r.tdee || null,
      }))

      const res = await authFetch('/api/nutrition/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals: goalsPayload }),
      })
      if (!res.ok) throw new Error('Erreur sauvegarde')
      router.push('/nutrition')
    } catch (err) {
      console.error('Save error:', err)
      toast.error('Erreur lors de la sauvegarde du profil')
    } finally {
      setSaving(false)
    }
  }

  const setResultField = (i, field, value) => {
    const v = parseInt(value) || 0
    setResults(prev => prev.map((p, j) => j === i ? { ...p, [field]: v } : p))
  }

  return (
    <div className="v21-page narrow onb-page">

      {/* HERO ÉDITORIAL */}
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Nutrition</span>
          <h1 className="v21-title">Objectifs.</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Quelques mesures pour calibrer tes besoins.</p>
        </div>
      </header>

      {/* PROGRESSION — étapes à filets */}
      <ol className="onb-steps">
        {STEPS.map((s, i) => (
          <li key={s.id} className={`onb-step ${i < step ? 'done' : ''} ${i === step ? 'on' : ''}`}>
            <span className="onb-step-n">{i < step ? <Check size={13} /> : String(i + 1).padStart(2, '0')}</span>
            <span className="onb-step-t">{s.title}</span>
          </li>
        ))}
      </ol>

      {/* SÉLECTEUR DE PERSONNE (étapes 0–2) */}
      {step < 3 && profiles.length > 1 && (
        <div className="onb-persons" role="tablist" aria-label="Choisir la personne">
          {profiles.map((p, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={currentPerson === i}
              onClick={() => setCurrentPerson(i)}
              className={`onb-person ${currentPerson === i ? 'on' : ''}`}
            >
              {p.person_name || `Personne ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* ÉTAPE 0 — infos de base */}
      {step === 0 && (
        <section className="onb-card">
          <h2 className="onb-card-title">Informations de base — {profile.person_name}</h2>

          <div className="onb-field">
            <label className="onb-label">Nom</label>
            <input className="onb-input" value={profile.person_name} onChange={e => updateProfile({ person_name: e.target.value })} />
          </div>

          <div className="onb-row">
            <div className="onb-field">
              <label className="onb-label">Âge</label>
              <input className="onb-input" type="number" value={profile.age} onChange={e => updateProfile({ age: e.target.value })} placeholder="30" />
            </div>
            <div className="onb-field">
              <label className="onb-label">Sexe</label>
              <div className="onb-seg">
                {['M', 'F'].map(s => (
                  <button key={s} onClick={() => updateProfile({ sex: s })} className={`onb-seg-b ${profile.sex === s ? 'on' : ''}`}>
                    {s === 'M' ? 'Homme' : 'Femme'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="onb-row">
            <div className="onb-field">
              <label className="onb-label">Taille (cm)</label>
              <input className="onb-input" type="number" value={profile.height_cm} onChange={e => updateProfile({ height_cm: e.target.value })} placeholder="175" />
            </div>
            <div className="onb-field">
              <label className="onb-label">Poids actuel (kg)</label>
              <input className="onb-input" type="number" step="0.1" value={profile.current_weight_kg} onChange={e => updateProfile({ current_weight_kg: e.target.value })} placeholder="75" />
            </div>
          </div>
        </section>
      )}

      {/* ÉTAPE 1 — objectif */}
      {step === 1 && (
        <section className="onb-card">
          <h2 className="onb-card-title">Objectif de poids — {profile.person_name}</h2>

          <div className="onb-field">
            <label className="onb-label">Poids cible (kg)</label>
            <input className="onb-input" type="number" step="0.1" value={profile.target_weight_kg} onChange={e => updateProfile({ target_weight_kg: e.target.value })} placeholder="70" />
          </div>

          <div className="onb-field">
            <label className="onb-label">Rythme souhaité (kg/semaine)</label>
            <div className="onb-rates">
              {[0.25, 0.5, 0.75, 1].map(rate => (
                <button
                  key={rate}
                  onClick={() => updateProfile({ weight_loss_rate: rate })}
                  className={`onb-rate ${profile.weight_loss_rate === rate ? 'on' : ''}`}
                >
                  <span className="onb-rate-v">{rate}</span>
                  <span className="onb-rate-u">kg/sem</span>
                </button>
              ))}
            </div>
            <p className="onb-hint">
              {profile.weight_loss_rate <= 0.25 ? 'Très progressif, facile à maintenir' :
               profile.weight_loss_rate <= 0.5 ? 'Recommandé — équilibré et durable' :
               profile.weight_loss_rate <= 0.75 ? 'Ambitieux mais faisable' :
               'Agressif — nécessite de la rigueur'}
            </p>
          </div>
        </section>
      )}

      {/* ÉTAPE 2 — activité */}
      {step === 2 && (
        <section className="onb-card">
          <h2 className="onb-card-title">Niveau d'activité — {profile.person_name}</h2>
          <div className="onb-activities">
            {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => updateProfile({ activity_level: key })}
                className={`onb-activity ${profile.activity_level === key ? 'on' : ''}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ÉTAPE 3 — résultats éditables */}
      {step === 3 && (
        <div className="onb-results">
          <p className="onb-results-note">
            Valeurs calculées — ajuste-les si ton nutritionniste recommande d'autres cibles.
          </p>
          {results.map((r, i) => (
            <section key={i} className="onb-card">
              <h2 className="onb-card-title">{r.person_name}</h2>

              <div className="onb-macros">
                <div className="onb-macro">
                  <div className="onb-macro-in">
                    <input type="number" value={r.target_calories} onChange={e => setResultField(i, 'target_calories', e.target.value)} className="onb-macro-input" />
                  </div>
                  <span className="onb-macro-l">kcal / jour</span>
                </div>
                <div className="onb-macro">
                  <div className="onb-macro-in">
                    <input type="number" value={r.target_protein_g} onChange={e => setResultField(i, 'target_protein_g', e.target.value)} className="onb-macro-input" />
                    <span className="onb-macro-u">g</span>
                  </div>
                  <span className="onb-macro-l">Protéines</span>
                </div>
                <div className="onb-macro">
                  <div className="onb-macro-in">
                    <input type="number" value={r.target_carbs_g} onChange={e => setResultField(i, 'target_carbs_g', e.target.value)} className="onb-macro-input" />
                    <span className="onb-macro-u">g</span>
                  </div>
                  <span className="onb-macro-l">Glucides</span>
                </div>
                <div className="onb-macro">
                  <div className="onb-macro-in">
                    <input type="number" value={r.target_fat_g} onChange={e => setResultField(i, 'target_fat_g', e.target.value)} className="onb-macro-input" />
                    <span className="onb-macro-u">g</span>
                  </div>
                  <span className="onb-macro-l">Lipides</span>
                </div>
              </div>

              <div className="onb-meta">
                <span>BMR · {r.bmr} kcal</span>
                <span>TDEE · {r.tdee} kcal</span>
                {r.weeks_to_goal && <span>~{r.weeks_to_goal} sem.</span>}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* NAVIGATION */}
      <div className="onb-nav">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="v21-btn ghost">
            <ArrowLeft size={15} /> Retour
          </button>
        )}
        <div className="onb-nav-spacer" />
        {step < 3 ? (
          <button onClick={handleNext} disabled={!canProceed()} className="v21-btn" style={{ opacity: canProceed() ? 1 : 0.4 }}>
            Suivant <ArrowRight size={15} />
          </button>
        ) : (
          <button onClick={handleSave} disabled={saving} className="v21-btn terra">
            {saving ? 'Sauvegarde…' : 'Enregistrer mes objectifs'}
          </button>
        )}
      </div>
    </div>
  )
}
