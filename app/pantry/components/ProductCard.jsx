// app/pantry/components/ProductCard.js
'use client';

import { Calendar, MapPin, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Package } from 'lucide-react';
import LifespanBadge from './LifespanBadge';
import { daysUntil, formatDate, getCategoryIcon } from './pantryUtils';


export function ProductCard({
  product,
  lots = [],
  onUpdateLot,
  onDeleteLot,
  onConsumeProduct,
  expanded = false,
  onToggleExpand
}) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  const totalQuantity = lots.reduce(
    (sum, lot) => sum + Number(lot.qty ?? lot.qty_remaining ?? 0),
    0
  );

  // FEFO: lot le plus proche de l’expiration
  const nextExpiringLot = [...lots]
    .filter(l => l?.dlc || l?.expiration_date || l?.effective_expiration)
    .sort((a, b) => {
      const da = new Date(a.dlc || a.expiration_date || a.effective_expiration);
      const db = new Date(b.dlc || b.expiration_date || b.effective_expiration);
      return da - db;
    })[0];

  const nextExpiryDate =
    nextExpiringLot?.dlc ||
    nextExpiringLot?.expiration_date ||
    nextExpiringLot?.effective_expiration ||
    null;

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggleExpand?.(newExpanded);
  };

  return (
    <div className={`product-card ${isExpanded ? 'expanded' : ''}`}>
      {/* Header */}
      <div className="product-header" onClick={toggleExpanded}>
        <div className="product-main-info">
          <div className="product-icon">
            {getCategoryIcon(product.category?.name)}
          </div>

          <div className="product-details">
            <h3 className="product-name">
              {product.name || product.display_name}
            </h3>

            <div className="product-meta">
              {product.category?.name && (
                <span className="product-category">
                  {product.category.name}
                </span>
              )}

              <span className="product-quantity">
                {totalQuantity.toFixed(1)} {product.default_unit || 'unité'}
                {lots.length > 1 && (
                  <span className="lots-count">({lots.length} lots)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Statut expiration via Badge */}
        <div className="expiration-status">
          <LifespanBadge date={nextExpiryDate} size="md" />
          {nextExpiryDate && (
            <div className="expiry-date">{formatDate(nextExpiryDate)}</div>
          )}
        </div>

        <div className={`expand-indicator ${isExpanded ? 'expanded' : ''}`}>
          ▼
        </div>
      </div>

      {/* Détails étendus */}
      {isExpanded && (
        <div className="product-expanded">
          {lots.length === 0 ? (
            <div className="no-lots">
              <Package size={24} />
              <p>Aucun lot en stock</p>
            </div>
          ) : (
            <div className="lots-list">
              <h4 className="lots-title">Lots en stock ({lots.length})</h4>

              {lots.map(lot => (
                <LotCard
                  key={lot.id}
                  lot={lot}
                  onUpdate={onUpdateLot}
                  onDelete={onDeleteLot}
                />
              ))}
            </div>
          )}

          {/* Action produit */}
          <div className="product-actions">
            {onConsumeProduct && totalQuantity > 0 && (
              <button
                onClick={() => onConsumeProduct(product)}
                className="btn-consume"
              >
                Consommer
              </button>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .product-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .product-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          border-color: #d1d5db;
        }
        .product-card.expanded {
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }
        .product-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .product-header:hover { background: #f9fafb; }
        .product-main-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .product-icon {
          font-size: 24px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 8px;
        }
        .product-details { flex: 1; }
        .product-name {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 4px 0;
        }
        .product-meta {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }
        .product-category {
          background: #ddd6fe;
          color: #7c3aed;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
        .product-quantity {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }
        .lots-count { color: #9ca3af; margin-left: 4px; }
        .expiration-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .expiry-date { font-size: 12px; color: #6b7280; }
        .expand-indicator {
          color: #9ca3af;
          transition: transform 0.2s;
          font-size: 12px;
        }
        .expand-indicator.expanded { transform: rotate(180deg); }
        .product-expanded {
          border-top: 1px solid #f3f4f6;
          padding: 16px;
          background: #fafafa;
        }
        .no-lots {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px;
          color: #9ca3af;
          text-align: center;
        }
        .lots-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 12px 0;
        }
        .lots-list { display: flex; flex-direction: column; gap: 8px; }
        .product-actions { margin-top: 16px; display: flex; gap: 8px; }
        .btn-consume {
          background: #059669; color: white; border: none;
          padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;
          cursor: pointer; transition: background-color 0.2s;
        }
        .btn-consume:hover { background: #047857; }
      `}</style>
    </div>
  );
}

// —————————————————————— LotCard ——————————————————————
function LotCard({ lot, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    qty: lot.qty ?? lot.qty_remaining ?? 0,
    expiration_date:
      lot.dlc || lot.expiration_date || lot.effective_expiration || '',
    notes: lot.notes || lot.note || ''
  });

  const d = daysUntil(editData.expiration_date);

  const handleSave = async () => {
    const success = await onUpdate?.(lot.id, {
      qty: editData.qty,
      qty_remaining: editData.qty,
      expiration_date: editData.expiration_date,
      notes: editData.notes
    });
    if (success) setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Supprimer ce lot ?')) onDelete?.(lot.id);
  };

  return (
    <div className="lot-card">
      <div className="lot-header">
        <div className="lot-info">
          <div className="lot-quantity">
            {isEditing ? (
              <input
                type="number"
                step="0.1"
                value={editData.qty}
                onChange={e =>
                  setEditData(prev => ({ ...prev, qty: e.target.value }))
                }
                className="qty-input"
              />
            ) : (
              <span>{(lot.qty ?? lot.qty_remaining ?? 0).toFixed(1)}</span>
            )}
            <span className="unit">{lot.unit}</span>
          </div>

          {/* Badge DLC pour chaque lot */}
          <LifespanBadge date={editData.expiration_date} size="sm" />
        </div>

        {/* Edition date si besoin */}
        {isEditing && (
          <div className="lot-edit-date">
            <input
              type="date"
              value={editData.expiration_date}
              onChange={e =>
                setEditData(prev => ({
                  ...prev,
                  expiration_date: e.target.value
                }))
              }
              className="date-input"
            />
          </div>
        )}
      </div>

      {(lot.notes || lot.note || isEditing) && (
        <div className="lot-notes">
          {isEditing ? (
            <textarea
              value={editData.notes}
              onChange={e =>
                setEditData(prev => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Notes..."
              className="notes-input"
              rows="2"
            />
          ) : (
            <p>{lot.notes || lot.note}</p>
          )}
        </div>
      )}

      <div className="lot-actions">
        {isEditing ? (
          <>
            <button onClick={handleSave} className="btn-save">Sauver</button>
            <button onClick={() => setIsEditing(false)} className="btn-cancel">Annuler</button>
          </>
        ) : (
          <>
            <button onClick={() => setIsEditing(true)} className="btn-edit">Modifier</button>
            <button onClick={handleDelete} className="btn-delete">Supprimer</button>
          </>
        )}
      </div>

      <style jsx>{`
        .lot-card {
          background: white; border: 1px solid #e5e7eb; border-radius: 8px;
          padding: 12px; transition: all 0.2s;
        }
        .lot-card:hover { border-color: #d1d5db; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .lot-header {
          display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;
        }
        .lot-info { display: flex; flex-direction: column; gap: 6px; }
        .lot-quantity { display: flex; align-items: center; gap: 4px; font-weight: 600; color: #111827; }
        .unit { color: #6b7280; font-weight: normal; font-size: 14px; }
        .lot-edit-date { margin-left: 8px; }
        .lot-notes {
          margin: 8px 0; padding: 8px; background: #f9fafb; border-radius: 6px;
          font-size: 12px; color: #6b7280;
        }
        .lot-notes p { margin: 0; font-style: italic; }
        .lot-actions { display: flex; gap: 6px; margin-top: 8px; }
        .lot-actions button { padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; transition: all 0.2s; }
        .btn-edit, .btn-save { background: #e0f2fe; color: #0369a1; border: 1px solid #0369a1; }
        .btn-edit:hover, .btn-save:hover { background: #0369a1; color: white; }
        .btn-delete, .btn-cancel { background: #fef2f2; color: #dc2626; border: 1px solid #dc2626; }
        .btn-delete:hover, .btn-cancel:hover { background: #dc2626; color: white; }
        .qty-input, .date-input {
          padding: 2px 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; width: 100px;
        }
        .notes-input { width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 12px; resize: vertical; }
      `}</style>
    </div>
  );
}

export default ProductCard;
