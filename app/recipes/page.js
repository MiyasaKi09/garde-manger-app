'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { authFetch } from '@/lib/authFetch';
import './recipes.css';

/* ── Fiche recette horizontale (vignette + infos), barre d'état à gauche ── */
function variantOf(s) {
  if (!s || !s.total) return 'mut';
  if (s.urgent > 0) return 'ag';        // utilise un produit qui mûrit
  if (s.missing === 0) return 'ok';     // cuisinable
  if (s.missing <= 2) return 'sf';      // il manque 1–2
  return 'mut';
}

function Fiche({ r, s, variant }) {
  const v = variant || variantOf(s);
  const time = (r.prep_min || 0) + (r.cook_min || 0);
  const total = s?.total || 0;
  const avail = s?.available || 0;

  let cuis = null;
  if (v === 'ag' && s?.expiringName) {
    cuis = <span className="rc-cuis ag"><span className="rc-k">utilise</span><b>{s.expiringName}</b>{s.expiringDays != null ? ` · ${s.expiringDays <= 0 ? "auj." : 'J-' + s.expiringDays}` : ''}</span>;
  } else if (v === 'ok') {
    cuis = <span className="rc-cuis ok"><b>Cuisinable</b>{total ? ` · ${avail}/${total} en stock` : ''}</span>;
  } else if (v === 'sf' && (s?.missingNames || []).length) {
    cuis = <span className="rc-cuis sf"><span className="rc-k">manque</span><b>{s.missingNames.slice(0, 2).join(', ')}</b></span>;
  } else if (total) {
    cuis = <span className="rc-cuis mut">{avail}/{total} en stock</span>;
  }

  return (
    <Link href={`/recipes/${r.id}`} className={`rc-fiche ${v}`}>
      <div className="rc-media">
        {r.image_url
          ? <img src={r.image_url} alt={r.title || 'Recette'} loading="lazy" />
          : <span className="rc-mono" aria-hidden="true">{(r.title || '?').trim().charAt(0).toUpperCase()}</span>}
      </div>
      <div className="rc-body">
        <h3 className="rc-name">{r.title || 'Sans titre'}</h3>
        {cuis}
        <div className="rc-meta">
          {time > 0 ? `${time} min` : '—'}{r.servings ? ` · ${r.servings} pers` : ''}
          {r.rating ? <span className="rc-score"><i>★</i>{(+r.rating).toFixed(1)}</span> : null}
        </div>
      </div>
      {v === 'ok' && <span className="rc-cook">Cuisiner →</span>}
    </Link>
  );
}

const VIEW_CHIPS = [
  { key: 'cuisinable', label: 'Cuisinable' },
  { key: 'antigaspi', label: 'Anti-gaspi' },
  { key: 'rapide', label: 'Rapide ≤ 20 min' },
  { key: 'all', label: 'Tout le catalogue' },
];

export default function RecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('cuisinable');
  const [inventoryStatus, setInventoryStatus] = useState({});
  const [error, setError] = useState(null);
  const [fetchingImages, setFetchingImages] = useState(false);
  const [fetchResult, setFetchResult] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/login');
    });
  }, [router]);

  useEffect(() => { fetchRecipes(); }, []);

  useEffect(() => {
    if (recipes.length > 0) checkInventoryAvailability();
  }, [recipes]);

  async function fetchRecipes() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('generated_recipes')
        .select('id, title, description, servings, prep_min, cook_min, ingredients, steps, source, created_at, rating, cook_count, image_url')
        .order('created_at', { ascending: false });

      if (error) { setError(`Erreur de connexion: ${error.message}`); setRecipes([]); return; }
      if (!data || data.length === 0) { setRecipes([]); return; }

      const recipeIds = data.map(r => r.id);
      const { data: linkedIngs } = await supabase
        .from('generated_recipe_ingredients')
        .select('generated_recipe_id, canonical_food_id, archetype_id, quantity, unit')
        .in('generated_recipe_id', recipeIds);

      const ingsByRecipe = {};
      (linkedIngs || []).forEach(ing => {
        (ingsByRecipe[ing.generated_recipe_id] = ingsByRecipe[ing.generated_recipe_id] || []).push(ing);
      });

      setRecipes(data.map(r => ({
        ...r,
        linked_ingredients: ingsByRecipe[r.id] || [],
      })));
    } catch (err) {
      setError(`Erreur: ${err.message}`);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }

  async function checkInventoryAvailability() {
    try {
      const { data: inventory, error } = await supabase
        .from('inventory_lots')
        .select('canonical_food_id, archetype_id, qty_remaining, unit, expiration_date')
        .gt('qty_remaining', 0)
        .gt('expiration_date', new Date().toISOString());
      if (error) return;
      const inv = inventory || [];

      // archetype d'un lot → canonique (pour matcher un lot archétype à un ingrédient canonique)
      const lotArcheIds = inv.filter(l => l.archetype_id).map(l => l.archetype_id);
      const archetypeMapping = {};
      if (lotArcheIds.length) {
        const { data: arche } = await supabase.from('archetypes').select('id, canonical_food_id').in('id', lotArcheIds);
        (arche || []).forEach(a => { archetypeMapping[a.id] = a.canonical_food_id; });
      }

      // noms des ingrédients liés des recettes (pour « utilise »/« manque »)
      const canonIds = new Set(), archeNameIds = new Set();
      recipes.forEach(r => (r.linked_ingredients || []).forEach(ing => {
        if (ing.canonical_food_id) canonIds.add(ing.canonical_food_id);
        if (ing.archetype_id) archeNameIds.add(ing.archetype_id);
      }));
      const canonName = {}, archeName = {};
      if (canonIds.size) {
        const { data } = await supabase.from('canonical_foods').select('id, canonical_name').in('id', [...canonIds]);
        (data || []).forEach(c => { canonName[c.id] = c.canonical_name; });
      }
      if (archeNameIds.size) {
        const { data } = await supabase.from('archetypes').select('id, name').in('id', [...archeNameIds]);
        (data || []).forEach(a => { archeName[a.id] = a.name; });
      }
      const cap = (x) => x ? x.charAt(0).toUpperCase() + x.slice(1) : x;
      const nameOf = (ing) => cap(canonName[ing.canonical_food_id] || archeName[ing.archetype_id] || 'ingrédient');

      const now = new Date();
      const statusMap = {};
      for (const recipe of recipes) {
        const linked = recipe.linked_ingredients || [];
        if (linked.length === 0) {
          statusMap[recipe.id] = { total: 0, available: 0, missing: 0, missingNames: [], urgent: 0, expiringName: null, expiringDays: null, percent: 0, mykoScore: 0 };
          continue;
        }
        let available = 0, urgent = 0;
        const missingNames = [];
        let expiringName = null, expiringDays = null;

        for (const ing of linked) {
          let totalAvailable = 0, earliestExp = null;
          for (const lot of inv) {
            let m = false;
            if (ing.canonical_food_id && lot.canonical_food_id === ing.canonical_food_id) m = true;
            else if (ing.canonical_food_id && lot.archetype_id && archetypeMapping[lot.archetype_id] === ing.canonical_food_id) m = true;
            else if (ing.archetype_id && lot.archetype_id === ing.archetype_id) m = true;
            if (m) {
              totalAvailable += lot.qty_remaining || 0;
              if (lot.expiration_date) {
                const d = new Date(lot.expiration_date);
                if (!earliestExp || d < earliestExp) earliestExp = d;
              }
            }
          }
          if (totalAvailable >= (ing.quantity || 1)) {
            available++;
            if (earliestExp) {
              const days = Math.floor((earliestExp - now) / 86400000);
              if (days <= 7) { urgent++; if (expiringDays === null || days < expiringDays) { expiringDays = days; expiringName = nameOf(ing); } }
            }
          } else {
            missingNames.push(nameOf(ing));
          }
        }

        const total = linked.length;
        const missing = total - available;
        const percent = Math.round((available / total) * 100);
        let mykoScore = (percent / 100) * 60 + (urgent / total) * 30;
        const t = (recipe.prep_min || 0) + (recipe.cook_min || 0);
        mykoScore += t > 0 ? Math.max(0, 10 - (t / 120) * 10) : 5;

        statusMap[recipe.id] = { total, available, missing, missingNames, urgent, expiringName, expiringDays, percent, mykoScore: Math.round(mykoScore) };
      }
      setInventoryStatus(statusMap);
    } catch { /* silencieux */ }
  }

  async function handleFetchImages() {
    setFetchingImages(true);
    setFetchResult(null);
    try {
      const res = await authFetch('/api/recipes/fetch-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch: true }),
      });
      const data = await res.json();
      if (data.error) setFetchResult({ error: data.error });
      else { setFetchResult({ updated: data.updated, total: data.total }); if (data.updated > 0) fetchRecipes(); }
    } catch (err) {
      setFetchResult({ error: err.message });
    } finally {
      setFetchingImages(false);
    }
  }

  // ── Regroupements (pilotés par le garde-manger) ──
  const withStatus = recipes.map(r => ({ r, s: inventoryStatus[r.id] }));
  const ready = withStatus.filter(x => x.s);
  const byScore = (a, b) => (b.s.mykoScore || 0) - (a.s.mykoScore || 0);

  const antigaspi = ready.filter(x => x.s.urgent > 0).sort(byScore);
  const cuisinable = ready.filter(x => x.s.total > 0 && x.s.missing === 0 && x.s.urgent === 0).sort(byScore);
  const manque = ready.filter(x => x.s.total > 0 && x.s.missing >= 1 && x.s.missing <= 2 && x.s.urgent === 0)
    .sort((a, b) => (a.s.missing - b.s.missing) || byScore(a, b));

  const cuisinableCount = ready.filter(x => x.s.total > 0 && x.s.missing === 0).length;
  const prioritaireCount = antigaspi.length;
  const manqueCount = manque.length;

  const q = searchTerm.trim().toLowerCase();
  const matchSearch = (r) => !q || (r.title || '').toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q);

  let flatList = [];
  if (q) flatList = withStatus.filter(x => matchSearch(x.r));
  else if (view === 'antigaspi') flatList = antigaspi;
  else if (view === 'rapide') flatList = withStatus.filter(x => ((x.r.prep_min || 0) + (x.r.cook_min || 0)) > 0 && ((x.r.prep_min || 0) + (x.r.cook_min || 0)) <= 20);
  else if (view === 'all') flatList = [...withStatus];
  if (q || view === 'rapide' || view === 'all') flatList = flatList.sort((a, b) => (b.s?.mykoScore || 0) - (a.s?.mykoScore || 0));

  const showSections = !q && view === 'cuisinable';

  if (loading) {
    return (
      <div className="v21-page wide" aria-busy="true" aria-label="Chargement des recettes">
        <div className="v21-skel" style={{ height: 150, marginBottom: 26 }} />
        <div className="v21-skel" style={{ height: 56, marginBottom: 18 }} />
        <div className="v21-skel" style={{ height: 44, marginBottom: 22 }} />
        <div className="rc-sheet">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="rc-fiche sk" aria-hidden="true">
              <div className="rc-media" />
              <div className="rc-body"><div className="rc-skl" /><div className="rc-skl s" /><div className="rc-skl t" /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="v21-page">
        <div className="rc-error">
          <h2>Erreur de connexion</h2>
          <p>{error}</p>
          <button onClick={() => { setError(null); fetchRecipes(); }} className="v21-btn">Réessayer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="v21-page wide">
      {/* HERO */}
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Cuisine ⨯ garde-manger</span>
          <h1 className="v21-title">Que cuisiner&nbsp;?</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Avec ce que vous avez, avant que ça ne se perde.</p>
          <Link href="/planning/assistant" className="v21-btn" style={{ marginTop: 22 }}>✦ Demander à Myko</Link>
        </div>
        <div className="v21-hero-side">
          <div className="v21-hero-badge">
            <span className="v">{cuisinableCount}</span>
            <span className="l">cuisinables<br />maintenant</span>
          </div>
        </div>
      </header>

      {/* STAT STRIP (vue cuisinable) */}
      {showSections && (
        <div className="v21-stats">
          <div className="v21-stat">
            <span className="v21-stat-l">À cuisiner en priorité</span>
            <span className="v21-stat-v" style={{ color: prioritaireCount > 0 ? 'var(--saffron, #E0A92E)' : undefined }}>{prioritaireCount}</span>
            <span className="v21-stat-s">utilisent un produit qui mûrit</span>
          </div>
          <div className="v21-stat">
            <span className="v21-stat-l">Cuisinable maintenant</span>
            <span className="v21-stat-v" style={{ color: 'var(--brand)' }}>{cuisinableCount}</span>
            <span className="v21-stat-s">tous les ingrédients en stock</span>
          </div>
          <div className="v21-stat">
            <span className="v21-stat-l">À 1–2 ingrédients</span>
            <span className="v21-stat-v">{manqueCount}</span>
            <span className="v21-stat-s">il manque peu de choses</span>
          </div>
        </div>
      )}

      {/* TOOLBAR : filtres + recherche + Photos auto */}
      <div className="v21-toolbar">
        <div className="v21-sort">
          <span className="v21-sort-l">Filtrer</span>
          {VIEW_CHIPS.map(c => (
            <button key={c.key} className={`v21-chip ${!q && view === c.key ? 'on' : ''}`} onClick={() => setView(c.key)}>
              {c.label}
            </button>
          ))}
        </div>
        <div className="rc-tools-right">
          <input
            type="text"
            placeholder="Rechercher une recette…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="v21-search"
            aria-label="Rechercher une recette"
          />
          <button onClick={handleFetchImages} disabled={fetchingImages} className="rc-autophoto" title="Générer les photos manquantes">
            <i aria-hidden="true">▣</i> {fetchingImages ? 'Photos…' : 'Photos auto'}
          </button>
        </div>
      </div>

      {fetchResult && (
        <p className={`rc-notice ${fetchResult.error ? 'err' : 'ok'}`}>
          {fetchResult.error ? fetchResult.error : `${fetchResult.updated}/${fetchResult.total} photos récupérées`}
        </p>
      )}

      {recipes.length === 0 ? (
        <div className="v21-empty rc-empty">
          <p>Aucune recette pour le moment.</p>
          <Link href="/planning/assistant" className="v21-btn">✦ Demander à Myko</Link>
        </div>
      ) : showSections ? (
        <>
          {/* ① Avec ce qui mûrit */}
          {antigaspi.length > 0 && (
            <section className="rc-sec">
              <div className="rc-sh">
                <span className="rc-t saff">Avec ce qui mûrit</span>
                <Link href="/pantry" className="rc-shlink">Garde-manger →</Link>
              </div>
              <p className="rc-lede">Cuisinez d'abord ceux-là — vos produits qui approchent de la date.</p>
              <div className="rc-sheet">
                {antigaspi.map(({ r, s }) => <Fiche key={r.id} r={r} s={s} variant="ag" />)}
              </div>
            </section>
          )}

          {/* ② Cuisinable maintenant */}
          {cuisinable.length > 0 && (
            <section className="rc-sec">
              <div className="rc-sh">
                <span className="rc-t sage">Cuisinable maintenant</span>
              </div>
              <p className="rc-lede">Tous les ingrédients sont dans votre garde-manger.</p>
              <div className="rc-sheet">
                {cuisinable.map(({ r, s }) => <Fiche key={r.id} r={r} s={s} variant="ok" />)}
              </div>
            </section>
          )}

          {/* ③ Il te manque 1–2 ingrédients */}
          {manque.length > 0 && (
            <section className="rc-sec">
              <div className="rc-sh">
                <span className="rc-t">Il te manque 1–2 ingrédients</span>
                <Link href="/courses" className="rc-shlink">Ajouter aux courses →</Link>
              </div>
              <p className="rc-lede">Si proches — un saut au marché et c'est prêt.</p>
              <div className="rc-sheet">
                {manque.map(({ r, s }) => <Fiche key={r.id} r={r} s={s} variant="sf" />)}
              </div>
            </section>
          )}

          {/* ④ Tout le catalogue */}
          <section className="rc-sec last">
            <div className="rc-sh"><span className="rc-t">Tout le catalogue</span></div>
            <div className="rc-cata">
              <div>
                <div className="rc-cata-big">{recipes.length} recette{recipes.length !== 1 ? 's' : ''}</div>
                <div className="rc-cata-sub">explorer sans filtre garde-manger</div>
              </div>
              <button className="rc-cata-btn" onClick={() => setView('all')}>Parcourir le catalogue →</button>
            </div>
          </section>

          {antigaspi.length === 0 && cuisinable.length === 0 && manque.length === 0 && (
            <p className="rc-lede" style={{ marginTop: 8 }}>
              Rien de directement cuisinable avec ton stock actuel. Parcours le catalogue ou demande une idée à Myko.
            </p>
          )}
        </>
      ) : (
        <>
          <div className="rc-flat-head">
            <span className="rc-t">
              {q ? `Recherche · ${flatList.length}` : view === 'antigaspi' ? `Anti-gaspi · ${flatList.length}` : view === 'rapide' ? `Rapide ≤ 20 min · ${flatList.length}` : `Catalogue · ${flatList.length}`}
            </span>
            {!q && view !== 'cuisinable' && (
              <button className="rc-shlink rc-back" onClick={() => setView('cuisinable')}>← Vue cuisinable</button>
            )}
          </div>
          {flatList.length === 0 ? (
            <div className="v21-empty rc-empty"><p>Aucune recette trouvée.</p></div>
          ) : (
            <div className="rc-sheet">
              {flatList.map(({ r, s }) => <Fiche key={r.id} r={r} s={s} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
