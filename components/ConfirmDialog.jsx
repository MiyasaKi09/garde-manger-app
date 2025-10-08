'use client';

import { useState } from 'react';
import './ConfirmDialog.css';

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmer l'action", 
  message = "Êtes-vous sûr de vouloir continuer ?",
  confirmText = "Confirmer",
  cancelText = "Annuler"
}) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button 
            className="confirm-btn cancel-btn" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            className="confirm-btn confirm-btn-primary" 
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}