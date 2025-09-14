// app/pantry/components/EnhancedLotCard.js - Version mise à jour avec nouvelles fonctionnalités

'use client';

import { useState, useMemo } from 'react';
import { daysUntil, formatDate } from '@/lib/dates';
import { PantryStyles } from './pantryUtils';

export function EnhancedLotCard({ lot, onUpdate, onDelete, compact = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    qty: lot.qty || 0,
    unit: lot.unit || 'g',
    expiration_date: lot.best_before || lot.expiration_date || '',
    notes: lot.note || lot.notes || '',
    storage_place: lot.storage_place || ''
  });

  // Calculs pour l'affichage
  const calculations = useMemo(() => {
    const daysLeft = daysUntil(lot.best_before || lot.expiration_date);
    
    const urgencyLevel = daysLeft === null ? 'unknown'
                      : daysLeft < 0 ? 'expired'
                      : daysLeft === 0 ? 'today'
                      : daysLeft <= 2 ? 'critical'
                      : daysLeft <= 7 ? 'warning'
                      : 'ok';

    const urgencyConfig = {
      expired: { emoji: '🚨', color: '#e74c3c', label: 'Expiré', bg: 'rgba(231, 76, 60, 0.1)' },
      today: { emoji: '⏰', color: '#e67e22', label: 'Expire aujourd\'hui', bg: 'rgba(230, 126, 34, 0.1)' },
      critical: { emoji: '⚠️', color: '#f39c12', label: 'Urgent', bg: 'rgba(243, 156, 18, 0.1)' },
      warning: { emoji: '📅', color: '#f1c40f', label: 'Bientôt', bg: 'rgba(241, 196, 15, 0.1)' },
      ok: { emoji: '✅', color: '#27ae60', label: 'OK', bg: 'rgba(39, 174, 96, 0.1)' },
      unknown: { emoji: '❓', color: '#95a5a6', label: 'Inconnue', bg: 'rgba(149, 165, 166, 0.1)' }
    };

    const urgency = urgencyConfig[urgencyLevel];

    // Calcul du pourcentage de consommation
    const initialQty = lot.initial_qty || lot.qty || 0;
    const remainingQty = lot.qty_remaining || lot.qty || 0;
    const consumedPct = initialQty > 0 ? ((initialQty - remainingQty) / initialQty) * 100 : 0;

    // Formatage des dates
    const acquisitionText = lot.acquired_on ? `Acheté le ${formatDate(lot.acquired_on)}`
                          : lot.produced_on ? `Produit le ${formatDate(lot.produced_on)}`
                          : lot.created_at ? `Ajouté le ${formatDate(lot.created_at)}`
                          : '';

    const expirationText = daysLeft === null ? 'DLC inconnue'
                        : daysLeft < 0 ? `Expiré il y a ${Math.abs(daysLeft)} jour${Math.abs(daysLeft) > 1 ? 's' : ''}`
                        : daysLeft === 0 ? 'Expire aujourd\'hui'
                        : daysLeft === 1 ? 'Expire demain'
                        : `Expire dans ${daysLeft} jours`;

    return {
      daysLeft,
      urgencyLevel,
      urgency,
      consumedPct,
      remainingQty,
      initialQty,
      acquisitionText,
      expirationText
    };
  }, [lot]);

  // Sauvegarde des modifications
  const handleSave = async () => {
    try {
      await onUpdate(lot.id, {
        qty: Number(editData.qty),
        dlc: editData.expiration_date,
        note: editData.notes,
        storage_place: editData.storage_place
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }
  };

  // Annuler les modifications
  const handleCancel = () => {
    setEditData({
      qty: lot.qty || 0,
      unit: lot.unit || 'g',
      expiration_date: lot.best_before || lot.expiration_date || '',
      notes: lot.note || lot.notes || '',
      storage_place: lot.storage_place || ''
    });
    setIsEditing(false);
  };

  // Actions rapides
  const handleQuickActions = {
    consume: (amount) => {
      const newQty = Math.max(0, calculations.remainingQty - amount);
      onUpdate(lot.id, { qty: newQty });
    },
    markOpened: () => {
      if (!lot.opened_on) {
        const today = new Date().toISOString().split('T')[0];
        onUpdate(lot.id, { opened_on: today });
      }
    },
    extendDLC: (days) => {
      const currentDate = new Date(lot.best_before || lot.expiration_date || Date.now());
      currentDate.setDate(currentDate.getDate() + days);
      onUpdate(lot.id, { dlc: currentDate.toISOString().split('T')[0] });
    }
  };

  if (compact) {
    return (
      <div style={{
        ...PantryStyles.glassBase,
        padding: '0.75rem',
        borderRadius: '0.5rem',
        borderLeft: `4px solid ${calculations.urgency.color}`,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <span style={{ fontSize: '1.5rem' }}>
          {calculations.urgency.emoji}
        </span>
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
            {calculations.remainingQty}{lot.unit} • {lot.product?.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--medium-gray)' }}>
            📍 {lot.location?.name} • {calculations.expirationText}
          </div>
        </div>
        
        <button
          onClick={() => setIsEditing(true)}
          className="btn secondary small"
          style={{ padding: '0.25rem 0.5rem' }}
        >
          ✏️
        </button>
      </div>
    );
  }

  return (
    <div style={{
      ...PantryStyles.glassBase,
      padding: '1.5rem',
      borderRadius: '1rem',
      background: calculations.urgency.bg,
      border: `2px solid ${calculations.urgency.color}33`,
      position: 'relative'
    }}>
      {/* Badge d'urgence */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: calculations.urgency.color,
        color: 'white',
        padding: '0.25rem 0.75rem',
        borderRadius: '12px',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {calculations.urgency.emoji} {calculations.urgency.label}
      </div>

      {/* En-tête avec produit */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        marginBottom: '1.5rem',
        paddingRight: '100px' // Espace pour le badge
      }}>
        <div style={{
          fontSize: '2.5rem',
          background: lot.category_color ? `${lot.category_color}22` : 'var(--earth-100)',
          borderRadius: '50%',
          padding: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '70px',
          height: '70px'
        }}>
          {lot.category_icon || '📦'}
        </div>
        
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.3rem',
            fontWeight: 'bold',
            color: 'var(--forest-700)'
          }}>
            {lot.product?.name || 'Produit inconnu'}
          </h3>
          
          <p style={{
            margin: '0.25rem 0 0',
            fontSize: '0.9rem',
            color: 'var(--medium-gray)'
          }}>
            {lot.product?.category} • Type: {lot.product_type}
          </p>
          
          {calculations.acquisitionText && (
            <p style={{
              margin: '0.25rem 0 0',
              fontSize: '0.8rem',
              color: 'var(--medium-gray)',
              fontStyle: 'italic'
            }}>
              📅 {calculations.acquisitionText}
            </p>
          )}
        </div>
      </div>

      {isEditing ? (
        /* Mode édition */
        <div style={{ background: 'rgba(255,255,255,0.9)', padding: '1rem', borderRadius: '0.5rem' }}>
          <div className="grid cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Quantité restante
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={editData.qty}
                  onChange={(e) => setEditData(prev => ({ ...prev, qty: e.target.value }))}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    borderRadius: '0.25rem',
                    border: '1px solid var(--earth-300)'
                  }}
                />
                <span style={{
                  padding: '0.5rem',
                  background: 'var(--earth-100)',
                  borderRadius: '0.25rem',
                  minWidth: '50px',
                  textAlign: 'center'
                }}>
                  {editData.unit}
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                Date de péremption
              </label>
              <input
                type="date"
                value={editData.expiration_date}
                onChange={(e) => setEditData(prev => ({ ...prev, expiration_date: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  border: '1px solid var(--earth-300)'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Emplacement précis
            </label>
            <input
              type="text"
              placeholder="Ex: Bac à légumes, Étagère du haut..."
              value={editData.storage_place}
              onChange={(e) => setEditData(prev => ({ ...prev, storage_place: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid var(--earth-300)'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
              Notes
            </label>
            <textarea
              rows={3}
              placeholder="Notes sur ce lot..."
              value={editData.notes}
              onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid var(--earth-300)',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button onClick={handleCancel} className="btn secondary">
              Annuler
            </button>
            <button onClick={handleSave} className="btn primary">
              Sauvegarder
            </button>
          </div>
        </div>
      ) : (
        /* Mode affichage */
        <div>
          {/* Informations principales */}
          <div className="grid cols-2" style={{ gap: '2rem', marginBottom: '1.5rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.5rem', color: 'var(--forest-600)' }}>
                📦 Quantité
              </h4>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--forest-700)' }}>
                {calculations.remainingQty}{lot.unit}
              </div>
              {calculations.initialQty > calculations.remainingQty && (
                <div style={{ fontSize: '0.9rem', color: 'var(--medium-gray)' }}>
                  Consommé: {(calculations.initialQty - calculations.remainingQty).toFixed(1)}{lot.unit} 
                  ({calculations.consumedPct.toFixed(0)}%)
                </div>
              )}
              
              {/* Barre de progression de consommation */}
              {calculations.consumedPct > 0 && (
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'var(--earth-200)',
                  borderRadius: '4px',
                  marginTop: '0.5rem',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${calculations.consumedPct}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, var(--forest-400), var(--autumn-orange))`,
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              )}
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.5rem', color: 'var(--forest-600)' }}>
                📅 Expiration
              </h4>
              <div style={{ 
                fontSize: '1.1rem', 
                fontWeight: 'bold',
                color: calculations.urgency.color
              }}>
                {calculations.expirationText}
              </div>
              {lot.best_before && (
                <div style={{ fontSize: '0.9rem', color: 'var(--medium-gray)' }}>
                  DLC: {formatDate(lot.best_before)}
                </div>
              )}
            </div>
          </div>

          {/* Informations de stockage */}
          <div style={{
            background: 'rgba(255,255,255,0.7)',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ margin: '0 0 0.75rem', color: 'var(--forest-600)' }}>
              📍 Stockage
            </h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <strong>Lieu:</strong> {lot.location?.name || lot.storage_method || 'Non défini'}
              </div>
              {lot.storage_place && (
                <div>
                  <strong>Emplacement:</strong> {lot.storage_place}
                </div>
              )}
              {lot.opened_on && (
                <div>
                  <strong>Ouvert le:</strong> {formatDate(lot.opened_on)}
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {(lot.note || lot.notes) && (
            <div style={{
              background: 'rgba(255,255,255,0.7)',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <h4 style={{ margin: '0 0 0.5rem', color: 'var(--forest-600)' }}>
                💬 Notes
              </h4>
              <p style={{ margin: 0, fontStyle: 'italic' }}>
                {lot.note || lot.notes}
              </p>
            </div>
          )}

          {/* Actions rapides */}
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            flexWrap: 'wrap',
            paddingTop: '1rem',
            borderTop: '1px solid var(--earth-200)'
          }}>
            <button
              onClick={() => handleQuickActions.consume(calculations.remainingQty * 0.1)}
              className="btn secondary small"
              disabled={calculations.remainingQty <= 0}
            >
              📉 Utiliser 10%
            </button>
            
            <button
              onClick={() => handleQuickActions.consume(calculations.remainingQty * 0.5)}
              className="btn secondary small"
              disabled={calculations.remainingQty <= 0}
            >
              📉 Utiliser 50%
            </button>
            
            {!lot.opened_on && (
              <button
                onClick={handleQuickActions.markOpened}
                className="btn secondary small"
              >
                📂 Marquer ouvert
              </button>
            )}
            
            {calculations.daysLeft !== null && calculations.daysLeft <= 7 && (
              <button
                onClick={() => handleQuickActions.extendDLC(7)}
                className="btn secondary small"
              >
                ⏰ +7 jours DLC
              </button>
            )}
            
            <button
              onClick={() => setIsEditing(true)}
              className="btn primary small"
            >
              ✏️ Modifier
            </button>
            
            <button
              onClick={() => {
                if (confirm(`Supprimer ce lot de ${calculations.remainingQty}${lot.unit} ?`)) {
                  onDelete(lot.id);
                }
              }}
              className="btn danger small"
            >
              🗑️ Supprimer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
