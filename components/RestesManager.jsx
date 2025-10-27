// components/RestesManager.jsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import './RestesManager.css';

const URGENCY_COLORS = {
  CRITIQUE: '#ef4444',
  URGENT: '#f97316',
  ATTENTION: '#f59e0b',
  BIENTÔT: '#eab308',
  NORMAL: '#84cc16',
  FRAIS: '#22c55e'
};

const ACTION_ICONS = {
  freeze: '🧊',
  preserve: '🥫',
  cook: '👨‍🍳',
  transform: '🔄',
  share: '🤝',
  consumed: '✅'
};

export default function RestesManager({ userId }) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [recipeSuggestions, setRecipeSuggestions] = useState(null);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all'); // all, critical, urgent, warning
  const [view, setView] = useState('grid'); // grid, list
  const [expandedRisk, setExpandedRisk] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    if (userId) {
      loadAnalysis();
    }
  }, [userId]);

  async function loadAnalysis() {
    setLoading(true);
    try {
      const response = await fetch('/api/restes/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          daysThreshold: 7,
          includeOpened: true,
          includeStats: true,
          includeRecipeSuggestions: true
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      setRecipeSuggestions(data.recipeSuggestions);
      setStats(data.stats);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du chargement de l\'analyse');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(risk, actionType) {
    setActionInProgress(risk.lotId);
    try {
      const response = await fetch('/api/restes/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          lotId: risk.lotId,
          actionType,
          quantitySaved: risk.quantity,
          notes: `Action sur ${risk.productName}`
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'action');
      }

      const data = await response.json();
      alert(data.message);
      
      // Recharger l'analyse
      await loadAnalysis();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'action');
    } finally {
      setActionInProgress(null);
    }
  }

  const filteredRisks = useMemo(() => {
    if (!analysis?.risks) return [];
    
    if (filter === 'all') return analysis.risks;
    if (filter === 'critical') return analysis.risks.filter(r => r.urgency.level === 'CRITIQUE');
    if (filter === 'urgent') return analysis.risks.filter(r => r.urgency.level === 'URGENT');
    if (filter === 'warning') return analysis.risks.filter(r => r.urgency.level === 'ATTENTION');
    
    return analysis.risks;
  }, [analysis, filter]);

  if (loading) {
    return (
      <div className="restes-manager loading">
        <div className="spinner"></div>
        <p>Analyse en cours...</p>
      </div>
    );
  }

  if (!analysis || analysis.risks.length === 0) {
    return (
      <div className="restes-manager empty">
        <div className="empty-state">
          <span className="empty-icon">🎉</span>
          <h2>Aucun produit à risque !</h2>
          <p>Tous vos produits sont en bon état. Continuez ainsi !</p>
          {stats && (
            <div className="empty-stats">
              <p>Ce mois-ci, vous avez sauvé <strong>{stats.quantitySaved}kg</strong> de nourriture</p>
              <p>Économies: <strong>{stats.estimatedMoneySaved}€</strong> | CO₂ évité: <strong>{stats.co2Saved}kg</strong></p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="restes-manager">
      {/* Header avec statistiques */}
      <div className="restes-header">
        <div className="header-title">
          <h1>🗑️ Gestion Anti-Gaspillage</h1>
          <p className="header-subtitle">{analysis.summary.message}</p>
        </div>
        
        <div className="header-stats">
          <StatCard
            icon="⚠️"
            label="À risque"
            value={analysis.stats.totalAtRisk}
            color="#ef4444"
          />
          <StatCard
            icon="🔥"
            label="Critiques"
            value={analysis.stats.criticalCount}
            color="#f97316"
          />
          <StatCard
            icon="⏰"
            label="Urgents"
            value={analysis.stats.urgentCount}
            color="#f59e0b"
          />
          {stats && (
            <>
              <StatCard
                icon="💰"
                label="Économisé"
                value={`${stats.estimatedMoneySaved}€`}
                color="#22c55e"
              />
              <StatCard
                icon="🌍"
                label="CO₂ évité"
                value={`${stats.co2Saved}kg`}
                color="#16a34a"
              />
            </>
          )}
        </div>
      </div>

      {/* Filtres et vue */}
      <div className="restes-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tous ({analysis.risks.length})
          </button>
          <button
            className={`filter-btn ${filter === 'critical' ? 'active' : ''}`}
            onClick={() => setFilter('critical')}
          >
            🔥 Critiques ({analysis.stats.criticalCount})
          </button>
          <button
            className={`filter-btn ${filter === 'urgent' ? 'active' : ''}`}
            onClick={() => setFilter('urgent')}
          >
            ⏰ Urgents ({analysis.stats.urgentCount})
          </button>
          <button
            className={`filter-btn ${filter === 'warning' ? 'active' : ''}`}
            onClick={() => setFilter('warning')}
          >
            ⚠️ Attention ({analysis.stats.warningCount})
          </button>
        </div>

        <div className="view-toggle">
          <button
            className={`view-btn ${view === 'grid' ? 'active' : ''}`}
            onClick={() => setView('grid')}
            title="Vue grille"
          >
            ▦
          </button>
          <button
            className={`view-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
            title="Vue liste"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Liste des produits à risque */}
      <div className={`restes-list ${view}`}>
        {filteredRisks.map(risk => (
          <RiskCard
            key={risk.lotId}
            risk={risk}
            expanded={expandedRisk === risk.lotId}
            onToggle={() => setExpandedRisk(expandedRisk === risk.lotId ? null : risk.lotId)}
            onAction={(actionType) => handleAction(risk, actionType)}
            isProcessing={actionInProgress === risk.lotId}
          />
        ))}
      </div>

      {/* Suggestions de recettes */}
      {recipeSuggestions && recipeSuggestions.suggestions.length > 0 && (
        <div className="recipe-suggestions">
          <h2>💡 Recettes suggérées</h2>
          <p className="suggestions-subtitle">
            {recipeSuggestions.message}
          </p>
          <div className="suggestions-list">
            {recipeSuggestions.suggestions.slice(0, 5).map(suggestion => (
              <RecipeSuggestionCard
                key={suggestion.recipeId}
                suggestion={suggestion}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ COMPOSANTS ============

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <span className="stat-icon" style={{ color }}>{icon}</span>
      <div className="stat-content">
        <div className="stat-value" style={{ color }}>{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

function RiskCard({ risk, expanded, onToggle, onAction, isProcessing }) {
  const urgencyColor = URGENCY_COLORS[risk.urgency.level] || '#6b7280';

  return (
    <div className="risk-card" style={{ borderLeftColor: urgencyColor }}>
      <div className="risk-header" onClick={onToggle}>
        <div className="risk-main">
          <div className="risk-product">
            <span className="product-name">{risk.productName}</span>
            {risk.isOpened && <span className="opened-badge">📦 Ouvert</span>}
          </div>
          <div className="risk-info">
            <span className="quantity">{risk.quantity} {risk.unit}</span>
            <span className="location">{risk.locationIcon} {risk.location}</span>
          </div>
        </div>

        <div className="risk-urgency">
          <div className="urgency-badge" style={{ backgroundColor: urgencyColor }}>
            {risk.urgency.level}
          </div>
          <div className="days-left">
            {risk.daysLeft < 0 ? (
              <span className="expired">PÉRIMÉ</span>
            ) : risk.daysLeft === 0 ? (
              <span className="today">Expire aujourd'hui</span>
            ) : risk.daysLeft === 1 ? (
              <span className="tomorrow">Expire demain</span>
            ) : (
              <span>Dans {risk.daysLeft}j</span>
            )}
          </div>
          <div className="urgency-score">Score: {risk.urgency.score}/100</div>
        </div>

        <button className="expand-btn" onClick={(e) => { e.stopPropagation(); onToggle(); }}>
          {expanded ? '▼' : '▶'}
        </button>
      </div>

      {expanded && (
        <div className="risk-details">
          <div className="recommendation">
            <strong>Recommandation:</strong>
            <p>{risk.recommendation}</p>
          </div>

          <div className="actions">
            <h4>Actions possibles:</h4>
            <div className="action-buttons">
              {risk.actions.map(action => (
                <button
                  key={action.id}
                  className="action-btn"
                  onClick={() => onAction(action.id)}
                  disabled={isProcessing}
                  title={action.description}
                >
                  {ACTION_ICONS[action.id]} {action.label}
                </button>
              ))}
              <button
                className="action-btn consumed"
                onClick={() => onAction('consumed')}
                disabled={isProcessing}
              >
                ✅ Consommé
              </button>
            </div>
          </div>

          {isProcessing && (
            <div className="processing">
              <div className="spinner-small"></div>
              <span>Action en cours...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RecipeSuggestionCard({ suggestion }) {
  return (
    <div className="recipe-suggestion-card">
      <div className="suggestion-header">
        <h3>{suggestion.recipeName}</h3>
        <div className="match-badge">
          {suggestion.matchCount} produit{suggestion.matchCount > 1 ? 's' : ''}
        </div>
      </div>
      
      {suggestion.description && (
        <p className="suggestion-description">{suggestion.description}</p>
      )}

      <div className="suggestion-meta">
        <span>⏱️ {suggestion.prepTime + suggestion.cookTime} min</span>
        <span>👥 {suggestion.servings} pers.</span>
        <span>📊 Score: {Math.round(suggestion.urgencyScore)}</span>
      </div>

      <div className="suggestion-products">
        <strong>Produits utilisés:</strong>
        <div className="products-tags">
          {suggestion.matchingProducts.map((product, index) => (
            <span key={index} className="product-tag">{product}</span>
          ))}
        </div>
      </div>

      <div className="suggestion-impact">
        <span>💰 ≈ {suggestion.wasteReduction.estimatedValue}€ sauvés</span>
        <span>🌍 ≈ {suggestion.wasteReduction.co2}kg CO₂</span>
      </div>

      <button className="view-recipe-btn">
        Voir la recette →
      </button>
    </div>
  );
}
