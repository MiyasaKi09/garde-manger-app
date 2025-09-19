// ========================================
// FICHIER: src/components/PantryPage.jsx
// OÙ: Dans votre projet → src → components → PantryPage.jsx
// QUOI: Composant React pour afficher le garde-manger
// ========================================

import React, { useState, useEffect } from 'react';
import { pantryService } from '../config/supabase';
import PantryCard from './PantryCard';
import PantryFilters from './PantryFilters';
import PantryStats from './PantryStats';
import './PantryPage.css';

const PantryPage = () => {
  // États
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    expiring: 0,
    categories: 0,
    locations: 0
  });
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Charger les données au montage du composant
  useEffect(() => {
    loadPantryData();
  }, []);

  // Appliquer les filtres quand ils changent
  useEffect(() => {
    applyFilters();
  }, [items, searchTerm, categoryFilter, locationFilter, statusFilter]);

  // Fonction pour charger les données depuis Supabase
  const loadPantryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les articles
      const data = await pantryService.getAll();
      setItems(data || []);
      
      // Charger les statistiques
      const statsData = await pantryService.getStats();
      setStats(statsData);
      
    } catch (err) {
      console.error('Erreur lors du chargement:', err);
      setError('Impossible de charger les données. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour appliquer les filtres
  const applyFilters = () => {
    let filtered = [...items];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.product_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par catégorie
    if (categoryFilter) {
      filtered = filtered.filter(item =>
        item.category_name === categoryFilter
      );
    }

    // Filtre par emplacement
    if (locationFilter) {
      filtered = filtered.filter(item =>
        item.storage_place === locationFilter
      );
    }

    // Filtre par statut
    if (statusFilter) {
      filtered = filtered.filter(item =>
        item.expiration_status === statusFilter
      );
    }

    setFilteredItems(filtered);
  };

  // Fonction pour consommer un article
  const handleConsume = async (id, currentQty) => {
    const quantityToConsume = prompt(`Quantité à consommer ? (Max: ${currentQty})`);
    
    if (quantityToConsume && !isNaN(quantityToConsume)) {
      try {
        await pantryService.consumeItem(id, parseFloat(quantityToConsume));
        await loadPantryData(); // Recharger les données
        alert('Article mis à jour avec succès !');
      } catch (err) {
        console.error('Erreur:', err);
        alert('Erreur lors de la mise à jour');
      }
    }
  };

  // Fonction pour éditer un article
  const handleEdit = async (id) => {
    // Vous pouvez remplacer ceci par un modal ou une page d'édition
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newQty = prompt(`Nouvelle quantité pour ${item.product_name} ?`, item.qty_remaining);
    
    if (newQty && !isNaN(newQty)) {
      try {
        await pantryService.updateQuantity(id, parseFloat(newQty));
        await loadPantryData();
        alert('Quantité mise à jour !');
      } catch (err) {
        console.error('Erreur:', err);
        alert('Erreur lors de la mise à jour');
      }
    }
  };

  // Fonction pour supprimer un article
  const handleDelete = async (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      try {
        await pantryService.deleteItem(id);
        await loadPantryData();
        alert('Article supprimé');
      } catch (err) {
        console.error('Erreur:', err);
        alert('Erreur lors de la suppression');
      }
    }
  };

  // Obtenir les listes uniques pour les filtres
  const categories = [...new Set(items.map(i => i.category_name))].filter(Boolean).sort();
  const locations = [...new Set(items.map(i => i.storage_place))].filter(Boolean).sort();

  // Affichage du chargement
  if (loading) {
    return (
      <div className="pantry-loading">
        <div className="loading-spinner"></div>
        <p>Chargement de votre garde-manger...</p>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="pantry-error">
        <h2>⚠️ Erreur</h2>
        <p>{error}</p>
        <button onClick={loadPantryData}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="pantry-container">
      {/* Header */}
      <header className="pantry-header">
        <h1>
          <span className="leaf-icon">🌿</span>
          Mon Garde-Manger Nature
          <span className="leaf-icon">🌿</span>
        </h1>
      </header>

      {/* Statistiques */}
      <PantryStats stats={stats} />

      {/* Filtres */}
      <PantryFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        categories={categories}
        locationFilter={locationFilter}
        setLocationFilter={setLocationFilter}
        locations={locations}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* Grille d'articles */}
      <div className="pantry-grid">
        {filteredItems.length === 0 ? (
          <div className="pantry-empty">
            <h2>Aucun article trouvé</h2>
            <p>Ajustez vos filtres ou ajoutez de nouveaux articles</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <PantryCard
              key={item.id}
              item={item}
              onConsume={handleConsume}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Bouton flottant pour ajouter */}
      <button 
        className="pantry-fab"
        onClick={() => alert('Fonction d\'ajout à implémenter')}
        title="Ajouter un article"
      >
        +
      </button>
    </div>
  );
};

export default PantryPage;
