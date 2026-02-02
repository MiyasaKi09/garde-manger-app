'use client';

import { useState } from 'react';

export default function FixSaladeNicoisePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function fixRecipe() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/fix-salade-nicoise', {
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
        🔧 Correction des Instructions - Salade Niçoise
      </h1>

      <div style={{
        background: '#f3f4f6',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Problème identifié</h2>
        <p style={{ lineHeight: '1.6', color: '#4b5563' }}>
          La recette "Salade niçoise" (ID: 9401) n'a pas d'instructions dans la base de données.
          Cliquez sur le bouton ci-dessous pour ajouter les instructions manquantes.
        </p>
      </div>

      <button
        onClick={fixRecipe}
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
        {loading ? '⏳ Mise à jour en cours...' : '✨ Corriger les instructions'}
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
              <strong>Recette:</strong> {result.recipe.name}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>État précédent:</strong> {result.recipe.hadInstructions ? `${result.recipe.oldInstructionsLength} caractères` : 'Aucune instruction'}
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Nouvel état:</strong> {result.recipe.newInstructionsLength} caractères
            </p>
            <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#6b7280' }}>
              <strong>Aperçu:</strong><br />
              {result.recipe.instructionsPreview}
            </p>
          </div>

          <div style={{
            marginTop: '20px',
            padding: '12px',
            background: '#fef3c7',
            borderRadius: '6px',
            border: '1px solid #f59e0b'
          }}>
            <p style={{ color: '#92400e' }}>
              <strong>🎉 Instructions ajoutées!</strong><br />
              Vous pouvez maintenant visiter la page de la recette pour voir les instructions.
            </p>
            <a
              href="/recipes/9401"
              style={{
                display: 'inline-block',
                marginTop: '10px',
                padding: '8px 16px',
                background: '#f59e0b',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '600'
              }}
            >
              → Voir la recette Salade Niçoise
            </a>
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
          Ce script met à jour la colonne <code>instructions</code> de la table <code>recipes</code>
          pour la recette avec l'ID 9401 (Salade niçoise). Les instructions ajoutées suivent le format
          étape par étape avec 8 étapes détaillées.
        </p>
      </div>
    </div>
  );
}
