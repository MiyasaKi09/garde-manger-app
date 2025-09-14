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
    const
