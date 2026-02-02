'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddSaladeNicoiseStepsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();

  async function addSteps() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/add-salade-nicoise-steps', {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur inconnue');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '40px auto',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1 style={{
        fontSize: '2rem',
        marginBottom: '20px',
        color: '#1f2937'
      }}>
        📋 Ajout des Étapes - Salade Niçoise
      </h1>

      <div style={{
        background: '#f3f4f6',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>À propos</h2>
        <p style={{ lineHeight: '1.6', color: '#4b5563' }}>
          Ce script va ajouter 8 étapes détaillées à la recette "Salade niçoise" dans la table <code>recipe_steps</code>.
        </p>
        <ul style={{ marginTop: '12px', lineHeight: '1.8', color: '#4b5563' }}>
          <li>✅ Préparation des légumes (10 min)</li>
          <li>✅ Cuisson des œufs durs (10 min)</li>
          <li>✅ Préparation des pommes de terre (20 min)</li>
          <li>✅ Assemblage de la salade (5 min)</li>
          <li>✅ Ajout du thon et des anchois (3 min)</li>
          <li>✅ Disposition des œufs (2 min)</li>
          <li>✅ Assaisonnement (2 min)</li>
          <li>✅ Service (10 min de repos)</li>
        </ul>
        <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#6b7280' }}>
          <strong>Durée totale:</strong> 62 minutes
        </p>
      </div>

      <button
        onClick={addSteps}
        disabled={loading}
        style={{
          background: loading ? '#9ca3af' : '#059669',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? '⏳ Ajout en cours...' : '✨ Ajouter les étapes'}
      </button>

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #ef4444',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#dc2626', marginBottom: '8px' }}>❌ Erreur</h3>
          <p style={{ color: '#991b1b' }}>{error}</p>
        </div>
      )}

      {result && (
        <div style={{
          background: '#d1fae5',
          border: '1px solid #059669',
          padding: '20px',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <h3 style={{ color: '#047857', marginBottom: '12px' }}>✅ {result.message}</h3>

          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '6px',
            marginTop: '12px'
          }}>
            <p style={{ marginBottom: '8px' }}>
              <strong>Recette:</strong> {result.recipe.name} (ID: {result.recipe.id})
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>État précédent:</strong> {result.steps.hadSteps ? `${result.steps.previousCount} étapes` : 'Aucune étape'}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Nouvel état:</strong> {result.steps.newCount} étapes
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Durée totale:</strong> {result.steps.totalDuration} minutes
            </p>
          </div>

          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: '#fef3c7',
            borderRadius: '6px',
            border: '1px solid #f59e0b'
          }}>
            <p style={{ color: '#92400e', marginBottom: '10px' }}>
              <strong>🎉 Étapes ajoutées avec succès!</strong><br />
              Vous pouvez maintenant voir les instructions sur la page de la recette.
            </p>
            <button
              onClick={() => router.push('/recipes/9401')}
              style={{
                display: 'inline-block',
                marginTop: '10px',
                padding: '8px 16px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              → Voir la recette Salade Niçoise
            </button>
          </div>
        </div>
      )}

      <div style={{
        marginTop: '40px',
        padding: '15px',
        background: '#eff6ff',
        borderRadius: '8px',
        border: '1px solid #3b82f6'
      }}>
        <h3 style={{ color: '#1e40af', marginBottom: '10px' }}>ℹ️ Informations techniques</h3>
        <p style={{ fontSize: '0.9rem', color: '#1e3a8a', lineHeight: '1.6' }}>
          Ce script insère 8 étapes dans la table <code>recipe_steps</code> pour la recette avec l'ID 9401 (Salade niçoise).
          Si des étapes existent déjà, elles seront remplacées.
        </p>
        <p style={{ fontSize: '0.9rem', color: '#1e3a8a', lineHeight: '1.6', marginTop: '8px' }}>
          Chaque étape contient: numéro d'étape, description, durée, et type (preparation/cooking/assembly/resting).
        </p>
      </div>
    </div>
  );
}
