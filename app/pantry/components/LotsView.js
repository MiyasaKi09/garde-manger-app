// app/pantry/components/LotsView.js
'use client';

import { useState, useMemo } from 'react';
import { X, Edit2, Trash2, Plus, Package } from 'lucide-react';
import { daysUntil, getExpirationStatus, formatQuantity } from './pantryUtils';

export default function LotsView({ 
  product, 
  onClose, 
  onUpdateLot, 
  onDeleteLot, 
  onAddLot 
}) {
  const [editingLot, setEditingLot] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Protection contre product undefined
  if (!product) {
    return null;
  }

  const lots = product.lots || [];
  const productName = product.productName || 'Produit';

  // Tri des lots par urgence d'expiration
  const sortedLots = useMemo(() => {
    return [...lots].sort((a, b) => {
      const daysA = daysUntil(a.effective_expiration);
      const daysB = daysUntil(b.effective_expiration);
      
      // Lots expirés ou urgents en premier
      if (daysA !== null && daysB !== null) {
        return daysA - daysB;
      }
      
      // Lots sans date à la fin
      if (daysA === null) return 1;
      if (daysB === null) return -1;
      
      return 0;
    });
  }, [lots]);

  const handleClose = () => {
    if (onClose && typeof onClose === 'function') {
      onClose();
    }
  };

  const handleUpdateLot = async (lotId, updates) => {
    if (onUpdateLot && typeof onUpdateLot === 'function') {
      await onUpdateLot(lotId, updates);
      setEditingLot(null);
    }
  };

  const handleDeleteLot = async (lotId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce lot ?')) {
      if (onDeleteLot && typeof onDeleteLot === 'function') {
        await onDeleteLot(lotId);
      }
    }
  };

  const handleAddLot = async (lotData) => {
    if (onAddLot && typeof onAddLot === 'function') {
      await onAddLot(lotData);
      setShowAddForm(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="lots-overlay" onClick={handleClose}>
        <div className="lots-modal" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="lots-header">
            <div className="lots-title">
              <Package size={20} />
              <span>Lots de {productName}</span>
            </div>
            <button onClick={handleClose} className="close-button">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="lots-content">
            {sortedLots.length === 0 ? (
              <div className="empty-lots">
                <Package size={48} />
                <h3>Aucun lot disponible</h3>
                <p>Commencez par ajouter un premier lot pour ce produit</p>
                <button 
                  onClick={() => setShowAddForm(true)} 
                  className="btn-primary"
                >
                  <Plus size={16} />
                  Ajouter un lot
                </button>
              </div>
            ) : (
              <>
                <div className="lots-list">
                  {sortedLots.map((lot) => (
                    <LotCard
                      key={lot.id}
                      lot={lot}
                      isEditing={editingLot === lot.id}
                      onEdit={() => setEditingLot(lot.id)}
                      onCancelEdit={() => setEditingLot(null)}
                      onSave={(updates) => handleUpdateLot(lot.id, updates)}
                      onDelete={() => handleDeleteLot(lot.id)}
                    />
                  ))}
                </div>
                
                <div className="lots-actions">
                  <button 
                    onClick={() => setShowAddForm(true)} 
                    className="btn-secondary"
                  >
                    <Plus size={16} />
                    Ajouter un lot
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm && (
            <AddLotForm
              productName={productName}
              onSubmit={handleAddLot}
              onCancel={() => setShowAddForm(false)}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        .lots-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .lots-modal {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .lots-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: var(--forest-50, #f8fdf8);
        }

        .lots-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--forest-800, #1a3a1a);
        }

        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 8px;
          color: #6b7280;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .lots-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .empty-lots {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem 1rem;
          text-align: center;
          color: #6b7280;
        }

        .empty-lots h3 {
          margin: 0;
          color: var(--forest-700, #2d5a2d);
        }

        .empty-lots p {
          margin: 0;
          color: #9ca3af;
        }

        .lots-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .lots-actions {
          display: flex;
          justify-content: center;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .btn-primary {
          background: var(--forest-500, #8bb58b);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: background-color 0.2s;
        }

        .btn-primary:hover {
          background: var(--forest-600, #6b9d6b);
        }

        .btn-secondary {
          background: rgba(var(--forest-500-rgb, 139, 181, 139), 0.1);
          color: var(--forest-600, #6b9d6b);
          border: 1px solid var(--forest-300, #c8d8c8);
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: rgba(var(--forest-500-rgb, 139, 181, 139), 0.2);
        }

        @media (max-width: 768px) {
          .lots-modal {
            margin: 0;
            max-height: 100vh;
            border-radius: 0;
          }

          .lots-content {
            padding: 1rem;
          }
        }
      `}</style>
    </>
  );
}

// Composant pour un lot individuel
function LotCard({ lot, isEditing, onEdit, onCancelEdit, onSave, onDelete }) {
  const [editData, setEditData] = useState({
    qty_remaining: lot.qty_remaining || 0,
    unit: lot.unit || 'g',
    effective_expiration: lot.effective_expiration || '',
    location_name: lot.location_name || ''
  });

  // Protection contre lot undefined
  if (!lot) {
    return null;
  }

  const daysLeft = daysUntil(lot.effective_expiration);
  const status = getExpirationStatus(daysLeft);

  const handleSave = () => {
    if (onSave && typeof onSave === 'function') {
      onSave(editData);
    }
  };

  const handleCancel = () => {
    // Restaurer les données originales
    setEditData({
      qty_remaining: lot.qty_remaining || 0,
      unit: lot.unit || 'g',
      effective_expiration: lot.effective_expiration || '',
      location_name: lot.location_name || ''
    });
    if (onCancelEdit && typeof onCancelEdit === 'function') {
      onCancelEdit();
    }
  };

  return (
    <div className="lot-card">
      {isEditing ? (
        <div className="lot-edit-form">
          <div className="form-row">
            <div className="form-group">
              <label>Quantité</label>
              <input
                type="number"
                step="0.1"
                value={editData.qty_remaining}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  qty_remaining: e.target.value
                }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Unité</label>
              <select
                value={editData.unit}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  unit: e.target.value
                }))}
                className="form-select"
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="pièce">pièce</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Date d'expiration</label>
              <input
                type="date"
                value={editData.effective_expiration}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  effective_expiration: e.target.value
                }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Lieu</label>
              <input
                type="text"
                value={editData.location_name}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  location_name: e.target.value
                }))}
                placeholder="Ex: Frigo, Placard..."
                className="form-input"
              />
            </div>
          </div>
          
          <div className="edit-actions">
            <button onClick={handleCancel} className="btn-cancel">
              Annuler
            </button>
            <button onClick={handleSave} className="btn-save">
              Sauvegarder
            </button>
          </div>
        </div>
      ) : (
        <div className="lot-display">
          <div className="lot-main-info">
            <div className="lot-quantity">
              {formatQuantity(lot.qty_remaining, lot.unit, 1)}
            </div>
            <div className="lot-details">
              {lot.location_name && (
                <div className="lot-location">📍 {lot.location_name}</div>
              )}
              {lot.effective_expiration && (
                <div 
                  className="lot-expiry"
                  style={{ 
                    color: status.color,
                    backgroundColor: status.bgColor,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  {status.label}
                </div>
              )}
            </div>
          </div>
          
          <div className="lot-actions">
            <button onClick={onEdit} className="btn-edit" title="Modifier">
              <Edit2 size={14} />
            </button>
            <button onClick={onDelete} className="btn-delete" title="Supprimer">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .lot-card {
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1rem;
          transition: all 0.2s;
        }

        .lot-card:hover {
          border-color: var(--forest-300, #c8d8c8);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .lot-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .lot-main-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .lot-quantity {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--forest-800, #1a3a1a);
        }

        .lot-details {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .lot-location {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .lot-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-edit, .btn-delete {
          background: none;
          border: none;
          padding: 0.5rem;
          border-radius: 6px;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
        }

        .btn-edit:hover {
          background: #f0f9ff;
          color: #0ea5e9;
        }

        .btn-delete:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        .lot-edit-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .form-input, .form-select {
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: var(--forest-400, #a8c5a8);
          box-shadow: 0 0 0 3px rgba(168, 197, 168, 0.1);
        }

        .edit-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
        }

        .btn-cancel, .btn-save {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: #f9fafb;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .btn-cancel:hover {
          background: #f3f4f6;
        }

        .btn-save {
          background: var(--forest-500, #8bb58b);
          border: 1px solid var(--forest-500, #8bb58b);
          color: white;
        }

        .btn-save:hover {
          background: var(--forest-600, #6b9d6b);
        }

        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
            gap: 0.75rem;
          }

          .lot-display {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
          }

          .lot-actions {
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
}

// Formulaire d'ajout de lot
function AddLotForm({ productName, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    qty_remaining: '',
    unit: 'g',
    effective_expiration: '',
    location_name: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && typeof onSubmit === 'function') {
      onSubmit(formData);
    }
  };

  return (
    <div className="add-form-overlay">
      <div className="add-form">
        <h3>Ajouter un lot pour {productName}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Quantité *</label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.qty_remaining}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  qty_remaining: e.target.value
                }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Unité</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  unit: e.target.value
                }))}
                className="form-select"
              >
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="l">l</option>
                <option value="pièce">pièce</option>
              </select>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Date d'expiration</label>
              <input
                type="date"
                value={formData.effective_expiration}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  effective_expiration: e.target.value
                }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Lieu</label>
              <input
                type="text"
                value={formData.location_name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  location_name: e.target.value
                }))}
                placeholder="Ex: Frigo, Placard..."
                className="form-input"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Annuler
            </button>
            <button type="submit" className="btn-submit">
              Ajouter le lot
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .add-form-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
        }

        .add-form {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          max-width: 400px;
          width: 100%;
        }

        .add-form h3 {
          margin: 0 0 1.5rem;
          color: var(--forest-800, #1a3a1a);
          font-size: 1.125rem;
        }

        .form-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }

        .form-input, .form-select {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .form-input:focus, .form-select:focus {
          outline: none;
          border-color: var(--forest-400, #a8c5a8);
          box-shadow: 0 0 0 3px rgba(168, 197, 168, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .btn-cancel, .btn-submit {
          flex: 1;
          padding: 0.75rem;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: #f9fafb;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .btn-cancel:hover {
          background: #f3f4f6;
        }

        .btn-submit {
          background: var(--forest-500, #8bb58b);
          border: 1px solid var(--forest-500, #8bb58b);
          color: white;
        }

        .btn-submit:hover {
          background: var(--forest-600, #6b9d6b);
        }

        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
