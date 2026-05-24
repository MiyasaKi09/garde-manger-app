'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
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
    const { error } = await supabase.rpc('add_harvest_lot', { plant_id: plant.id })
    if (error) setError(error.message)
    else alert('Récolte enregistrée dans votre stock !')
  }

  return (
    <>
      <div className="myko-canvas" aria-hidden="true" />
      <div className="garden-page">
        <div className="hero-header">
          <div className="hero-content">
            <div className="hero-text">
              <span className="hero-eyebrow">Potager</span>
              <h1 className="hero-title">Mon potager</h1>
              <p className="hero-subtitle">Enregistrez vos récoltes directement dans votre stock</p>
            </div>
          </div>
        </div>

        {loading && <div className="myko-loading">Chargement…</div>}
        {error && <div className="garden-error">{error}</div>}

        {!loading && plants.length === 0 && (
          <div className="empty-state-card">
            <div className="empty-icon">🌱</div>
            <h3>Aucune plante configurée</h3>
            <p>La fonctionnalité potager arrive bientôt.</p>
          </div>
        )}

        {plants.length > 0 && (
          <section className="myko-section">
            <div className="section-header">
              <div className="section-accent"></div>
              <h2 className="section-title">Vos plantes</h2>
            </div>
            <div className="garden-grid">
              {plants.map(plant => (
                <div key={plant.id} className="myko-card garden-plant-card">
                  <span className="garden-plant-name">{plant.plant_label || plant.name || `Plante #${plant.id}`}</span>
                  <button className="btn-primary" onClick={() => harvest(plant)}>Récolter</button>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
