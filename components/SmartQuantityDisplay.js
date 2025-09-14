// ================================================================
// components/SmartQuantityDisplay.js - AFFICHAGE INTELLIGENT
// ================================================================

import { useState, useEffect } from 'react';
import { IntelligentUnitConverter } from '@/lib/productIntelligenceService';

export function SmartQuantityDisplay({ 
  quantity, 
  unit, 
  productName, 
  onConversionChange = null,
  showAlternatives = true,
  clickable = true 
}) {
  const [conversions, setConversions] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedConversion, setSelectedConversion] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const converter = new IntelligentUnitConverter();

  // Charger les conversions
  useEffect(() => {
    if (quantity && unit && productName) {
      loadConversions();
    }
  }, [quantity, unit, productName]);

  const loadConversions = async () => {
    setLoading(true);
    try {
      const result = await converter.convertQuantity(quantity, unit, productName);
      setConversions(result);
      
      // Sélectionner la conversion par défaut (la première alternative ou l'originale)
      if (result && !selectedConversion) {
        setSelectedConversion(result.original);
      }
    } catch (error) {
      console.error('Erreur conversion:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversionClick = (conversion) => {
    setSelectedConversion(conversion);
    if (onConversionChange) {
      onConversionChange(conversion);
    }
  };

  const toggleShowAll = () => {
    setShowAll(!showAll);
  };

  // Affichage simple si pas de conversions ou pas clickable
  if (!conversions || !showAlternatives || !clickable) {
    return (
      <div style={{
        fontSize: '1.5rem',
        fontWeight: '700',
        color: 'var(--earth-600)',
        lineHeight: 1
      }}>
        {loading ? '...' : `${quantity} ${unit}`}
      </div>
    );
  }

  const displayConversion = selectedConversion || conversions.original;
  const hasAlternatives = conversions.alternatives.length > 0;
  const visibleAlternatives = showAll ? conversions.alternatives : conversions.alternatives.slice(0, 2);

  return (
    <div style={{
      position: 'relative',
      cursor: clickable && hasAlternatives ? 'pointer' : 'default'
    }}>
      {/* Quantité principale */}
      <div 
        style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'var(--earth-600)',
          lineHeight: 1,
          padding: '0.25rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          background: selectedConversion !== conversions.original ? 'var(--forest-50)' : 'transparent',
          transition: 'all 0.2s ease',
          border: selectedConversion !== conversions.original ? '1px solid var(--forest-200)' : '1px solid transparent'
        }}
        onClick={() => clickable && handleConversionClick(conversions.original)}
        title={clickable ? 'Quantité originale' : ''}
      >
        {Math.round(displayConversion.value * 100) / 100} {displayConversion.unit}
      </div>

      {/* Conversions alternatives */}
      {hasAlternatives && showAlternatives && (
        <div style={{
          marginTop: '0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          {visibleAlternatives.map((conversion, index) => (
            <div
              key={`${conversion.unit}-${index}`}
              style={{
                fontSize: '0.85rem',
                color: selectedConversion?.unit === conversion.unit ? 'var(--forest-700)' : 'var(--forest-500)',
                background: selectedConversion?.unit === conversion.unit ? 'var(--forest-100)' : 'transparent',
                padding: '0.25rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                cursor: clickable ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                border: selectedConversion?.unit === conversion.unit ? '1px solid var(--forest-300)' : '1px solid transparent',
                fontWeight: selectedConversion?.unit === conversion.unit ? '600' : '400'
              }}
              onClick={() => clickable && handleConversionClick(conversion)}
              onMouseEnter={e => {
                if (clickable) {
                  e.target.style.background = 'var(--forest-50)';
                }
              }}
              onMouseLeave={e => {
                if (clickable && selectedConversion?.unit !== conversion.unit) {
                  e.target.style.background = 'transparent';
                }
              }}
              title={clickable ? `Convertir en ${conversion.unit}` : ''}
            >
              ≈ {conversion.label}
            </div>
          ))}
          
          {/* Bouton pour voir plus/moins */}
          {conversions.alternatives.length > 2 && (
            <button
              onClick={toggleShowAll}
              style={{
                fontSize: '0.75rem',
                color: 'var(--forest-400)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                textAlign: 'left',
                textDecoration: 'underline'
              }}
            >
              {showAll 
                ? `▲ Masquer ${conversions.alternatives.length - 2} conversion${conversions.alternatives.length - 2 > 1 ? 's' : ''}`
                : `▼ Voir ${conversions.alternatives.length - 2} conversion${conversions.alternatives.length - 2 > 1 ? 's' : ''} de plus`
              }
            </button>
          )}
        </div>
      )}

      {/* Indicateur de source d'intelligence */}
      {conversions && conversions.source && (
        <div style={{
          fontSize: '0.7rem',
          color: 'var(--medium-gray)',
          marginTop: '0.25rem',
          opacity: 0.6
        }}>
          {conversions.source === 'reference_db' && '🧠 IA avancée'}
          {conversions.source === 'basic_rules' && '📏 Conversion basique'}
        </div>
      )}
    </div>
  );
}

// ================================================================
// components/IntelligentProductCard.js - CARTE PRODUIT INTELLIGENTE
// ================================================================

import { useMemo, useState } from 'react';
import { daysUntil } from '@/lib/dates';
import { LifespanBadge } from './LifespanBadge';
import { SmartQuantityDisplay } from './SmartQuantityDisplay';
import { useProductIntelligence } from '@/hooks/useProductIntelligence';

export function IntelligentProductCard({ 
  productId, 
  name, 
  category, 
  unit, 
  lots = [], 
  onOpen, 
  onQuickAction 
}) {
  const [selectedQuantityConversion, setSelectedQuantityConversion] = useState(null);
  
  const { total, nextDate, locations, urgentCount, intelligence, priorityScore } = useMemo(() => {
    let total = 0;
    let nextDate = null;
    const locSet = new Set();
    let urgentCount = 0;
    
    for (const lot of lots) {
      total += Number(lot.qty || 0);
      if (lot.location?.name) {
        locSet.add(lot.location.name);
      }
      
      const d = lot.dlc || lot.best_before;
      if (d && (nextDate === null || new Date(d) < new Date(nextDate))) {
        nextDate = d;
      }
      
      const days = daysUntil(d);
      if (days !== null && days <= 3) urgentCount++;
    }
    
    return { 
      total: Math.round(total * 100) / 100, 
      nextDate, 
      locations: [...locSet].slice(0, 3),
      urgentCount,
      intelligence: lots[0]?.intelligence || null, // Si disponible depuis le tri intelligent
      priorityScore: lots[0]?.priorityScore || 0
    };
  }, [lots]);

  const soon = nextDate ? daysUntil(nextDate) : null;
  const isUrgent = soon !== null && soon <= 3;
  const isPriorityHigh = priorityScore > 70;

  return (
    <div 
      className={`card interactive ${isUrgent ? 'urgent' : ''} ${isPriorityHigh ? 'high-priority' : ''}`}
      onClick={() => onOpen && onOpen({ productId, name })}
      style={{ 
        cursor: 'pointer',
        position: 'relative',
        borderLeft: isPriorityHigh ? '4px solid var(--forest-500)' : undefined
      }}
    >
      {/* Indicateur de priorité */}
      {isPriorityHigh && (
        <div style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          background: 'var(--forest-500)',
          color: 'white',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.7rem',
          fontWeight: '700'
        }}>
          !
        </div>
      )}

      {/* En-tête avec nom et badge */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'start',
        marginBottom: '1rem' 
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '1.25rem',
            color: 'var(--forest-800)',
            fontFamily: "'Crimson Text', Georgia, serif"
          }}>
            {name}
          </h3>
          
          {/* Informations intelligentes */}
          <div style={{
            fontSize: '0.85rem',
            color: 'var(--forest-600)',
            marginTop: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <span>📂 {category}</span>
            {intelligence?.optimal_storage && (
              <span title={`Stockage optimal: ${intelligence.optimal_storage}`}>
                📍 {intelligence.optimal_storage}
              </span>
            )}
            {priorityScore > 0 && (
              <span 
                title={`Score de priorité: ${priorityScore}/100`}
                style={{
                  background: isPriorityHigh ? 'var(--forest-200)' : 'var(--earth-200)',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '999px',
                  fontSize: '0.7rem',
                  fontWeight: '600'
                }}
              >
                🎯 {priorityScore}
              </span>
            )}
          </div>
        </div>
        <LifespanBadge date={nextDate} />
      </div>

      {/* Quantité avec conversion intelligente */}
      <div style={{
        background: 'var(--earth-50)',
        padding: '1rem',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1rem',
        textAlign: 'center',
        position: 'relative'
      }}>
        <SmartQuantityDisplay
          quantity={total}
          unit={unit}
          productName={name}
          onConversionChange={setSelectedQuantityConversion}
          clickable={true}
          showAlternatives={true}
        />
        
        {urgentCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: 'var(--danger)',
            color: 'white',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700',
            animation: 'pulse-urgent 2s ease-in-out infinite'
          }}>
            {urgentCount}
          </div>
        )}
      </div>

      {/* Informations sur les lots */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem',
        fontSize: '0.9rem',
        color: 'var(--forest-600)'
      }}>
        <span>📦 {lots.length} lot{lots.length > 1 ? 's' : ''}</span>
        
        {urgentCount > 0 && (
          <span className="badge warning" style={{ fontSize: '0.75rem' }}>
            {urgentCount} urgent{urgentCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Lieux de stockage */}
      {locations.length > 0 && (
        <div style={{
          fontSize: '0.85rem',
          color: 'var(--forest-500)',
          marginBottom: '1rem'
        }}>
          📍 {locations.join(', ')}
          {locations.length === 3 && '...'}
        </div>
      )}

      {/* Recommendations intelligentes */}
      {intelligence && (
        <div style={{
          background: 'var(--forest-50)',
          padding: '0.75rem',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '1rem',
          border: '1px solid var(--forest-200)'
        }}>
          <div style={{
            fontSize: '0.8rem',
            color: 'var(--forest-600)',
            marginBottom: '0.5rem',
            fontWeight: '600'
          }}>
            🧠 Intelligence IA:
          </div>
          
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--forest-700)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}>
            {intelligence.shelf_life_fridge && (
              <span>⏰ Conservation frigo: {intelligence.shelf_life_fridge} jours</span>
            )}
            {intelligence.calories_per_100g && (
              <span>🔥 {intelligence.calories_per_100g} kcal/100g</span>
            )}
            {intelligence.is_vegan && (
              <span>🌱 Produit végan</span>
            )}
            {intelligence.optimal_temperature_min && intelligence.optimal_temperature_max && (
              <span>🌡️ {intelligence.optimal_temperature_min}°C à {intelligence.optimal_temperature_max}°C</span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          className="btn primary small"
          onClick={(e) => {
            e.stopPropagation();
            onOpen && onOpen({ productId, name });
          }}
          style={{ flex: 1 }}
        >
          👁️ Détails
        </button>
        
        <button
          className="btn secondary small"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAction && onQuickAction('add', { productId, name, category });
          }}
          title="Ajouter un lot"
        >
          ➕
        </button>
      </div>
    </div>
  );
}

// ================================================================
// components/IntelligentRecommendations.js - RECOMMANDATIONS IA
// ================================================================

export function IntelligentRecommendations({ recommendations, onRecommendationClick }) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const groupedRecs = recommendations.reduce((acc, rec) => {
    const priority = rec.priority || 'medium';
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(rec);
    return acc;
  }, {});

  const priorityOrder = ['critical', 'high', 'medium', 'low'];
  const priorityColors = {
    critical: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
    high: { bg: '#fef3c7', border: '#fcd34d', text: '#92400e' },
    medium: { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
    low: { bg: '#f0f9ff', border: '#bae6fd', text: '#0c4a6e' }
  };

  const priorityLabels = {
    critical: '🚨 Critique',
    high: '⚠️ Important',
    medium: '💡 Conseil',
    low: '📝 Information'
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.5rem',
      marginBottom: '2rem',
      border: '1px solid var(--forest-200)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <h3 style={{
        margin: '0 0 1rem 0',
        color: 'var(--forest-800)',
        fontFamily: "'Crimson Text', Georgia, serif",
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        🧠 Recommandations Intelligentes
      </h3>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        {priorityOrder.map(priority => {
          const recs = groupedRecs[priority];
          if (!recs) return null;

          const colors = priorityColors[priority];
          
          return (
            <div key={priority}>
              <h4 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.9rem',
                color: colors.text,
                fontWeight: '600'
              }}>
                {priorityLabels[priority]} ({recs.length})
              </h4>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {recs.map((rec, index) => (
                  <div
                    key={`${priority}-${index}`}
                    style={{
                      background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      cursor: onRecommendationClick ? 'pointer' : 'default',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => onRecommendationClick && onRecommendationClick(rec)}
                    onMouseEnter={e => {
                      if (onRecommendationClick) {
                        e.target.style.transform = 'translateY(-1px)';
                        e.target.style.boxShadow = 'var(--shadow-md)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (onRecommendationClick) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <span style={{ fontSize: '1.25rem' }}>
                        {rec.icon}
                      </span>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: '600',
                          color: colors.text,
                          marginBottom: '0.25rem'
                        }}>
                          {rec.title}
                        </div>
                        
                        <div style={{
                          fontSize: '0.85rem',
                          color: colors.text,
                          opacity: 0.8
                        }}>
                          {rec.message}
                        </div>
                      </div>
                      
                      {rec.action && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: colors.text,
                          background: 'rgba(255, 255, 255, 0.7)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: '600'
                        }}>
                          {rec.action === 'consume' && '🍽️ Consommer'}
                          {rec.action === 'check' && '🔍 Vérifier'}
                          {rec.action === 'plan_meals' && '📅 Planifier'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ================================================================
// components/SmartProductSearch.js - RECHERCHE INTELLIGENTE
// ================================================================

import { useState, useEffect } from 'react';
import { ProductIntelligenceService } from '@/lib/productIntelligenceService';

export function SmartProductSearch({ onProductSelect, placeholder = "Rechercher un produit..." }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const productService = new ProductIntelligenceService();

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await productService.searchProducts(query, 8);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Erreur recherche intelligente:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelectProduct = (product) => {
    setQuery(product.name);
    setShowSuggestions(false);
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  const handleInputBlur = () => {
    // Délai pour permettre le clic sur les suggestions
    setTimeout(() => setShowSuggestions(false), 200);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '2px solid var(--forest-300)',
          fontSize: '1rem',
          background: 'rgba(255, 255, 255, 0.95)'
        }}
      />
      
      {loading && (
        <div style={{
          position: 'absolute',
          right: '1rem',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '0.85rem',
          color: 'var(--medium-gray)'
        }}>
          🔍
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'white',
          border: '1px solid var(--forest-300)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000,
          marginTop: '0.25rem'
        }}>
          {suggestions.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              onClick={() => handleSelectProduct(product)}
              style={{
                padding: '0.75rem',
                borderBottom: index < suggestions.length - 1 ? '1px solid var(--soft-gray)' : 'none',
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={e => e.target.style.background = 'var(--forest-50)'}
              onMouseLeave={e => e.target.style.background = 'white'}
            >
              <div style={{
                fontWeight: '600',
                color: 'var(--forest-800)',
                marginBottom: '0.25rem'
              }}>
                {product.name}
              </div>
              
              <div style={{
                fontSize: '0.85rem',
                color: 'var(--forest-600)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span>📂 {product.category}</span>
                <span>📏 {product.primary_unit}</span>
                {product.relevance_score > 80 && (
                  <span style={{
                    background: 'var(--forest-200)',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    color: 'var(--forest-700)'
                  }}>
                    🎯 {Math.round(product.relevance_score)}%
                  </span>
                )}
              </div>
              
              {product.shelf_life_days_fridge && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--medium-gray)',
                  marginTop: '0.25rem'
                }}>
                  ⏰ Conservation: {product.shelf_life_days_fridge} jours au frigo
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ================================================================
// Export des composants
// ================================================================

export {
  SmartQuantityDisplay,
  IntelligentProductCard,
  IntelligentRecommendations,
  SmartProductSearch
};
