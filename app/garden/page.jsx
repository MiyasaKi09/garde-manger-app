'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { authFetch } from '@/lib/authFetch'
import { toast } from '@/components/Toast'
import './garden.css'

export default function GardenPage() {
  const [plants, setPlants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadPlants()
  }, [])

  async function loadPlants() {
    const { data, error } = await supabase.from('garden_plant_product_map').select('*')
    if (error) setError(error.message)
    else setPlants(data || [])
    setLoading(false)
  }

  async function harvest(plant) {
    try {
      const res = await authFetch('/api/garden/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plantId: plant.id, qty: 1, unit: 'pièce(s)' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors de la récolte')
        return
      }
      toast.success('Récolte enregistrée dans votre stock !')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="v21-page">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Potager</span>
          <h1 className="v21-title">Mon potager</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Enregistrez vos récoltes directement dans votre stock.</p>
        </div>
      </header>

      {error && <div className="garden-error" role="alert">{error}</div>}

      {loading ? (
        <section className="v21-section flush" aria-busy="true" aria-label="Chargement du potager">
          <div className="v21-skel" style={{ height: 64 }} />
          <div className="v21-skel" style={{ height: 64, marginTop: 12 }} />
          <div className="v21-skel" style={{ height: 64, marginTop: 12 }} />
        </section>
      ) : plants.length === 0 ? (
        <section className="v21-section flush">
          <div className="v21-empty">
            <p>Aucune plante configurée pour le moment.</p>
            <p className="v21-next" style={{ marginTop: 0 }}>La fonctionnalité potager arrive bientôt.</p>
          </div>
        </section>
      ) : (
        <section className="v21-section flush">
          <div className="v21-mast-h">
            <h2 className="v21-mast-title">Vos plantes</h2>
            <span className="v21-mast-c">{plants.length} plante{plants.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="v21-its garden-plants">
            {plants.map(plant => (
              <div key={plant.id} className="v21-it compact garden-plant">
                <span className="v21-it-bar" aria-hidden="true" />
                <span className="v21-it-n">{plant.plant_label || plant.name || `Plante #${plant.id}`}</span>
                <span className="garden-plant-action">
                  <button className="v21-btn sm" onClick={() => harvest(plant)}>Récolter</button>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
