// Structure des composants modulaires pour le garde-manger

/* ============= FICHIERS À CRÉER ============= */

// 1. app/pantry/components/ProductAI.js
// Intelligence artificielle pour analyse des produits
export function analyzeProductName(productName) {
  // ... logique d'analyse IA
}

export function findLocationByType(locations, locationType) {
  // ... logique de suggestion de lieu
}

// 2. app/pantry/components/ProductSearch.js
// Recherche floue et scoring
export function fuzzyScore(needle, haystack) {
  // ... logique de recherche
}

export function levenshteinDistance(a, b) {
  // ... calcul de distance
}

// 3. app/pantry/components/UI/LifespanBadge.js
export function LifespanBadge({ date }) {
  // ... badge de durée de vie
}

// 4. app/pantry/components/UI/Stat.js
export function Stat({ value, label, tone }) {
  // ... carte de statistique
}

// 5. app/pantry/components/forms/SmartProductCreationModal.js
export function SmartProductCreationModal({ 
  isOpen, onClose, onSave, initialName, existingCategories, locations 
}) {
  // ... modal de création de produit
}

// 6. app/pantry/components/forms/SmartAddForm.js
export function SmartAddForm({ locations, onAdd, onClose }) {
  // ... formulaire d'ajout intelligent
}

// 7. app/pantry/components/cards/ProductCard.js
export function ProductCard({ 
  productId, name, category, unit, lots, onOpen, onQuickAction 
}) {
  // ... carte de produit
}

// 8. app/pantry/components/views/LotsView.js
export function LotsView({ lots, onDeleteLot, onUpdateLot }) {
  // ... vue par lots
}

// 9. app/pantry/components/controls/PantryControls.js
export function PantryControls({
  q, setQ, locFilter, setLocFilter, view, setView,
  showAddForm, setShowAddForm, locations, onRefresh
}) {
  // ... barre de contrôles
}

// 10. app/pantry/hooks/usePantryData.js
export function usePantryData() {
  // ... logique de données
}

// 11. app/pantry/utils/dateHelpers.js
export function daysUntil(date) {
  // ... helpers de date
}

export function fmtDate(d) {
  // ... formatage de date
}

// 12. app/pantry/utils/constants.js
export const glassBase = {
  // ... styles globaux
};

/* ============= PAGE PRINCIPALE SIMPLIFIÉE ============= */

// app/pantry/page.js
'use client';

import { useMemo } from 'react';
import { usePantryData } from './hooks/usePantryData';
import { PantryControls } from './components/controls/PantryControls';
import { SmartAddForm } from './components/forms/SmartAddForm';
import { ProductCard } from './components/cards/ProductCard';
import { LotsView } from './components/views/LotsView';
import { Stat } from './components/UI/Stat';
import { daysUntil } from './utils/dateHelpers';

export default function PantryPage() {
  const {
    loading, err, lots, locations, q, setQ, locFilter, setLocFilter,
    view, setView, showAddForm, setShowAddForm, load,
    handleAddLot, handleDeleteLot, handleUpdateLot
  } = usePantryData();

  const filtered = useMemo(() => {
    // ... logique de filtrage
  }, [lots, q, locFilter]);

  const byProduct = useMemo(() => {
    // ... regroupement par produit
  }, [filtered]);

  const stats = useMemo(() => {
    // ... calcul des statistiques
  }, [byProduct, filtered]);

  const handleQuickAction = (action, data) => {
    if (action === 'add') setShowAddForm(true);
  };

  const handleProductOpen = ({ productId, name }) => {
    alert(`Ouverture de "${name}"`);
  };

  if (loading) return <div>🔄 Chargement...</div>;
  if (err) return <div>❌ {err}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* En-tête */}
      <h1>🏺 Garde-Manger</h1>
      
      {/* Statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
        <Stat value={stats.totalProducts} label="Produits" />
        <Stat value={stats.totalLots} label="Lots" />
        <Stat value={stats.expiredCount} label="Périmés" tone="danger" />
        <Stat value={stats.soonCount} label="Urgents" tone="warning" />
      </div>

      {/* Contrôles */}
      <PantryControls
        q={q} setQ={setQ}
        locFilter={locFilter} setLocFilter={setLocFilter}
        view={view} setView={setView}
        showAddForm={showAddForm} setShowAddForm={setShowAddForm}
        locations={locations}
        onRefresh={load}
      />

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <SmartAddForm
          locations={locations}
          onAdd={handleAddLot}
          onClose={() => setShowAddForm(false)}
        />
      )}

      {/* Vue principale */}
      {view === 'products' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {byProduct.map(({ productId, name, category, unit, lots }) => (
            <ProductCard
              key={productId}
              productId={productId}
              name={name}
              category={category}
              unit={unit}
              lots={lots}
              onOpen={handleProductOpen}
              onQuickAction={handleQuickAction}
            />
          ))}
        </div>
      ) : (
        <LotsView
          lots={filtered}
          onDeleteLot={handleDeleteLot}
          onUpdateLot={handleUpdateLot}
        />
      )}
    </div>
  );
}
