'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { readCache, writeCache } from '@/lib/pageCache';
import SmartAddForm from './components/SmartAddForm';
import ConsumeModal from './components/ConsumeModal';
import OcrReviewList from './components/OcrReviewList';
import { capitalizeProduct } from './components/pantryUtils';
import { daysUntil } from '@/lib/dates';
import ConfirmDialog from '../../components/ConfirmDialog';
import EditLotForm from './components/EditLotForm';
import RestesManager from '@/components/RestesManager';
import { toast } from '@/components/Toast';
import './pantry.css';

// Registre V21 — onglets de statut (mappés sur statusFilter)
const STATUS_TABS = [
  { key: 'all', label: 'Tout' },
  { key: 'expired', label: 'Expirés' },
  { key: 'expiring_soon', label: 'Bientôt' },
  { key: 'good', label: 'Bon état' },
];

// Tri V21 — puces (mappées sur sortBy). defaultOrder = ordre au premier clic.
const SORT_CHIPS = [
  { key: 'expiration', label: 'Expiration', defaultOrder: 'asc' },
  { key: 'quantity', label: 'Quantité', defaultOrder: 'desc' },
  { key: 'name', label: 'Nom', defaultOrder: 'asc' },
  { key: 'location', label: 'Emplacement', defaultOrder: 'asc' },
];

// expiration_status (good|expiring_soon|expired|no_date) → classe ledger (ok|soon|exp)
function v21StatusClass(item) {
  if (item.expiration_status === 'expired') return 'exp';
  if (item.expiration_status === 'expiring_soon') return 'soon';
  return 'ok';
}

// Libellé d'état mono pour la colonne de droite du registre
function v21StatusLabel(item) {
  if (item.expiration_status === 'expired') return 'Périmé';
  const d = item.days_until_expiration;
  if (item.expiration_status === 'expiring_soon') {
    if (d == null) return 'À utiliser';
    if (d <= 0) return "Aujourd'hui";
    if (d === 1) return 'Demain';
    return `À utiliser ${d} j`;
  }
  // good / no_date
  if (d == null) return 'Frais';
  return `Frais ${d} j`;
}

export default function PantryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('expiration'); // expiration, quantity, name
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [showEditLot, setShowEditLot] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [itemToConsume, setItemToConsume] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, waste, stats
  const [userId, setUserId] = useState(null);
  const [showOcr, setShowOcr] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user;
      if (!user) {
        router.push('/login');
      } else {
        setUserId(user.id);
      }
    });
  }, [router]);

  useEffect(() => {
    // Vérifier si on doit ouvrir l'onglet "restes" via URL
    const tab = searchParams.get('tab');
    if (tab === 'waste' || tab === 'restes') {
      setActiveTab('waste');
    }
  }, [searchParams]);

  useEffect(() => {
    // Revisite instantanée : on rend le dernier stock connu sans skeleton.
    const cached = readCache('pantry');
    if (cached) { setItems(cached); setLoading(false); }
    loadPantryItems();
  }, []);

  useEffect(() => {
    filterAndSortItems();
  }, [items, searchTerm, statusFilter, sortBy, sortOrder]);

  function filterAndSortItems() {
    let filtered = [...items];

    // Filtrage par texte
    if (searchTerm) {
      filtered = filtered.filter(item =>
        (item.product_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut d'expiration
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.expiration_status === statusFilter);
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'expiration':
          // Tri par date d'expiration (les sans date à la fin)
          if (!a.expiration_date && !b.expiration_date) comparison = 0;
          else if (!a.expiration_date) comparison = 1;
          else if (!b.expiration_date) comparison = -1;
          else {
            const dateA = new Date(a.expiration_date);
            const dateB = new Date(b.expiration_date);
            comparison = dateA - dateB;
          }
          break;

        case 'quantity':
          // Tri par quantité (convertir tout en grammes pour comparer)
          const qtyA = getQuantityInGrams(a);
          const qtyB = getQuantityInGrams(b);
          comparison = qtyA - qtyB;
          break;

        case 'name':
          // Tri alphabétique par nom
          comparison = (a.product_name || '').localeCompare(b.product_name || '');
          break;

        case 'location':
          // Tri par emplacement
          comparison = (a.storage_place || '').localeCompare(b.storage_place || '');
          break;

        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredItems(filtered);
  }

  // Fonction helper pour convertir les quantités en grammes pour comparaison
  function getQuantityInGrams(item) {
    const qty = item.qty_remaining || 0;
    const unit = (item.unit || '').toLowerCase();

    // Si on a des métadonnées pour conversion
    if (item.grams_per_unit && (unit === 'u' || unit === 'pièce' || unit === 'pièces')) {
      return qty * item.grams_per_unit;
    }

    // Conversion standard des unités
    switch (unit) {
      case 'kg': return qty * 1000;
      case 'g': return qty;
      case 'l': return qty * 1000; // Approximation pour liquides
      case 'ml': return qty; // Approximation
      case 'cl': return qty * 10; // Approximation
      default: return qty; // Unités ou autres
    }
  }

  async function loadPantryItems() {
    if (isLoading) return; // Éviter les chargements multiples

    setIsLoading(true);
    if (!readCache('pantry')) setLoading(true); // pas de skeleton si on a déjà le cache
    try {

      // D'abord, essayons la version simple qui fonctionnait
      let { data, error } = await supabase
        .from('inventory_lots')
        .select('*')
        .order('expiration_date', { ascending: true, nullsLast: true });

      if (error) {
        console.error('Erreur lors du chargement des lots:', error);
        throw error;
      }



      // Enrichir avec les canonical_foods ET les archetypes
      if (data && data.length > 0) {
        // Récupérer les canonical_foods
        const canonicalIds = data
          .filter(item => item.canonical_food_id)
          .map(item => item.canonical_food_id);

        // Récupérer les archetypes
        const archetypeIds = data
          .filter(item => item.archetype_id)
          .map(item => item.archetype_id);

        let canonicalMap = {};
        let archetypeMap = {};

        // Charger canonical_foods
        if (canonicalIds.length > 0) {
          const { data: canonicalData, error: canonicalError } = await supabase
            .from('canonical_foods')
            .select('id, canonical_name, density_g_per_ml, unit_weight_grams, shelf_life_days_pantry')
            .in('id', canonicalIds);

          if (!canonicalError && canonicalData) {
            canonicalData.forEach(item => {
              canonicalMap[item.id] = item;
            });
          }
        }

        // Charger archetypes
        if (archetypeIds.length > 0) {
          const { data: archetypeData, error: archetypeError } = await supabase
            .from('archetypes')
            .select('id, name, expiry_kind, shelf_life_days_pantry, shelf_life_days_fridge, shelf_life_days_freezer, open_shelf_life_days_pantry, open_shelf_life_days_fridge, open_shelf_life_days_freezer')
            .in('id', archetypeIds);

          if (!archetypeError && archetypeData) {
            archetypeData.forEach(item => {
              archetypeMap[item.id] = item;
            });
          }
        }

        // Enrichir les données
        data = data.map(item => {
          if (item.canonical_food_id && canonicalMap[item.canonical_food_id]) {
            return {
              ...item,
              canonical_foods: canonicalMap[item.canonical_food_id]
            };
          } else if (item.archetype_id && archetypeMap[item.archetype_id]) {
            return {
              ...item,
              archetypes: archetypeMap[item.archetype_id]
            };
          }
          return item;
        });
      }



      // Transformer les données - version simple d'abord
      const transformedData = (data || []).map(item => {
        let productName = 'Produit sans nom';

        // Déterminer le nom selon le type
        if (item.canonical_food_id && item.canonical_foods?.canonical_name) {
          productName = item.canonical_foods.canonical_name;
        } else if (item.archetype_id && item.archetypes?.name) {
          productName = item.archetypes.name;
        } else if (item.notes) {
          // Produit custom avec notes
          productName = item.notes.split('\n')[0]; // Première ligne des notes
        } else if (item.product_name) {
          productName = item.product_name;
        }

        const transformed = {
          ...item,
          product_name: productName,
          expiry_kind: item.archetypes?.expiry_kind || null,
          expiration_status: getExpirationStatus(item.adjusted_expiration_date || item.expiration_date, item.archetypes?.expiry_kind),
          days_until_expiration: daysUntil(item.adjusted_expiration_date || item.expiration_date),
          // Métadonnées utilisant les vrais noms de colonnes
          grams_per_unit: item.canonical_foods?.unit_weight_grams || null,
          density_g_per_ml: item.canonical_foods?.density_g_per_ml || null,
          primary_unit: item.unit
        };

        // Log pour debug (optionnel)
        // console.log(`Produit transformé: "${transformed.product_name}"`);

        return transformed;
      });
      setItems(transformedData);
      writeCache('pantry', transformedData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setItems([]);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  }

  // Règle métier : alerte à J-3 pour les DLC (et durées estimées), J-7 pour les DDM.
  // Comparaisons en UTC via lib/dates pour éviter les décalages de fuseau.
  function getExpirationStatus(dateString, expiryKind) {
    const diffDays = daysUntil(dateString);
    if (diffDays === null) return 'no_date';

    const threshold = expiryKind === 'DDM' ? 7 : 3;
    if (diffDays < 0) return 'expired';
    if (diffDays <= threshold) return 'expiring_soon';
    return 'good';
  }



  // Ouvrir le modal de consommation
  function handleConsume(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    setItemToConsume(item);
    setShowConsumeModal(true);
  }

  // Fonction de consommation réelle (appelée depuis le modal)
  async function handleConsumeConfirm(quantity, unit) {
    const item = itemToConsume;
    if (!item) return;

    // Si le produit est containerisé, utiliser la fonction de fractionnement
    if (item.is_containerized && item.container_size && item.container_unit) {
      try {
        // Appeler la fonction PostgreSQL pour fractionner le lot
        const { data, error } = await supabase.rpc('split_containerized_lot', {
          p_lot_id: item.id,
          p_quantity_consumed: quantity,
          p_consumed_unit: unit
        });

        if (error) {
          console.error('Erreur lors du fractionnement:', error);
          toast.error('Erreur lors de la consommation : ' + error.message);
          return;
        }

        // Afficher le message de résultat
        if (data && data.length > 0 && data[0].message) {
          toast.success(data[0].message);
        }

        // Recharger les items pour refléter les changements
        await loadPantryItems();

      } catch (error) {
        console.error('Erreur consommation:', error);
        toast.error('Erreur lors de la consommation');
      }
      return;
    }

    // Logique classique pour produits non-containerisés
    const newQty = Math.max(0, Math.round((item.qty_remaining - quantity) * 100) / 100);

    // Si la quantité devient 0, proposer la suppression
    if (newQty === 0) {
      handleDeleteClick(item.id);
      return;
    }

    // Mise à jour optimiste
    setItems(prev => prev.map(i =>
      i.id === item.id ? { ...i, qty_remaining: newQty } : i
    ));

    try {
      const { error } = await supabase
        .from('inventory_lots')
        .update({ qty_remaining: newQty })
        .eq('id', item.id);

      if (error) {
        console.error('Erreur lors de la consommation:', error);
        await loadPantryItems();
      }
    } catch {
      await loadPantryItems();
    }
  }

  function handleEdit(id) {
    const item = items.find(i => i.id === id);
    if (item) {
      setItemToEdit(item);
      setShowEditLot(true);
    }
  }

  async function handleUpdateLot(id, updates) {
    // Fermer le modal d'édition
    setShowEditLot(false);
    setItemToEdit(null);

    // Mise à jour locale immédiate pour une UX fluide
    setItems(prev => prev.map(i =>
      i.id === id ? {
        ...i,
        qty_remaining: parseFloat(updates.qty_remaining),
        unit: updates.unit,
        storage_place: updates.storage_place,
        expiration_date: updates.expiration_date
      } : i
    ));

    try {
      const { error } = await supabase
        .from('inventory_lots')
        .update({
          qty_remaining: parseFloat(updates.qty_remaining),
          unit: updates.unit,
          storage_place: updates.storage_place,
          expiration_date: updates.expiration_date
        })
        .eq('id', id);

      if (error) {
        console.error('Erreur mise à jour lot:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error('Erreur lors de la mise à jour : ' + error.message);
      await loadPantryItems();
    }
  }

  async function handleUpdateQuantity(id, newQty, newUnit) {
    // Pour les conversions rapides depuis les boutons
    return handleUpdateLot(id, { qty_remaining: newQty, unit: newUnit });
  }

  function handleDeleteClick(id) {
    const item = items.find(i => i.id === id);
    setItemToDelete(item);
    setShowConfirmDelete(true);
  }

  async function handleDeleteConfirm() {
    if (!itemToDelete) return;

    const id = itemToDelete.id;

    // Suppression optimiste immédiate
    setItems(prev => prev.filter(i => i.id !== id));

    try {
      const { error } = await supabase
        .from('inventory_lots')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        await loadPantryItems();
        toast.error('Erreur lors de la suppression : ' + error.message);
      }
    } catch {
      await loadPantryItems();
    }
  }

  function handleFormClose() {
    setShowForm(false);
    loadPantryItems();
  }

  // Bascule de tri V21 : re-clic = inverse l'ordre, sinon applique l'ordre par défaut
  function handleSortChip(chip) {
    if (sortBy === chip.key) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(chip.key);
      setSortOrder(chip.defaultOrder);
    }
  }

  // Calculer les stats pour les tabs
  const tabStats = {
    totalProducts: items.length,
    atRiskCount: items.filter(i =>
      i.expiration_status === 'expired' || i.expiration_status === 'expiring_soon'
    ).length
  };

  // Compteurs pour le hero / lede
  const surveiller = tabStats.atRiskCount;

  // ── Répartition pour le rail « tableau de bord » ──
  const locationCounts = {};
  for (const i of items) {
    const k = i.storage_place || 'Non rangé';
    locationCounts[k] = (locationCounts[k] || 0) + 1;
  }
  const locationBreakdown = Object.entries(locationCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const maxLoc = locationBreakdown.reduce((m, l) => Math.max(m, l.count), 0) || 1;
  const etat = {
    good: items.filter(i => i.expiration_status === 'good' || i.expiration_status === 'no_date').length,
    soon: items.filter(i => i.expiration_status === 'expiring_soon').length,
    expired: items.filter(i => i.expiration_status === 'expired').length,
  };

  if (loading) {
    return (
      <div className="v21-page wide" aria-busy="true" aria-label="Chargement du garde-manger">
        <div className="v21-skel" style={{ height: 150, marginBottom: 28 }} />
        <div className="v21-skel" style={{ height: 56, marginBottom: 18 }} />
        <div className="v21-skel" style={{ height: 44, marginBottom: 22 }} />
        <div className="v21-its">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div key={i} className="v21-skel" style={{ height: 56, marginBottom: 1 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="v21-page wide">

        {/* HERO ÉDITORIAL */}
        <header className="v21-hero">
          <div className="v21-hero-text">
            <span className="v21-eyebrow">Inventaire</span>
            <h1 className="v21-title">Garde-manger</h1>
            <div className="v21-rule" />
            <p className="v21-lede">Tout ce qui dort dans vos réserves, d'un seul regard.</p>
          </div>
          <div className="v21-hero-side">
            <div className="v21-hero-badge">
              <span className="v">{surveiller}</span>
              <span className="l">à surveiller</span>
            </div>
          </div>
        </header>

        {activeTab === 'waste' ? (
          /* ── Anti-gaspi / Restes ── */
          <section className="v21-section flush" style={{ paddingTop: 24 }}>
            <div className="v21-bh">
              <span className="v21-bl">Anti-gaspi — restes</span>
              <button type="button" className="v21-link" onClick={() => setActiveTab('inventory')}>← Retour à l'inventaire</button>
            </div>
            {userId && <RestesManager userId={userId} onActionComplete={loadPantryItems} />}
          </section>
        ) : (
          /* ── TABLEAU DE BORD : rail synthèse + index de travail ── */
          <div className="stock-board">

            {/* RAIL — synthèse / cockpit */}
            <aside className="stock-rail">
              <div className="stock-rblk">
                <div className="stock-twin">
                  <div className="stock-cell">
                    <span className="v21-stat-l">Produits</span>
                    <span className="stock-num">{items.length}</span>
                    <span className="v21-stat-s">en stock</span>
                  </div>
                  <div className="stock-cell">
                    <span className="v21-stat-l">À surveiller</span>
                    <span className={`stock-num ${surveiller > 0 ? 'hot' : ''}`}>{surveiller}</span>
                    <span className="v21-stat-s">≤ 3 jours</span>
                  </div>
                </div>
              </div>

              {locationBreakdown.length > 0 && (
                <div className="stock-rblk">
                  <div className="v21-bh">
                    <span className="v21-bl">Par emplacement</span>
                    <span className="stock-rmeta">{locationBreakdown.length} lieu{locationBreakdown.length > 1 ? 'x' : ''}</span>
                  </div>
                  {locationBreakdown.map(l => (
                    <div className="stock-barrow" key={l.name}>
                      <span className="stock-bl" title={l.name}>{l.name}</span>
                      <span className="stock-track"><i style={{ width: `${Math.max(6, (l.count / maxLoc) * 100)}%` }} /></span>
                      <span className="stock-bn">{l.count}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="stock-rblk">
                <div className="v21-bh"><span className="v21-bl">Par état</span></div>
                <div className="stock-emp">
                  <div className="stock-e"><span className="k">Bon état</span><span className="n">{etat.good}</span></div>
                  <div className="stock-e"><span className="k">Bientôt</span><span className="n" style={{ color: 'var(--state-soon)' }}>{etat.soon}</span></div>
                  <div className="stock-e"><span className="k">Périmés</span><span className="n" style={{ color: 'var(--terracotta)' }}>{etat.expired}</span></div>
                </div>
              </div>

              <div className="stock-rblk stock-rlink">
                <button type="button" className="v21-link" onClick={() => setActiveTab('waste')}>Gérer les restes / anti-gaspi →</button>
              </div>
            </aside>

            {/* RIGHT — index de travail */}
            <section className="stock-right">
              <div className="stock-rhead">
                <h2 className="stock-rtitle">Inventaire</h2>
                <div className="stock-rc">{items.length} produit{items.length !== 1 ? 's' : ''} · {surveiller} à surveiller</div>
              </div>

              {/* recherche + tri */}
              <div className="v21-toolbar stock-toolbar">
                <input
                  type="text"
                  placeholder="Rechercher un produit…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="v21-search"
                  aria-label="Rechercher un produit"
                />
                <div className="v21-sort">
                  <span className="v21-sort-l">Trier</span>
                  {SORT_CHIPS.map(chip => (
                    <button
                      key={chip.key}
                      className={`v21-chip ${sortBy === chip.key ? 'on' : ''}`}
                      onClick={() => handleSortChip(chip)}
                      aria-pressed={sortBy === chip.key}
                    >
                      {chip.label}{sortBy === chip.key && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </button>
                  ))}
                </div>
              </div>

              {/* onglets de statut */}
              <div className="v21-tabs stock-stabs" role="tablist" aria-label="Filtrer par état">
                {STATUS_TABS.map(tab => {
                  const count = tab.key === 'all'
                    ? items.length
                    : items.filter(i => i.expiration_status === tab.key).length;
                  return (
                    <button
                      key={tab.key}
                      role="tab"
                      aria-selected={statusFilter === tab.key}
                      className={`v21-tab ${statusFilter === tab.key ? 'on' : ''}`}
                      onClick={() => setStatusFilter(tab.key)}
                    >
                      {tab.label} · {count}
                    </button>
                  );
                })}
              </div>

              {/* registre / inventaire (ledger V21) */}
              {items.length === 0 ? (
                <div className="v21-empty">
                  <p>Votre garde-manger est vide. Commencez par ajouter vos premiers produits.</p>
                  <button className="v21-btn" onClick={() => setShowForm(true)}>+ Ajouter un produit</button>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="v21-empty">
                  <p>Aucun article trouvé. Ajustez vos filtres ou ajoutez des produits.</p>
                  <button className="v21-btn" onClick={() => setShowForm(true)}>+ Ajouter un produit</button>
                </div>
              ) : (
                <div className="v21-its" role="list">
                  {filteredItems.map(item => {
                    const cls = v21StatusClass(item);
                    const q = item.qty_remaining != null
                      ? +(+item.qty_remaining).toFixed(2)
                      : null;
                    const qty = q != null ? `${q}${item.unit ? ' ' + item.unit : ''}` : '—';
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`v21-it ${cls}`}
                        onClick={() => handleEdit(item.id)}
                        title="Modifier ce lot"
                      >
                        <span className="v21-it-bar" aria-hidden="true" />
                        <span className="v21-it-n">
                          {capitalizeProduct(item.product_name)}
                          {item.is_opened && (
                            <span className="v21-it-opened" title={`Entamé — DLC réduite${item.adjusted_expiration_date ? ' au ' + new Date(item.adjusted_expiration_date).toLocaleDateString('fr-FR') : ''}`}> ◦ entamé</span>
                          )}
                        </span>
                        <span className="v21-it-q">{qty}</span>
                        <span className="v21-it-lc">{item.storage_place || '—'}</span>
                        <span className="v21-it-st">{v21StatusLabel(item)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* Modal d'ajout - disponible sur tous les onglets */}
        {showForm && (
          <SmartAddForm
            open={showForm}
            onClose={handleFormClose}
            onLotCreated={handleFormClose}
          />
        )}

        {/* Modal de consommation */}
        <ConsumeModal
          item={itemToConsume}
          isOpen={showConsumeModal}
          onClose={() => {
            setShowConsumeModal(false);
            setItemToConsume(null);
          }}
          onConfirm={handleConsumeConfirm}
        />

        {/* Boutons flottants */}
        <div className="pantry-fab-group">
          <button
            className="pantry-fab pantry-fab-secondary"
            onClick={() => setShowOcr(true)}
            title="Scanner une liste (OCR)"
          >
            <span aria-hidden="true">⌕</span>
          </button>
          <button
            className="pantry-fab"
            onClick={() => setShowForm(true)}
            title="Ajouter un article"
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>

        {/* Modal OCR */}
        {showOcr && (
          <OcrReviewList
            onClose={() => setShowOcr(false)}
            onItemsAdded={(count) => {
              setShowOcr(false);
              loadPantryItems();
            }}
          />
        )}

        {/* Dialog de confirmation de suppression */}
        <ConfirmDialog
          isOpen={showConfirmDelete}
          onClose={() => {
            setShowConfirmDelete(false);
            setItemToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
          title="Supprimer l'article"
          message={`Êtes-vous sûr de vouloir supprimer "${itemToDelete?.product_name}" ?`}
          confirmText="Supprimer"
          cancelText="Annuler"
        />

        {/* Modal d'édition complète */}
        {showEditLot && itemToEdit && (
          <EditLotForm
            item={itemToEdit}
            onUpdate={handleUpdateLot}
            onReload={loadPantryItems}
            onCancel={() => {
              setShowEditLot(false);
              setItemToEdit(null);
            }}
            onDelete={() => {
              const id = itemToEdit.id;
              setShowEditLot(false);
              setItemToEdit(null);
              handleDeleteClick(id);
            }}
          />
        )}
      </div>
    </>
  );
}
