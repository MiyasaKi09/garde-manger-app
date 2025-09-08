'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function GardenPage() {
  const [plants, setPlants] = useState([]); // Liste des plantes de l’utilisateur
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Charger les plantes (démo : normalement depuis une table "user_plants" ou JSON sauvegardé)
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        // Ici on récupère le mapping entre plantes et produits
        const { data, error } = await supabase
          .from('garden_plant_product_map')
          .select('id, plant_label, product_id');
        if (error) throw error;
        setPlants(data || []);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger le potager.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Action : récolter une plante
  async function harvest(plant) {
    setError('');
    setLoading(true);
    try {
      // 1. On suppose un produit déjà associé via garden_plant_product_map
      const productId = plant.product_id;

      // 2. Localisation par défaut (à adapter si tu as plusieurs "lieux de stockage")
      const locationId = null; // ou l’ID réel d’un frigo/garde-manger

      // 3. Appel RPC Supabase → ajoute un lot dans pantry_lots
      const { data, error } = await supabase.rpc('add_harvest_lot', {
        p_user_id: (await supabase.auth.getUser()).data.user.id,
        p_product_id: productId,
        p_location_id: locationId,
        p_qty: 1,
        p_unit: 'pièce',
        p_best_before: new Date().toISOString().slice(0, 10), // aujourd’hui
        p_note: `Récolte depuis potager - ${plant.plant_label}`
      });
      if (error) throw error;

      alert(`🌱 Récolte enregistrée → Lot #${data}`);
    } catch (err) {
      console.error(err);
      setError('Échec lors de la récolte.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🌱 Mon Potager</h1>
      {loading && <p>Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}

      <div className="grid gap-4">
        {plants.map((plant) => (
          <div
            key={plant.id}
            className="border rounded p-4 flex justify-between items-center"
          >
            <span>{plant.plant_label}</span>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={() => harvest(plant)}
            >
              Récolter
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
