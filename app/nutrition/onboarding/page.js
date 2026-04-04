'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import GlassCard from '@/components/ui/GlassCard'
import { calculateFullProfile, ACTIVITY_LABELS } from '@/lib/nutritionCalculator'
import { ArrowLeft, ArrowRight, Check, User, Target, Activity, Utensils } from 'lucide-react'

const STEPS = [
  { id: 'person', title: 'Qui es-tu ?', icon: User },
  { id: 'goal', title: 'Ton objectif', icon: Target },
  { id: 'activity', title: 'Ton activité', icon: Activity },
  { id: 'result', title: 'Tes besoins', icon: Utensils },
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      // Delete existing goals for this user, then insert fresh
      await supabase
        .from('user_health_goals')
        .delete()
        .eq('user_id', user.id)

      for (const r of results) {
        const { error } = await supabase
          .from('user_health_goals')
          .insert({
            user_id: user.id,
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
          })

        if (error) console.error(`Error saving ${r.person_name}:`, error)
      }

      router.push('/nutrition')
    } catch (err) {
      console.error('Save error:', err)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Progress */}
      <div style={styles.progress}>
        {STEPS.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.id} style={{
              ...styles.progressStep,
              opacity: i <= step ? 1 : 0.3,
            }}>
              <div style={{
                ...styles.progressDot,
                background: i < step ? '#16a34a' : i === step ? 'white' : 'rgba(255,255,255,0.2)',
                color: i < step ? 'white' : i === step ? '#16a34a' : '#9ca3af',
              }}>
                {i < step ? <Check size={14} /> : <Icon size={14} />}
              </div>
              <span style={styles.progressLabel}>{s.title}</span>
            </div>
          )
        })}
      </div>

      {/* Person selector (for steps 0-2) */}
      {step < 3 && profiles.length > 1 && (
        <div style={styles.personTabs}>
          {profiles.map((p, i) => (
            <button
              key={i}
              onClick={() => setCurrentPerson(i)}
              style={{
                ...styles.personTab,
                ...(currentPerson === i ? styles.personTabActive : {}),
              }}
            >
              {p.person_name || `Personne ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Step 0: Basic info */}
      {step === 0 && (
        <GlassCard padding={24} radius={16}>
          <h2 style={styles.stepTitle}>Informations de base — {profile.person_name}</h2>

          <div style={styles.field}>
            <label style={styles.label}>Nom</label>
            <input value={profile.person_name} onChange={e => updateProfile({ person_name: e.target.value })} style={styles.input} />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Âge</label>
              <input type="number" value={profile.age} onChange={e => updateProfile({ age: e.target.value })} style={styles.input} placeholder="30" />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Sexe</label>
              <div style={styles.sexToggle}>
                {['M', 'F'].map(s => (
                  <button key={s} onClick={() => updateProfile({ sex: s })} style={{
                    ...styles.sexBtn,
                    ...(profile.sex === s ? styles.sexBtnActive : {}),
                  }}>
                    {s === 'M' ? 'Homme' : 'Femme'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Taille (cm)</label>
              <input type="number" value={profile.height_cm} onChange={e => updateProfile({ height_cm: e.target.value })} style={styles.input} placeholder="175" />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Poids actuel (kg)</label>
              <input type="number" step="0.1" value={profile.current_weight_kg} onChange={e => updateProfile({ current_weight_kg: e.target.value })} style={styles.input} placeholder="75" />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Step 1: Goal */}
      {step === 1 && (
        <GlassCard padding={24} radius={16}>
          <h2 style={styles.stepTitle}>Objectif de poids — {profile.person_name}</h2>

          <div style={styles.field}>
            <label style={styles.label}>Poids cible (kg)</label>
            <input type="number" step="0.1" value={profile.target_weight_kg} onChange={e => updateProfile({ target_weight_kg: e.target.value })} style={styles.input} placeholder="70" />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Rythme souhaité (kg/semaine)</label>
            <div style={styles.rateOptions}>
              {[0.25, 0.5, 0.75, 1].map(rate => (
                <button
                  key={rate}
                  onClick={() => updateProfile({ weight_loss_rate: rate })}
                  style={{
                    ...styles.rateBtn,
                    ...(profile.weight_loss_rate === rate ? styles.rateBtnActive : {}),
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{rate}</span>
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>kg/sem</span>
                </button>
              ))}
            </div>
            <p style={styles.hint}>
              {profile.weight_loss_rate <= 0.25 ? 'Très progressif, facile à maintenir' :
               profile.weight_loss_rate <= 0.5 ? 'Recommandé — équilibré et durable' :
               profile.weight_loss_rate <= 0.75 ? 'Ambitieux mais faisable' :
               'Agressif — nécessite de la rigueur'}
            </p>
          </div>
        </GlassCard>
      )}

      {/* Step 2: Activity */}
      {step === 2 && (
        <GlassCard padding={24} radius={16}>
          <h2 style={styles.stepTitle}>Niveau d'activité — {profile.person_name}</h2>

          <div style={styles.activityList}>
            {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
              <button
                key={key}
                onClick={() => updateProfile({ activity_level: key })}
                style={{
                  ...styles.activityBtn,
                  ...(profile.activity_level === key ? styles.activityBtnActive : {}),
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Step 3: Results — EDITABLE */}
      {step === 3 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', margin: 0 }}>
            Valeurs calculées — ajuste-les si ton nutritionniste recommande d'autres cibles.
          </p>
          {results.map((r, i) => (
            <GlassCard key={i} padding={24} radius={16}>
              <h2 style={styles.stepTitle}>{r.person_name}</h2>

              <div style={styles.resultGrid}>
                <div style={styles.resultCard}>
                  <input
                    type="number"
                    value={r.target_calories}
                    onChange={e => {
                      const v = parseInt(e.target.value) || 0
                      setResults(prev => prev.map((p, j) => j === i ? { ...p, target_calories: v } : p))
                    }}
                    style={styles.resultInput}
                  />
                  <span style={styles.resultLabel}>kcal/jour</span>
                </div>
                <div style={styles.resultCard}>
                  <div style={styles.resultInputRow}>
                    <input
                      type="number"
                      value={r.target_protein_g}
                      onChange={e => {
                        const v = parseInt(e.target.value) || 0
                        setResults(prev => prev.map((p, j) => j === i ? { ...p, target_protein_g: v } : p))
                      }}
                      style={styles.resultInput}
                    />
                    <span style={styles.resultUnit}>g</span>
                  </div>
                  <span style={styles.resultLabel}>Protéines</span>
                </div>
                <div style={styles.resultCard}>
                  <div style={styles.resultInputRow}>
                    <input
                      type="number"
                      value={r.target_carbs_g}
                      onChange={e => {
                        const v = parseInt(e.target.value) || 0
                        setResults(prev => prev.map((p, j) => j === i ? { ...p, target_carbs_g: v } : p))
                      }}
                      style={styles.resultInput}
                    />
                    <span style={styles.resultUnit}>g</span>
                  </div>
                  <span style={styles.resultLabel}>Glucides</span>
                </div>
                <div style={styles.resultCard}>
                  <div style={styles.resultInputRow}>
                    <input
                      type="number"
                      value={r.target_fat_g}
                      onChange={e => {
                        const v = parseInt(e.target.value) || 0
                        setResults(prev => prev.map((p, j) => j === i ? { ...p, target_fat_g: v } : p))
                      }}
                      style={styles.resultInput}
                    />
                    <span style={styles.resultUnit}>g</span>
                  </div>
                  <span style={styles.resultLabel}>Lipides</span>
                </div>
              </div>

              <div style={styles.metaRow}>
                <span>BMR : {r.bmr} kcal</span>
                <span>TDEE : {r.tdee} kcal</span>
                {r.weeks_to_goal && <span>~{r.weeks_to_goal} sem.</span>}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div style={styles.navRow}>
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} style={styles.backBtn}>
            <ArrowLeft size={16} /> Retour
          </button>
        )}
        <div style={{ flex: 1 }} />
        {step < 3 ? (
          <button onClick={handleNext} disabled={!canProceed()} style={{ ...styles.nextBtn, opacity: canProceed() ? 1 : 0.4 }}>
            Suivant <ArrowRight size={16} />
          </button>
        ) : (
          <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
            {saving ? 'Sauvegarde...' : 'Enregistrer mes objectifs'}
          </button>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { padding: 20, maxWidth: 520, margin: '0 auto' },
  progress: { display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 24 },
  progressStep: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'opacity 0.2s' },
  progressDot: { width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(22,163,74,0.3)' },
  progressLabel: { fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 },
  personTabs: { display: 'flex', gap: 4, marginBottom: 16, padding: 3, background: 'rgba(0,0,0,0.04)', borderRadius: 10 },
  personTab: { flex: 1, padding: '8px 16px', border: 'none', borderRadius: 8, background: 'transparent', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', color: '#6b7280' },
  personTabActive: { background: 'white', color: '#16a34a', fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  stepTitle: { fontSize: 18, fontWeight: 600, marginBottom: 20, color: 'var(--ink, #1f281f)' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 6 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, fontSize: 15, fontFamily: 'inherit', background: 'rgba(255,255,255,0.6)', color: '#1f2937', boxSizing: 'border-box' },
  row: { display: 'flex', gap: 12 },
  sexToggle: { display: 'flex', gap: 4, padding: 3, background: 'rgba(0,0,0,0.04)', borderRadius: 10 },
  sexBtn: { flex: 1, padding: '8px', border: 'none', borderRadius: 8, background: 'transparent', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#6b7280' },
  sexBtnActive: { background: 'white', color: '#16a34a', fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  rateOptions: { display: 'flex', gap: 8 },
  rateBtn: { flex: 1, padding: '12px 8px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, background: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, fontSize: 16, color: '#374151' },
  rateBtnActive: { borderColor: '#16a34a', background: 'rgba(22,163,74,0.08)', color: '#16a34a' },
  hint: { fontSize: 12, color: '#9ca3af', marginTop: 8, fontStyle: 'italic' },
  activityList: { display: 'flex', flexDirection: 'column', gap: 8 },
  activityBtn: { padding: '14px 16px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, background: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, textAlign: 'left', color: '#374151', transition: 'all 0.15s' },
  activityBtnActive: { borderColor: '#16a34a', background: 'rgba(22,163,74,0.08)', color: '#16a34a', fontWeight: 600 },
  resultGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 },
  resultCard: { padding: 16, background: 'rgba(22,163,74,0.06)', borderRadius: 12, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 },
  resultValue: { fontSize: 24, fontWeight: 700, color: '#16a34a' },
  resultInput: { width: '100%', border: 'none', background: 'transparent', fontSize: 24, fontWeight: 700, color: '#16a34a', textAlign: 'center', fontFamily: 'inherit', outline: 'none', padding: 0 },
  resultInputRow: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2 },
  resultUnit: { fontSize: 16, fontWeight: 600, color: '#16a34a', opacity: 0.7 },
  resultLabel: { fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' },
  metaRow: { display: 'flex', gap: 16, fontSize: 12, color: '#9ca3af', flexWrap: 'wrap' },
  navRow: { display: 'flex', gap: 8, marginTop: 20 },
  backBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, background: 'transparent', color: '#6b7280', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  nextBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '12px 24px', border: 'none', borderRadius: 10, background: '#16a34a', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  saveBtn: { padding: '14px 28px', border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #16a34a, #059669)', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(22,163,74,0.3)' },
}
