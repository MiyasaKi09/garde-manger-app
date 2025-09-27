/* ========================================
   FICHIER: app/pantry/pantry.css
   THÈME: Glassmorphisme nature (sans fond)
   ======================================== */

/* Container principal SANS FOND et SANS TITRE */
.pantry-container {
  min-height: 100vh;
  padding: 2rem;
  padding-top: 2rem; /* Plus d'espace en haut */
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
}

/* Contrôles du haut - Tout sur une ligne avec espacements */
.top-controls {
  margin-bottom: 3rem; /* Plus d'espace vertical */
}

/* Barre de recherche et filtres redessinés - COMPACTE */
.search-filters {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem; /* Espace entre filtres et stats */
  flex-wrap: wrap;
  align-items: center;
}

/* Input de recherche principal */
.search-input {
  flex: 1;
  min-width: 280px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  padding: 0.8rem 1.2rem; /* Réduit le padding */
  font-size: 0.95rem; /* Légèrement plus petit */
  color: #2e7d32;
  outline: none;
  transition: all 0.3s ease;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.search-input::placeholder {
  color: rgba(46, 125, 50, 0.6);
  font-weight: 400;
}

.search-input:focus {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.28);
  border-color: rgba(102, 187, 106, 0.4);
  box-shadow: 
    0 8px 24px rgba(102, 187, 106, 0.15),
    0 4px 16px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

/* Selects de filtrage */
.filter-select {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 0.8rem 1.2rem;
  color: #2e7d32;
  font-size: 0.9rem; /* Légèrement plus petit */
  font-weight: 500;
  outline: none;
  cursor: pointer;
  transition: all 0.3s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23388e3c' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.8rem center;
  background-repeat: no-repeat;
  background-size: 1.2em 1.2em;
  padding-right: 2.5rem;
  min-width: 140px;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.filter-select:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.filter-select:focus {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.28);
  border-color: rgba(102, 187, 106, 0.4);
  box-shadow: 
    0 6px 20px rgba(102, 187, 106, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

/* Options du select */
.filter-select option {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  color: #2e7d32;
  font-weight: 500;
  padding: 0.5rem;
}

/* Stats inline - sur une seule ligne */
.stats-inline {
  display: flex;
  gap: 2rem;
  align-items: center;
  justify-content: flex-start;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.8rem 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  user-select: none;
  min-width: 80px;
}

.stat-item:hover {
  transform: translateY(-2px) scale(1.005);
  background: rgba(255, 255, 255, 0.28);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}

.stat-item .stat-number {
  font-size: 1.4rem;
  font-weight: 700;
  background: linear-gradient(135deg, #43a047, #66bb6a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: 1;
}

.stat-item .stat-label {
  color: rgba(46, 125, 50, 0.9);
  font-size: 0.65rem;
  margin-top: 0.2rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  text-align: center;
}

/* Grille de produits - PLUS D'ESPACE ENTRE LES CARTES */
.pantry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* 300px au lieu de 320px */
  gap: 1.5rem; /* Gap augmenté pour plus d'espace */
  animation: gridFadeIn 0.6s ease-out;
}

@keyframes gridFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Carte produit SANS BOUTONS, CLIQUABLE */
.product-card {
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px; /* Bordures légèrement moins arrondies */
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 1.2rem; /* Padding légèrement réduit */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.5s ease-out;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  cursor: pointer;
  position: relative;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.product-card:hover {
  transform: translateY(-6px) scale(1.01); /* Effet légèrement réduit */
  box-shadow: 
    0 10px 24px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.25);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.8rem; /* Margin réduite */
  padding-bottom: 0.8rem; /* Padding réduit */
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.card-header h3 {
  color: #2e7d32;
  font-size: 1.1rem; /* Taille réduite */
  margin: 0;
  flex: 1;
  font-weight: 600; /* Légèrement plus gras */
  line-height: 1.3;
}

.category-badge {
  background: rgba(76, 175, 80, 0.15);
  backdrop-filter: blur(8px);
  color: #2e7d32;
  padding: 0.25rem 0.5rem; /* Padding réduit */
  border-radius: 8px; /* Bordures moins arrondies */
  font-size: 0.65rem; /* Plus petit */
  border: 1px solid rgba(76, 175, 80, 0.25);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-left: 0.5rem;
}

.card-body {
  margin-bottom: 0.5rem;
}

.info-row {
  color: #424242;
  margin-bottom: 0.5rem; /* Margin réduite */
  font-size: 0.85rem; /* Taille réduite */
  display: flex;
  align-items: center;
  gap: 0.5rem; /* Gap réduit */
}

.info-icon {
  font-size: 0.9rem; /* Taille réduite */
  opacity: 0.8;
  width: 16px;
  flex-shrink: 0;
}

.info-value {
  color: #2e7d32;
  font-weight: 500;
}

/* Statut d'expiration avec glassmorphism - PLUS COMPACT */
.status-badge {
  padding: 0.4rem 0.8rem; /* Padding réduit */
  border-radius: 10px; /* Bordures moins arrondies */
  font-weight: 600;
  font-size: 0.75rem; /* Taille réduite */
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  align-self: flex-start;
  margin-top: 0.25rem;
}

.status-good {
  background: rgba(102, 187, 106, 0.15);
  border: 1px solid rgba(102, 187, 106, 0.3);
  color: #2e7d32;
}

.status-expiring {
  background: rgba(255, 183, 77, 0.15);
  border: 1px solid rgba(255, 183, 77, 0.3);
  color: #e65100;
}

.status-expired {
  background: rgba(239, 83, 80, 0.15);
  border: 1px solid rgba(239, 83, 80, 0.3);
  color: #c62828;
}

/* Actions de la carte - COMPACTES */
.card-actions {
  display: flex;
  gap: 0.4rem; /* Gap réduit */
  margin-top: 0.8rem; /* Margin réduite */
  padding-top: 0.8rem; /* Padding réduit */
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.action-btn {
  flex: 1;
  padding: 0.4rem 0.6rem; /* Padding réduit */
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(76, 175, 80, 0.3);
  border-radius: 8px; /* Bordures moins arrondies */
  color: #2e7d32;
  font-size: 0.7rem; /* Taille réduite */
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
}

.action-btn:hover {
  transform: translateY(-1px); /* Effet réduit */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn.consume:hover {
  background: rgba(102, 187, 106, 0.3);
  border-color: rgba(102, 187, 106, 0.5);
}

.action-btn.edit:hover {
  background: rgba(66, 165, 245, 0.3);
  border-color: rgba(66, 165, 245, 0.5);
}

.action-btn.delete:hover {
  background: rgba(239, 83, 80, 0.3);
  border-color: rgba(239, 83, 80, 0.5);
  color: #c62828;
}

/* État vide */
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 2rem; /* Padding réduit */
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px; /* Bordures moins arrondies */
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #2e7d32;
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.empty-state h2 {
  font-size: 1.5rem; /* Taille réduite */
  margin-bottom: 0.8rem; /* Margin réduite */
  color: #388e3c;
}

.empty-state p {
  color: #558b2f;
  font-size: 1rem; /* Taille réduite */
}

/* Loading */
.pantry-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(102, 187, 106, 0.2);
  border-top-color: #66bb6a;
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.pantry-loading p {
  color: #388e3c;
  font-size: 1.1rem;
  font-weight: 500;
}

/* Bouton flottant */
.pantry-fab {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #66bb6a, #43a047);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: white;
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  box-shadow: 
    0 4px 16px rgba(76, 175, 80, 0.3),
    0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.pantry-fab:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 
    0 8px 24px rgba(76, 175, 80, 0.4),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Version mobile optimisée */
@media (max-width: 768px) {
  .pantry-container {
    padding: 1rem;
  }

  .search-filters {
    flex-direction: column;
    gap: 0.8rem;
  }

  .search-input {
    min-width: 100%;
    padding: 0.9rem 1.2rem;
  }

  .filter-select {
    width: 100%;
    padding: 0.75rem 1rem;
    padding-right: 2.2rem;
  }

  .top-controls {
    margin-bottom: 2rem;
  }

  .search-filters {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .search-input {
    min-width: 100%;
    padding: 0.9rem 1.2rem;
  }

  .filter-select {
    width: 100%;
    padding: 0.75rem 1rem;
    padding-right: 2.2rem;
  }

  .stats-cards {
    margin-left: 0;
    gap: 0.8rem;
    justify-content: space-between;
    margin-top: 1rem;
  }

  .stat-card {
    padding: 0.6rem 0.8rem;
    min-width: 70px;
    flex: 1;
  }

  .stat-number {
    font-size: 1.2rem;
  }

  .stat-label {
    font-size: 0.6rem;
  }

  .pantry-grid {
    grid-template-columns: 1fr;
    gap: 1rem; /* Gap normal sur mobile */
  }

  .product-card {
    padding: 1rem;
  }

  .card-header h3 {
    font-size: 1rem;
  }

  .action-btn {
    font-size: 0.65rem;
    padding: 0.35rem 0.5rem;
  }
}
