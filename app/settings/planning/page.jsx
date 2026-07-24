'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calculator,
  Check,
  Plus,
  RefreshCw,
  ShieldBan,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import { authFetch } from '@/lib/authFetch'
import { calculateFullProfile, ACTIVITY_LABELS } from '@/lib/nutritionCalculator'
import { toast } from '@/components/Toast'

const RATE_OPTIONS = [0, 0.25, 0.5, 0.75, 1]
const TARGET_FIELDS = [
  ['target_calories', 'Énergie', 'kcal/j'],
  ['target_protein_g', 'Protéines', 'g/j'],
  ['target_carbs_g', 'Glucides', 'g/j'],
  ['target_fat_g', 'Lipides', 'g/j'],
  ['target_fiber_g', 'Fibres', 'g/j'],
]

const lower = (value) => String(value || '').trim().toLocaleLowerCase('fr-FR')
const numberOrBlank = (value) => value == null ? '' : Number(value)

function profileFrom(member, goal) {
  const planning = member.preferences?.planning || {}
  return {
    id: member.id,
    name: member.name,
    preferences: member.preferences || {},
    planning: {
      breakfast: Boolean(planning.breakfast),
      snack: Boolean(planning.snack),
      vegetarian_meat_swaps_per_week: Number(planning.vegetarian_meat_swaps_per_week) || 0,
    },
    age: numberOrBlank(goal?.age),
    sex: goal?.sex || 'M',
    height_cm: numberOrBlank(goal?.height_cm),
    current_weight_kg: numberOrBlank(goal?.current_weight_kg),
    target_weight_kg: numberOrBlank(goal?.target_weight_kg),
    activity_level: goal?.activity_level || 'moderate',
    weight_loss_rate: numberOrBlank(goal?.weight_loss_rate) || 0,
    bmr: numberOrBlank(goal?.bmr),
    tdee: numberOrBlank(goal?.tdee),
    target_calories: numberOrBlank(goal?.target_calories),
    target_protein_g: numberOrBlank(goal?.target_protein_g),
    target_carbs_g: numberOrBlank(goal?.target_carbs_g),
    target_fat_g: numberOrBlank(goal?.target_fat_g),
    target_fiber_g: numberOrBlank(goal?.target_fiber_g),
    target_source: goal?.target_source || null,
    calculation_source: goal?.target_source === 'manual' ? 'manual' : 'questionnaire',
  }
}

export default function PlanningSettingsPage() {
  const router = useRouter()
  const [profiles, setProfiles] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [foodPreferences, setFoodPreferences] = useState([])
  const [newFood, setNewFood] = useState('')
  const [newFoodKind, setNewFoodKind] = useState('ban')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [foodSaving, setFoodSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [membersResponse, goalsResponse, foodsResponse] = await Promise.all([
        authFetch('/api/household/members'),
        authFetch('/api/nutrition/goals'),
        authFetch('/api/settings/food-bans'),
      ])
      const [membersPayload, goalsPayload, foodsPayload] = await Promise.all([
        membersResponse.json().catch(() => ({})),
        goalsResponse.json().catch(() => ({})),
        foodsResponse.json().catch(() => ({})),
      ])
      if (!membersResponse.ok) throw new Error(membersPayload.error || 'Foyer indisponible')
      if (!goalsResponse.ok) throw new Error(goalsPayload.error || 'Objectifs indisponibles')
      if (!foodsResponse.ok) throw new Error(foodsPayload.error || 'Interdits indisponibles')

      const goals = goalsPayload.goals || []
      const nextProfiles = (membersPayload.members || [])
        .filter((member) => member.active !== false)
        .map((member) => profileFrom(member, goals.find((goal) => goal.household_member_id === member.id)
          || goals.find((goal) => lower(goal.person_name) === lower(member.name))))
      setProfiles(nextProfiles)
      setSelectedId((current) => nextProfiles.some((profile) => profile.id === current) ? current : nextProfiles[0]?.id || '')
      setFoodPreferences(foodsPayload.items || [])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const selectedIndex = useMemo(() => profiles.findIndex((profile) => profile.id === selectedId), [profiles, selectedId])
  const selected = selectedIndex >= 0 ? profiles[selectedIndex] : null

  function patchSelected(patch) {
    if (selectedIndex < 0) return
    setProfiles((current) => current.map((profile, index) => index === selectedIndex ? { ...profile, ...patch } : profile))
    setSavedAt(null)
  }

  function patchPlanning(patch) {
    if (!selected) return
    patchSelected({ planning: { ...selected.planning, ...patch } })
  }

  function calculateTargets() {
    if (!selected) return
    const required = [selected.age, selected.height_cm, selected.current_weight_kg, selected.target_weight_kg]
    if (required.some((value) => value === '' || Number(value) <= 0)) {
      toast.error('Renseigne âge, taille, poids actuel et poids cible')
      return
    }
    const result = calculateFullProfile({
      weight_kg: selected.current_weight_kg,
      height_cm: selected.height_cm,
      age: selected.age,
      sex: selected.sex,
      activityLevel: selected.activity_level,
      weightLossRate: selected.weight_loss_rate,
      targetWeight: selected.target_weight_kg,
    })
    patchSelected({ ...result, calculation_source: 'questionnaire' })
    toast.success(`Besoins recalculés pour ${selected.name}`)
  }

  async function saveSettings() {
    if (!profiles.length || saving) return
    const missing = profiles.filter((profile) => TARGET_FIELDS.some(([field]) => !Number.isFinite(Number(profile[field])) || Number(profile[field]) <= 0))
    if (missing.length) {
      toast.error(`Calcule ou complète les objectifs de : ${missing.map((profile) => profile.name).join(', ')}`)
      return
    }

    setSaving(true)
    try {
      for (const profile of profiles) {
        const response = await authFetch(`/api/household/members/${profile.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            preferences: {
              ...profile.preferences,
              planning: {
                ...(profile.preferences?.planning || {}),
                breakfast: profile.planning.breakfast,
                snack: profile.planning.snack,
                vegetarian_meat_swaps_per_week: Number(profile.planning.vegetarian_meat_swaps_per_week) || 0,
              },
            },
          }),
        })
        const payload = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(payload.error || `Réglages de ${profile.name} non enregistrés`)
      }

      const goalResponse = await authFetch('/api/nutrition/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goals: profiles.map((profile) => ({
            household_member_id: profile.id,
            person_name: profile.name,
            age: profile.age,
            sex: profile.sex,
            height_cm: profile.height_cm,
            current_weight_kg: profile.current_weight_kg,
            target_weight_kg: profile.target_weight_kg,
            activity_level: profile.activity_level,
            weight_loss_rate: profile.weight_loss_rate,
            bmr: profile.bmr,
            tdee: profile.tdee,
            target_calories: profile.target_calories,
            target_protein_g: profile.target_protein_g,
            target_carbs_g: profile.target_carbs_g,
            target_fat_g: profile.target_fat_g,
            target_fiber_g: profile.target_fiber_g,
            calculation_source: profile.calculation_source,
          })),
        }),
      })
      const goalPayload = await goalResponse.json().catch(() => ({}))
      if (!goalResponse.ok) throw new Error(goalPayload.error || 'Objectifs non enregistrés')

      setSavedAt(new Date())
      toast.success('Réglages enregistrés — ils seront utilisés au prochain recalcul du planning')
      await load()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function addFoodPreference(event) {
    event.preventDefault()
    if (!newFood.trim() || foodSaving) return
    setFoodSaving(true)
    try {
      const response = await authFetch('/api/settings/food-bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFood, kind: newFoodKind }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Ajout impossible')
      setFoodPreferences((current) => current.some((item) => item.id === payload.item.id) ? current : [...current, payload.item])
      setNewFood('')
      toast.success(payload.duplicate ? 'Ce produit était déjà enregistré' : 'Préférence alimentaire ajoutée')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setFoodSaving(false)
    }
  }

  async function removeFoodPreference(item) {
    try {
      const response = await authFetch('/api/settings/food-bans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(payload.error || 'Suppression impossible')
      setFoodPreferences((current) => current.filter((entry) => entry.id !== item.id))
      toast.success(`${item.name} retiré des réglages`)
    } catch (error) {
      toast.error(error.message)
    }
  }

  if (loading) {
    return <div className="ps-loading"><RefreshCw className="ps-spin" /> Chargement des réglages…</div>
  }

  return (
    <main className="ps-shell">
      <button type="button" className="ps-back" onClick={() => router.push('/settings')}><ArrowLeft size={15} /> Paramètres</button>

      <header className="ps-hero">
        <div>
          <span className="ps-eyebrow">Paramètres · Planning</span>
          <h1>Le planning doit partir de vous.</h1>
          <p>Répondez aux questions, vérifiez les besoins calculés et définissez les aliments que Myko ne doit jamais utiliser.</p>
        </div>
        <button type="button" className="ps-plan-link" onClick={() => router.push('/planning')}>
          Voir puis recalculer le planning
        </button>
      </header>

      <nav className="ps-person-tabs" aria-label="Membre à régler">
        {profiles.map((profile) => (
          <button key={profile.id} type="button" className={profile.id === selectedId ? 'active' : ''} onClick={() => setSelectedId(profile.id)}>
            <span>{profile.name.slice(0, 1)}</span>{profile.name}
          </button>
        ))}
      </nav>

      {selected && (
        <div className="ps-layout">
          <div className="ps-main">
            <section className="ps-card">
              <div className="ps-card-head">
                <div><span className="ps-step">01 · Questions</span><h2>Profil de {selected.name}</h2></div>
                <SlidersHorizontal size={22} />
              </div>
              <div className="ps-form-grid">
                <label><span>Âge</span><input type="number" min="1" max="120" value={selected.age} onChange={(event) => patchSelected({ age: event.target.value })} /></label>
                <label><span>Sexe pour le calcul</span><select value={selected.sex} onChange={(event) => patchSelected({ sex: event.target.value })}><option value="M">Homme</option><option value="F">Femme</option></select></label>
                <label><span>Taille</span><div className="ps-unit"><input type="number" min="80" max="250" value={selected.height_cm} onChange={(event) => patchSelected({ height_cm: event.target.value })} /><i>cm</i></div></label>
                <label><span>Poids actuel</span><div className="ps-unit"><input type="number" min="20" max="400" step="0.1" value={selected.current_weight_kg} onChange={(event) => patchSelected({ current_weight_kg: event.target.value })} /><i>kg</i></div></label>
                <label><span>Poids cible</span><div className="ps-unit"><input type="number" min="20" max="400" step="0.1" value={selected.target_weight_kg} onChange={(event) => patchSelected({ target_weight_kg: event.target.value })} /><i>kg</i></div></label>
                <label className="ps-wide"><span>Activité habituelle</span><select value={selected.activity_level} onChange={(event) => patchSelected({ activity_level: event.target.value })}>{Object.entries(ACTIVITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              </div>

              <div className="ps-rate">
                <span>Rythme souhaité</span>
                <div>{RATE_OPTIONS.map((rate) => <button key={rate} type="button" className={Number(selected.weight_loss_rate) === rate ? 'active' : ''} onClick={() => patchSelected({ weight_loss_rate: rate })}>{rate === 0 ? 'Maintien' : `${rate} kg/sem`}</button>)}</div>
              </div>

              <button type="button" className="ps-calculate" onClick={calculateTargets}><Calculator size={16} /> Calculer les besoins de {selected.name}</button>
              <p className="ps-help">Le résultat sert de base au planning. Les valeurs restent modifiables avant enregistrement.</p>
            </section>

            <section className="ps-card">
              <div className="ps-card-head">
                <div><span className="ps-step">02 · Résultat</span><h2>Objectifs quotidiens</h2></div>
                {selected.bmr && selected.tdee ? <span className="ps-meta">BMR {selected.bmr} · TDEE {selected.tdee}</span> : null}
              </div>
              <div className="ps-targets">
                {TARGET_FIELDS.map(([field, label, unit]) => (
                  <label key={field}>
                    <span>{label}</span>
                    <input type="number" min="0" value={selected[field]} onChange={(event) => patchSelected({ [field]: event.target.value, calculation_source: 'manual' })} />
                    <i>{unit}</i>
                  </label>
                ))}
              </div>
              <div className="ps-source"><Check size={14} /> Source active : {selected.calculation_source === 'manual' ? 'valeurs ajustées manuellement' : 'questionnaire Myko'}</div>
            </section>

            <section className="ps-card">
              <div className="ps-card-head"><div><span className="ps-step">03 · Rythme des repas</span><h2>Prises à générer</h2></div></div>
              <div className="ps-toggles">
                <label><input type="checkbox" checked={selected.planning.breakfast} onChange={(event) => patchPlanning({ breakfast: event.target.checked })} /><span><b>Petit-déjeuner</b><small>Ajouté chaque jour pour {selected.name}</small></span></label>
                <label><input type="checkbox" checked={selected.planning.snack} onChange={(event) => patchPlanning({ snack: event.target.checked })} /><span><b>Collation</b><small>Ajoutée chaque jour pour {selected.name}</small></span></label>
                <label className="ps-swap"><span><b>Variantes végétariennes</b><small>Nombre de repas carnés remplacés par semaine</small></span><input type="number" min="0" max="14" value={selected.planning.vegetarian_meat_swaps_per_week} onChange={(event) => patchPlanning({ vegetarian_meat_swaps_per_week: event.target.value })} /></label>
              </div>
            </section>
          </div>

          <aside className="ps-side">
            <section className="ps-card ps-food-card">
              <div className="ps-card-head"><div><span className="ps-step">Foyer entier</span><h2>Produits interdits</h2></div><ShieldBan size={22} /></div>
              <p className="ps-food-intro">Un interdit est bloquant dans les recettes, sauces, garnitures, petits-déjeuners et collations. « À éviter » reste une préférence souple.</p>
              <form className="ps-food-form" onSubmit={addFoodPreference}>
                <input value={newFood} onChange={(event) => setNewFood(event.target.value)} placeholder="Ex. thon, céleri, whey…" maxLength={80} />
                <select value={newFoodKind} onChange={(event) => setNewFoodKind(event.target.value)}><option value="ban">Interdit strict</option><option value="dislike">À éviter</option></select>
                <button type="submit" disabled={foodSaving || !newFood.trim()}><Plus size={15} /> Ajouter</button>
              </form>
              <div className="ps-food-list">
                {foodPreferences.length ? foodPreferences.map((item) => (
                  <div key={item.id} className={`ps-food ${item.kind}`}>
                    <span><b>{item.name}</b><small>{item.kind === 'ban' ? 'Interdit strict' : 'À éviter'}</small></span>
                    <button type="button" aria-label={`Supprimer ${item.name}`} onClick={() => removeFoodPreference(item)}><Trash2 size={14} /></button>
                  </div>
                )) : <p className="ps-empty">Aucune préférence enregistrée.</p>}
              </div>
            </section>

            <section className="ps-save-card">
              <h2>Appliquer au prochain calcul</h2>
              <p>Les semaines existantes ne sont jamais modifiées silencieusement. Enregistrez, puis choisissez explicitement de recalculer la semaine dans Planning.</p>
              <button type="button" className="ps-save" onClick={saveSettings} disabled={saving}>{saving ? <RefreshCw className="ps-spin" size={16} /> : <Check size={16} />}{saving ? 'Enregistrement…' : 'Enregistrer tous les réglages'}</button>
              {savedAt && <small>Enregistré à {savedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small>}
              <button type="button" className="ps-replan" onClick={() => router.push('/planning')}>Ouvrir le planning</button>
            </section>
          </aside>
        </div>
      )}

      <style jsx>{`
        .ps-shell{width:min(1280px,calc(100% - 48px));margin:0 auto;padding:38px 0 80px;color:var(--ink-1)}
        .ps-back{display:inline-flex;align-items:center;gap:7px;padding:0;margin:0 0 24px;border:0;background:none;color:var(--ink-3);font-family:var(--font-mono);font-size:10px;text-transform:uppercase;cursor:pointer}
        .ps-hero{display:flex;align-items:flex-end;justify-content:space-between;gap:30px;padding-bottom:28px;border-bottom:1px solid var(--ink-1)}
        .ps-eyebrow,.ps-step{color:var(--terracotta);font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
        .ps-hero h1{max-width:760px;margin:8px 0;font-family:var(--font-display);font-size:clamp(42px,5vw,68px);line-height:.98;letter-spacing:-.04em}
        .ps-hero p{max-width:680px;margin:0;color:var(--ink-2);font-size:15px;line-height:1.55}
        .ps-plan-link,.ps-save,.ps-calculate{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 16px;border:1px solid var(--brand);border-radius:6px;background:var(--brand);color:#fff;font-family:var(--font-mono);font-size:10px;font-weight:700;text-transform:uppercase;cursor:pointer}
        .ps-person-tabs{display:flex;gap:8px;padding:20px 0;border-bottom:1px solid var(--line-strong)}
        .ps-person-tabs button{display:flex;align-items:center;gap:8px;min-height:42px;padding:0 16px;border:1px solid var(--line-strong);border-radius:99px;background:transparent;color:var(--ink-2);cursor:pointer}
        .ps-person-tabs span{display:grid;width:24px;height:24px;place-items:center;border-radius:50%;background:var(--line);font-family:var(--font-mono);font-size:9px}
        .ps-person-tabs button.active{border-color:var(--terracotta);background:var(--terracotta);color:#fff}.ps-person-tabs button.active span{background:rgba(255,255,255,.22)}
        .ps-layout{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:22px;padding-top:22px}.ps-main,.ps-side{display:flex;flex-direction:column;gap:18px}
        .ps-card,.ps-save-card{padding:24px;border:1px solid var(--line-strong);border-radius:9px;background:rgba(255,255,255,.18)}
        .ps-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:20px}.ps-card-head h2,.ps-save-card h2{margin:5px 0 0;font-family:var(--font-display);font-size:28px;line-height:1}.ps-card-head>svg{color:var(--terracotta)}
        .ps-meta{color:var(--ink-3);font-family:var(--font-mono);font-size:9px;text-transform:uppercase}
        .ps-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.ps-wide{grid-column:1/-1}
        .ps-form-grid label,.ps-targets label{display:flex;flex-direction:column;gap:7px}.ps-form-grid label>span,.ps-rate>span,.ps-targets label>span{font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3)}
        input,select{width:100%;min-height:43px;padding:0 12px;border:1px solid var(--line-strong);border-radius:5px;background:rgba(255,255,255,.42);color:var(--ink-1);font:inherit}.ps-unit{display:flex;align-items:center}.ps-unit input{border-radius:5px 0 0 5px}.ps-unit i{display:grid;min-width:44px;height:43px;place-items:center;border:1px solid var(--line-strong);border-left:0;border-radius:0 5px 5px 0;color:var(--ink-3);font-family:var(--font-mono);font-size:9px;font-style:normal}
        .ps-rate{margin-top:18px}.ps-rate>div{display:flex;flex-wrap:wrap;gap:7px;margin-top:8px}.ps-rate button{min-height:36px;padding:0 12px;border:1px solid var(--line-strong);border-radius:5px;background:transparent;color:var(--ink-2);cursor:pointer}.ps-rate button.active{border-color:var(--terracotta);background:var(--terracotta);color:#fff}
        .ps-calculate{margin-top:20px;background:transparent;color:var(--brand)}.ps-calculate:hover{background:var(--brand);color:#fff}.ps-help,.ps-food-intro,.ps-save-card p{color:var(--ink-3);font-size:12px;line-height:1.55}.ps-help{margin:10px 0 0}
        .ps-targets{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px}.ps-targets label{position:relative}.ps-targets input{padding-right:42px;font-family:var(--font-display);font-size:21px}.ps-targets i{position:absolute;right:9px;bottom:14px;color:var(--ink-3);font-family:var(--font-mono);font-size:8px;font-style:normal}.ps-source{display:flex;align-items:center;gap:7px;margin-top:16px;color:var(--brand);font-family:var(--font-mono);font-size:9px;text-transform:uppercase}
        .ps-toggles{display:grid;gap:10px}.ps-toggles label{display:flex;align-items:center;gap:12px;padding:13px;border:1px solid var(--line);border-radius:6px}.ps-toggles input[type=checkbox]{width:19px;min-height:19px;accent-color:var(--terracotta)}.ps-toggles span{display:flex;flex:1;flex-direction:column}.ps-toggles b{font-size:13px}.ps-toggles small{margin-top:2px;color:var(--ink-3)}.ps-toggles .ps-swap>input{width:80px;min-height:38px}
        .ps-food-intro{margin:-4px 0 16px}.ps-food-form{display:grid;grid-template-columns:1fr;gap:8px}.ps-food-form button{display:flex;align-items:center;justify-content:center;gap:7px;min-height:40px;border:1px solid var(--ink-1);border-radius:5px;background:transparent;font-family:var(--font-mono);font-size:9px;text-transform:uppercase;cursor:pointer}.ps-food-form button:hover:not(:disabled){background:var(--ink-1);color:#fff}
        .ps-food-list{display:flex;flex-direction:column;gap:7px;margin-top:16px}.ps-food{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 11px;border-left:3px solid var(--terracotta);background:rgba(193,96,60,.08)}.ps-food.dislike{border-left-color:#c9821f;background:rgba(201,130,31,.08)}.ps-food span{display:flex;flex-direction:column}.ps-food b{font-size:13px}.ps-food small{color:var(--ink-3);font-family:var(--font-mono);font-size:8px;text-transform:uppercase}.ps-food button{display:grid;width:30px;height:30px;place-items:center;border:0;background:transparent;color:var(--ink-3);cursor:pointer}.ps-food button:hover{color:var(--terracotta)}.ps-empty{color:var(--ink-3);font-size:12px}
        .ps-save-card{position:sticky;top:20px;border-top:4px solid var(--brand)}.ps-save-card h2{font-size:25px}.ps-save{width:100%;margin-top:8px}.ps-save:disabled{opacity:.6}.ps-save-card>small{display:block;margin-top:8px;color:var(--brand);font-family:var(--font-mono);font-size:9px;text-align:center}.ps-replan{width:100%;margin-top:9px;min-height:40px;border:0;background:transparent;color:var(--terracotta);font-family:var(--font-mono);font-size:9px;text-decoration:underline;text-transform:uppercase;cursor:pointer}
        .ps-loading{display:flex;min-height:60vh;align-items:center;justify-content:center;gap:10px;color:var(--ink-3);font-family:var(--font-mono);font-size:11px}.ps-spin{animation:ps-spin .9s linear infinite}@keyframes ps-spin{to{transform:rotate(360deg)}}
        @media(max-width:980px){.ps-layout{grid-template-columns:1fr}.ps-save-card{position:static}.ps-targets{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:680px){.ps-shell{width:min(100% - 24px,1280px);padding-top:22px}.ps-hero{align-items:flex-start;flex-direction:column}.ps-plan-link{width:100%}.ps-form-grid{grid-template-columns:1fr}.ps-wide{grid-column:auto}.ps-targets{grid-template-columns:repeat(2,1fr)}.ps-person-tabs{overflow-x:auto}.ps-card{padding:18px}}
      `}</style>
    </main>
  )
}
