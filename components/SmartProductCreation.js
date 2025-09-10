// SmartProductCreation.js - Composant pour créer des produits avec métadonnées intelligentes

'use client';

import { useState, useEffect } from 'react';
import { estimateProductMeta, validateProductMeta, getAllCategories, estimateShelfLife, suggestDefaultUnit } from '@/lib/meta';

export function SmartProductCreationModal({ isOpen, onClose, onSave, initialName = '' }) {
  const [formData, setFormData] = useState({
    name: initialName,
    category: '',
    density_g_per_ml: 1.0,
    grams_per_unit: null,
    default_unit: 'g',
    description: '',
    typical_shelf_life_days: 7
  });

  const [estimatedMeta, setEstimatedMeta] = useState(null);
  const [validation, setValidation] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoMode, setAutoMode] = useState(true);

  // Estimation automatique quand nom/catégorie changent
  useEffect(() => {
    if (formData.name.trim()) {
      const meta = estimateProductMeta({
        name: formData.name,
        category: formData.category
      });
      
      setEstimatedMeta(meta);
      
      // Application automatique si mode auto activé
      if (autoMode) {
        setFormData(prev => ({
          ...prev,
          category: meta.category_suggestion || prev.category,
          density_g_per_ml: meta.density_g_per_ml,
          grams_per_unit: meta.grams_per_unit,
          default_unit: suggestDefaultUnit({
            name: formData.name,
            category: meta.category_suggestion || formData.category,
            estimated_meta: meta
          }),
          typical_shelf_life_days: estimateShelfLife({
            name: formData.name,
            category: meta.category_suggestion || formData.category
          })
        }));
      }
    }
  }, [formData.name, formData.category, autoMode]);

  // Validation en temps réel
  useEffect(() => {
    if (formData.density_g_per_ml || formData.grams_per_unit) {
      const validation = validateProductMeta({
        density_g_per_ml: formData.density_g_per_ml,
        grams_per_unit: formData.grams_per_unit,
        confidence_density: estimatedMeta?.confidence_density || 0.5,
        confidence_unit: estimatedMeta?.confidence_unit || 0.5
      });
      setValidation(validation);
    }
  }, [formData.density_g_per_ml, formData.grams_per_unit, estimatedMeta]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation finale
    if (!formData.name.trim()) {
      alert('Le nom du produit est obligatoire');
      return;
    }
    
    if (validation && !validation.isValid) {
      const proceed = confirm(
        `Attention, des problèmes ont été détectés :\n${validation.errors.join('\n')}\n\nContinuer quand même ?`
      );
      if (!proceed) return;
    }

    // Nettoyage des données
    const cleanData = {
      ...formData,
      name: formData.name.trim(),
      category: formData.category || estimatedMeta?.category_suggestion || 'Autre',
      grams_per_unit: formData.grams_per_unit || null,
      description: formData.description.trim() || null,
      // Métadonnées de création
      created_at: new Date().toISOString(),
      confidence_density: estimatedMeta?.confidence_density || 0.5,
      confidence_unit: estimatedMeta?.confidence_unit || 0.5,
      estimation_source: autoMode ? 'automatic' : 'manual'
    };

    await onSave(cleanData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="modal-header">
            <h2>🆕 Créer un nouveau produit</h2>
            <button type="button" className="btn-close" onClick={onClose}>✕</button>
          </div>

          {/* Mode automatique/manuel */}
          <div className="mode-switch">
            <label className="switch">
              <input
                type="checkbox"
                checked={autoMode}
                onChange={(e) => setAutoMode(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
            <div>
              <strong>Mode {autoMode ? 'Automatique' : 'Manuel'}</strong>
              <p className="mode-description">
                {autoMode 
                  ? '🤖 Les métadonnées sont estimées automatiquement'
                  : '✋ Vous saisissez toutes les valeurs manuellement'
                }
              </p>
            </div>
          </div>

          {/* Informations de base */}
          <div className="form-section">
            <h3>📝 Informations de base</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Nom du produit *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ex: Tomate Cœur de Bœuf"
                  required
                />
                {estimatedMeta?.debug?.search_text && (
                  <small className="search-info">
                    Recherche: "{estimatedMeta.debug.search_text}" • 
                    {estimatedMeta.debug.density_matches} correspondances densité • 
                    {estimatedMeta.debug.unit_matches} correspondances poids
                  </small>
                )}
              </div>

              <div className="form-group">
                <label>Catégorie</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">Choisir...</option>
                  {getAllCategories().map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {estimatedMeta?.category_suggestion && (
                  <small className="suggestion">
                    💡 Suggestion: {estimatedMeta.category_suggestion}
                    {formData.category !== estimatedMeta.category_suggestion && (
                      <button
                        type="button"
                        className="btn-apply-suggestion"
                        onClick={() => setFormData(prev => ({ 
                          ...prev, 
                          category: estimatedMeta.category_suggestion 
                        }))}
                      >
                        Appliquer
                      </button>
                    )}
                  </small>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Description (optionnelle)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Informations complémentaires, origine, particularités..."
                rows={2}
              />
            </div>
          </div>

          {/* Métadonnées physiques */}
          <div className="form-section">
            <div className="section-header">
              <h3>⚖️ Propriétés physiques</h3>
              <button
                type="button"
                className="btn-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? 'Masquer' : 'Afficher'} les détails
              </button>
            </div>

            {/* Aperçu simple */}
            {!showAdvanced && (
              <div className="properties-summary">
                <div className="property-card">
                  <span className="property-label">Densité</span>
                  <span className="property-value">
                    {formData.density_g_per_ml} g/ml
                    {estimatedMeta?.confidence_density && (
                      <small className={`confidence ${getConfidenceClass(estimatedMeta.confidence_density)}`}>
                        {Math.round(estimatedMeta.confidence_density * 100)}% sûr
                      </small>
                    )}
                  </span>
                </div>
                
                <div className="property-card">
                  <span className="property-label">Poids unitaire</span>
                  <span className="property-value">
                    {formData.grams_per_unit ? `${formData.grams_per_unit} g` : 'Non défini'}
                    {estimatedMeta?.confidence_unit && formData.grams_per_unit && (
                      <small className={`confidence ${getConfidenceClass(estimatedMeta.confidence_unit)}`}>
                        {Math.round(estimatedMeta.confidence_unit * 100)}% sûr
                      </small>
                    )}
                  </span>
                </div>

                <div className="property-card">
                  <span className="property-label">Unité par défaut</span>
                  <span className="property-value">{formData.default_unit}</span>
                </div>

                <div className="property-card">
                  <span className="property-label">Conservation</span>
                  <span className="property-value">{formData.typical_shelf_life_days} jours</span>
                </div>
              </div>
            )}

            {/* Formulaire détaillé */}
            {showAdvanced && (
              <div className="advanced-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      Densité (g/ml)
                      <InfoTooltip text="Pour convertir volume ↔ masse. Eau = 1.0, Huile ≈ 0.9, Miel ≈ 1.4" />
                    </label>
                    <div className="input-with-suggestion">
                      <input
                        type="number"
                        min="0.1"
                        max="3"
                        step="0.01"
                        value={formData.density_g_per_ml}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          density_g_per_ml: parseFloat(e.target.value) || 1.0 
                        }))}
                        disabled={autoMode}
                      />
                      {estimatedMeta && (
                        <div className="suggestion-info">
                          <small>
                            💡 Estimé: {estimatedMeta.density_g_per_ml} g/ml 
                            ({Math.round(estimatedMeta.confidence_density * 100)}% confiance)
                          </small>
                          {!autoMode && formData.density_g_per_ml !== estimatedMeta.density_g_per_ml && (
                            <button
                              type="button"
                              className="btn-apply-suggestion small"
                              onClick={() => setFormData(prev => ({ 
                                ...prev, 
                                density_g_per_ml: estimatedMeta.density_g_per_ml 
                              }))}
                            >
                              Utiliser
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      Poids par unité (g)
                      <InfoTooltip text="Pour convertir unités ↔ masse. Ex: 1 œuf ≈ 60g, 1 pomme ≈ 150g" />
                    </label>
                    <div className="input-with-suggestion">
                      <input
                        type="number"
                        min="0.1"
                        max="5000"
                        step="0.1"
                        value={formData.grams_per_unit || ''}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          grams_per_unit: e.target.value ? parseFloat(e.target.value) : null 
                        }))}
                        disabled={autoMode}
                        placeholder="Laisser vide si non applicable"
                      />
                      {estimatedMeta?.grams_per_unit && (
                        <div className="suggestion-info">
                          <small>
                            💡 Estimé: {estimatedMeta.grams_per_unit} g 
                            ({Math.round(estimatedMeta.confidence_unit * 100)}% confiance)
                          </small>
                          {!autoMode && formData.grams_per_unit !== estimatedMeta.grams_per_unit && (
                            <button
                              type="button"
                              className="btn-apply-suggestion small"
                              onClick={() => setFormData(prev => ({ 
                                ...prev, 
                                grams_per_unit: estimatedMeta.grams_per_unit 
                              }))}
                            >
                              Utiliser
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Unité par défaut</label>
                    <select
                      value={formData.default_unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, default_unit: e.target.value }))}
                      disabled={autoMode}
                    >
                      <option value="g">Grammes (g)</option>
                      <option value="kg">Kilogrammes (kg)</option>
                      <option value="ml">Millilitres (ml)</option>
                      <option value="cl">Centilitres (cl)</option>
                      <option value="l">Litres (l)</option>
                      <option value="u">Unités (u)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>
                      Conservation typique (jours)
                      <InfoTooltip text="Durée de conservation moyenne après achat" />
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="3650"
                      value={formData.typical_shelf_life_days}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        typical_shelf_life_days: parseInt(e.target.value) || 7 
                      }))}
                      disabled={autoMode}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Validation et warnings */}
          {validation && (
            <div className="validation-section">
              {validation.errors.length > 0 && (
                <div className="validation-errors">
                  <h4>⚠️ Problèmes détectés</h4>
                  <ul>
                    {validation.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="validation-warnings">
                  <h4>💡 Avertissements</h4>
                  <ul>
                    {validation.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn secondary" onClick={onClose}>
              Annuler
            </button>
            <button 
              type="submit" 
              className="btn primary"
              disabled={validation && !validation.isValid}
            >
              💾 Créer le produit
            </button>
          </div>
        </form>

        {/* Styles intégrés */}
        <style jsx>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .modal-content {
            background: white;
            border-radius: 16px;
            width: min(800px, 95vw);
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px 24px;
            border-bottom: 1px solid #eee;
          }

          .btn-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
          }

          .btn-close:hover {
            background: #f5f5f5;
          }

          .mode-switch {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 20px 24px;
            background: #f8f9fa;
            border-bottom: 1px solid #eee;
          }

          .switch {
            position: relative;
            display: inline-block;
            width: 50px;
            height: 24px;
          }

          .switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }

          .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 24px;
          }

          .slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
          }

          input:checked + .slider {
            background-color: #2196F3;
          }

          input:checked + .slider:before {
            transform: translateX(26px);
          }

          .mode-description {
            margin: 4px 0 0 0;
            color: #666;
            font-size: 14px;
          }

          .form-section {
            padding: 24px;
            border-bottom: 1px solid #eee;
          }

          .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          }

          .btn-toggle {
            background: #f0f0f0;
            border: none;
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          }

          .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
          }

          .form-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .form-group label {
            font-weight: 600;
            color: #333;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .form-group input,
          .form-group select,
          .form-group textarea {
            padding: 10px 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.2s;
          }

          .form-group input:focus,
          .form-group select:focus,
          .form-group textarea:focus {
            outline: none;
            border-color: #2196F3;
          }

          .form-group input:disabled {
            background: #f8f9fa;
            color: #6c757d;
          }

          .properties-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 12px;
          }

          .property-card {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .property-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            font-weight: 600;
          }

          .property-value {
            font-weight: 700;
            color: #333;
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .confidence {
            font-size: 11px;
            font-weight: 500;
            padding: 2px 6px;
            border-radius: 4px;
          }

          .confidence.high {
            background: #d4edda;
            color: #155724;
          }

          .confidence.medium {
            background: #fff3cd;
            color: #856404;
          }

          .confidence.low {
            background: #f8d7da;
            color: #721c24;
          }

          .input-with-suggestion {
            position: relative;
          }

          .suggestion-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 4px;
            padding: 6px 8px;
            background: #e3f2fd;
            border-radius: 4px;
          }

          .btn-apply-suggestion {
            background: #2196F3;
            color: white;
            border: none;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
          }

          .btn-apply-suggestion.small {
            padding: 2px 6px;
            font-size: 11px;
          }

          .search-info {
            color: #666;
            font-size: 12px;
            margin-top: 4px;
          }

          .suggestion {
            color: #2196F3;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .validation-section {
            padding: 20px 24px;
          }

          .validation-errors {
            background: #f8d7da;
            color: #721c24;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 12px;
          }

          .validation-warnings {
            background: #fff3cd;
            color: #856404;
            padding: 12px;
            border-radius: 8px;
          }

          .modal-actions {
            padding: 20px 24px;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            border-top: 1px solid #eee;
          }

          .btn {
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s;
          }

          .btn.primary {
            background: #2196F3;
            color: white;
          }

          .btn.primary:hover {
            background: #1976D2;
          }

          .btn.primary:disabled {
            background: #ccc;
            cursor: not-allowed;
          }

          .btn.secondary {
            background: #f8f9fa;
            color: #333;
            border-color: #dee2e6;
          }

          .btn.secondary:hover {
            background: #e9ecef;
          }

          @media (max-width: 768px) {
            .form-row {
              grid-template-columns: 1fr;
            }
            
            .properties-summary {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

// Composant tooltip informatif
function InfoTooltip({ text }) {
  return (
    <span className="info-tooltip" title={text}>
      ℹ️
      <style jsx>{`
        .info-tooltip {
          cursor: help;
          font-size: 14px;
        }
      `}</style>
    </span>
  );
}

// Helper pour les classes de confiance
function getConfidenceClass(confidence) {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}
