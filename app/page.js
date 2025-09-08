'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { todayISO } from '@/lib/utils';

// --- Helpers ---
const addDaysISO = (d) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
const daysLeft = (dlc) => (dlc ? Math.ceil((new Date(dlc) - new Date()) / 86400000) : null);

// --- Composants UI poétiques ---
function LifeIndicator({ days }) {
  if (!Number.isFinite(days)) return null;

  let status = 'vivant';
  let color = 'var(--sage-green)';
  let icon = '🌿';

  if (days < 0) {
    status = 'éteint';
    color = 'var(--earth-brown)';
    icon = '🍂';
  } else if (days <= 3) {
    status = 'fragile';
    color = 'var(--autumn-orange)';
    icon = '🍁';
  } else if (days <= 7) {
    status = 'mûr';
    color = 'var(--gold-accent)';
    icon = '🌾';
  }

  return (
    <div
      className="life-indicator"
      title={status}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: '0.2rem 0.6rem',
        background: `linear-gradient(135deg, ${color}22, ${color}11)`,
        border: `1px solid ${color}44`,
        borderRadius: '12px',
        fontSize: '0.85rem',
        color,
        fontWeight: 500,
      }}
    >
      <span style={{ fontSize: '0.9rem' }}>{icon}</span>
      <span>{Math.abs(days)}j</span>
    </div>
  );
}

function renderItemContent(item, type) {
  if (type === 'alert') {
    return (
      <>
        <div style={{ flex: 1 }}>
          <strong style={{ color: 'var(--forest-green)' }}>{item.product?.name}</strong>
          <span style={{ color: 'var(--moss-green)', marginLeft: '0.5rem' }}>
            {item.qty} {item.unit}
          </span>
          {item.location?.name && (
            <span
              style={{
                color: 'var(--spore)',
                fontSize: '0.85rem',
                marginLeft: '0.5rem',
                fontStyle: 'italic',
              }}
            >
              📍 {item.location.name}
            </span>
          )}
        </div>
        <LifeIndicator days={daysLeft(item.dlc)} />
      </>
    );
  }

  if (type === 'task') {
    return (
      <>
        <div style={{ flex: 1 }}>
          <strong style={{ color: 'var(--forest-green)', textTransform: 'capitalize' }}>
            {item.type}
          </strong>
          {item.planting?.variety && (
            <span style={{ color: 'var(--moss-green)', marginLeft: '0.5rem' }}>
              {item.planting.variety.species} {item.planting.variety.variety}
            </span>
          )}
          {item.planting?.bed?.name && (
            <span
              style={{
                color: 'var(--spore)',
                fontSize: '0.85rem',
                marginLeft: '0.5rem',
              }}
            >
              • {item.planting.bed.name}
            </span>
          )}
        </div>
        {item.due_date && (
          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--spore)',
              fontStyle: 'italic',
            }}
          >
            {new Date(item.due_date).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        )}
      </>
    );
  }

  if (type === 'harvest') {
    return (
      <>
        <div style={{ flex: 1 }}>
          <strong style={{ color: 'var(--forest-green)' }}>
            {item.qty} {item.unit}
          </strong>
          {item.planting?.variety && (
            <span style={{ color: 'var(--moss-green)', marginLeft: '0.5rem' }}>
              {item.planting.variety.species} {item.planting.variety.variety}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: '0.85rem',
            color: 'var(--spore)',
            fontStyle: 'italic',
          }}
        >
          {new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
      </>
    );
  }

  return null;
}

function ConnectionCard({
  title,
  items,
  type = 'alert',
  emptyMessage = 'Le calme plat 🌊',
  linkText = 'Explorer →',
  linkHref = '/pantry',
}) {
  const typeStyles = {
    alert: {
      gradient: 'linear-gradient(135deg, rgba(230, 126, 34, 0.05), rgba(212, 165, 116, 0.05))',
      border: 'rgba(230, 126, 34, 0.2)',
      icon: '⚡',
    },
    task: {
      gradient: 'linear-gradient(135deg, rgba(135, 169, 107, 0.05), rgba(139, 149, 109, 0.05))',
      border: 'rgba(135, 169, 107, 0.3)',
      icon: '🌱',
    },
    harvest: {
      gradient: 'linear-gradient(135deg, rgba(212, 165, 116, 0.05), rgba(160, 130, 109, 0.05))',
      border: 'rgba(212, 165, 116, 0.3)',
      icon: '🧺',
    },
  };

  const style = typeStyles[type] || typeStyles.alert;

  return (
    <div
      className="connection-card"
      style={{
        background: style.gradient,
        border: `1px solid ${style.border}`,
        borderRadius: '16px',
        padding: '1.25rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}
      >
        <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>{style.icon}</span>
          {title}
        </h3>
        <Link
          href={linkHref}
          style={{
            color: 'var(--moss-green)',
            textDecoration: 'none',
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'color 0.3s',
          }}
        >
          {linkText}
        </Link>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {!items || items.length === 0 ? (
          <p
            style={{
              color: 'var(--moss-green)',
              fontStyle: 'italic',
              fontSize: '0.95rem',
              opacity: 0.8,
              textAlign: 'center',
              padding: '1rem 0',
            }}
          >
            {emptyMessage}
          </p>
        ) : (
          items.slice(0, 4).map((item, idx) => (
            <div
              key={item.id || idx}
              className="item-row"
              style={{
                padding: '0.6rem',
                background: 'var(--warm-white)',
                borderRadius: '8px',
                fontSize: '0.9rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
            >
              {renderItemContent(item, type)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label, description }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        className="quick-action"
        style={{
          background: 'var(--warm-white)',
          border: '2px solid transparent',
          borderRadius: '16px',
          padding: '1.25rem',
          textAlign: 'center',
          transition: 'all 0.3s',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <div
          style={{ fontSize: '2rem', marginBottom: '0.25rem', transform: 'scale(1)', transition: 'transform 0.3s' }}
          className="action-icon"
        >
          {icon}
        </div>
        <div style={{ color: 'var(--forest-green)', fontWeight: 600, fontSize: '0.95rem' }}>{label}</div>
        {description && (
          <div style={{ color: 'var(--moss-green)', fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>
            {description}
          </div>
        )}
      </div>
    </Link>
  );
}

function RecipeConnection({ recipe }) {
  return (
    <Link href={`/recipes/${recipe.id}`} style={{ textDecoration: 'none' }}>
      <div
        className="recipe-card"
        style={{
          background: 'linear-gradient(135deg, var(--warm-white), rgba(212, 196, 176, 0.1))',
          border: '1px solid rgba(160, 130, 109, 0.2)',
          borderRadius: '12px',
          padding: '1rem',
          transition: 'all 0.3s',
          cursor: 'pointer',
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--forest-green)', fontSize: '1rem' }}>{recipe.title}</h4>
        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--moss-green)' }}>
          {recipe.time_min ? <span>⏱ {recipe.time_min}min</span> : null}
          {recipe.tags && recipe.tags.length > 0 ? <span>• {recipe.tags.slice(0, 2).join(', ')}</span> : null}
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [lots, setLots] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [tasksToday, setTasksToday] = useState([]);
  const [tasksNext, setTasksNext] = useState([]);
  const [plantings, setPlantings] = useState([]);
  const [harvestsRecent, setHarvestsRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const today = todayISO();
      const soon7 = addDaysISO(7);

      const [
        lotsRes,
        recipesRes,
        todayTasksRes,
        nextTasksRes,
        plantingsRes,
        harvestsRes,
      ] = await Promise.all([
        supabase
          .from('inventory_lots')
          .select(
            'id, product_id, qty, unit, dlc, opened_at, entered_at, product:products_catalog(name,category), location:locations(name)'
          )
          .order('dlc', { ascending: true }),
        supabase
          .from('recipes')
          .select(
            'id, title, time_min, tags, ingredients:recipe_ingredients(product_id, qty, unit, optional, product:products_catalog(name))'
          )
          .order('title'),
        supabase
          .from('care_tasks')
          .select(
            'id, type, due_date, planting:plantings(id, sow_or_plant_date, variety:plant_varieties(species,variety), bed:garden_beds(name))'
          )
          .is('done_at', null)
          .lte('due_date', today)
          .order('due_date', { ascending: true }),
        supabase
          .from('care_tasks')
          .select(
            'id, type, due_date, planting:plantings(id, sow_or_plant_date, variety:plant_varieties(species,variety), bed:garden_beds(name))'
          )
          .is('done_at', null)
          .gt('due_date', today)
          .lte('due_date', soon7)
          .order('due_date', { ascending: true }),
        supabase
          .from('plantings')
          .select(
            'id, status, sow_or_plant_date, note, variety:plant_varieties(species,variety), bed:garden_beds(name)'
          )
          .eq('status', 'en_cours')
          .order('sow_or_plant_date', { ascending: false })
          .limit(5),
        supabase
          .from('harvests')
          .select('id, date, qty, unit, planting:plantings(variety:plant_varieties(species,variety))')
          .gte('date', addDaysISO(-7))
          .order('date', { ascending: false })
          .limit(5),
      ]);

      setLots(lotsRes.data || []);
      setRecipes(recipesRes.data || []);
      setTasksToday(todayTasksRes.data || []);
      setTasksNext(nextTasksRes.data || []);
      setPlantings(plantingsRes.data || []);
      setHarvestsRecent(harvestsRes.data || []);
      setLoading(false);
    })();
  }, []);

  // --- Dérivés / Connexions ---
  const expiringLots = useMemo(() => {
    const withDlc = (lots || []).filter((l) => !!l.dlc);
    const urgent = withDlc.filter((l) => {
      const d = daysLeft(l.dlc);
      return Number.isFinite(d) && d <= 3;
    });
    const overdue = withDlc.filter((l) => {
      const d = daysLeft(l.dlc);
      return Number.isFinite(d) && d < 0;
    });
    // Priorité : expirés d’abord, puis urgents
    return [...overdue, ...urgent].slice(0, 8);
  }, [lots]);

  const recipeSuggestions = useMemo(() => {
    if (!recipes?.length || !lots?.length) return [];
    const lotNames = new Set(
      lots
        .map((l) => l.product?.name?.toLowerCase())
        .filter(Boolean)
    );

    // Une recette est "pertinente" si au moins un ingrédient correspond
    const relevant = (recipes || []).filter((r) =>
      (r.ingredients || []).some((ing) => {
        const ingName = ing?.product?.name?.toLowerCase();
        if (!ingName) return false;
        // inclusion souple (tomate ↔ tomates concassées)
        return [...lotNames].some((ln) => ingName.includes(ln) || ln.includes(ingName));
      })
    );

    return relevant.slice(0, 6);
  }, [recipes, lots]);

  // --- Rendu ---
  if (loading) {
    return (
      <div className="container" style={{ padding: '1.5rem 0' }}>
        <p style={{ opacity: 0.7 }}>Chargement…</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ display: 'grid', gap: 16, padding: '1.5rem 0' }}>
      {/* Hero */}
      <section className="card" style={{ padding: '1rem 1.25rem' }}>
        <h1 style={{ margin: 0, color: 'var(--forest-green)' }}>🍄 Myko</h1>
        <p style={{ marginTop: 6, color: 'var(--moss-green)' }}>
          « Ne laisse rien mourir en silence. Donne une seconde vie à chaque aliment. »
        </p>
      </section>

      {/* Actions rapides */}
      <section
        className="grid"
        style={{ gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}
      >
        <QuickAction href="/pantry" icon="🏺" label="Garde-manger" description="Gère tes stocks" />
        <QuickAction href="/recipes" icon="📖" label="Recettes" description="Ajoute & cuisine" />
        <QuickAction href="/garden" icon="🌱" label="Potager" description="Semis, soins, récoltes" />
        <QuickAction href="/planning" icon="🗓️" label="Planning" description="Tes repas de la semaine" />
        <QuickAction href="/settings" icon="⚙️" label="Paramètres" description="Conversions, unités…" />
      </section>

      {/* Connexions & alertes */}
      <section
        className="grid"
        style={{ gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}
      >
        <ConnectionCard
          title="À consommer vite"
          type="alert"
          items={expiringLots}
          emptyMessage="Aucun produit urgent 🌿"
          linkText="Voir le garde-manger →"
          linkHref="/pantry"
        />
        <ConnectionCard
          title="Soins à faire aujourd’hui"
          type="task"
          items={tasksToday}
          emptyMessage="Aucune tâche aujourd’hui ☕"
          linkText="Ouvrir le potager →"
          linkHref="/garden"
        />
        <ConnectionCard
          title="À venir (7 jours)"
          type="task"
          items={tasksNext}
          emptyMessage="Rien de prévu pour l’instant"
          linkText="Voir les tâches →"
          linkHref="/garden"
        />
        <ConnectionCard
          title="Récoltes récentes"
          type="harvest"
          items={harvestsRecent}
          emptyMessage="Pas de récolte récente"
          linkText="Journal des récoltes →"
          linkHref="/garden"
        />
      </section>

      {/* Recettes pertinentes */}
      <section className="card" style={{ padding: '1rem 1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--forest-green)' }}>
            Recettes qui utilisent tes stocks
          </h2>
          <Link href="/recipes" style={{ color: 'var(--moss-green)', textDecoration: 'none' }}>
            Parcourir toutes les recettes →
          </Link>
        </div>

        {recipeSuggestions.length === 0 ? (
          <p style={{ opacity: 0.7, fontStyle: 'italic' }}>
            Ajoute quelques recettes ou des produits au garde-manger pour obtenir des suggestions.
          </p>
        ) : (
          <div className="grid" style={{ gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {recipeSuggestions.map((r) => (
              <RecipeConnection key={r.id} recipe={r} />
            ))}
          </div>
        )}
      </section>

      {/* Plantations en cours (aperçu) */}
      <section className="card" style={{ padding: '1rem 1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--forest-green)' }}>Plantations en cours</h2>
          <Link href="/garden" style={{ color: 'var(--moss-green)', textDecoration: 'none' }}>
            Ouvrir le potager →
          </Link>
        </div>

        {plantings.length === 0 ? (
          <p style={{ opacity: 0.7, fontStyle: 'italic' }}>Aucune culture en cours pour l’instant.</p>
        ) : (
          <div className="grid" style={{ gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {plantings.map((p) => (
              <div
                key={p.id}
                className="card"
                style={{
                  border: '1px solid rgba(135,169,107,.25)',
                  padding: '0.75rem',
                  borderRadius: 12,
                  background: 'var(--warm-white)',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--forest-green)' }}>
                  {p.variety?.species} {p.variety?.variety}
                </div>
                <div style={{ fontSize: '.9rem', color: 'var(--moss-green)', marginTop: 4 }}>
                  {p.bed?.name ? <>📍 {p.bed.name}</> : null}
                </div>
                <div style={{ fontSize: '.85rem', color: 'var(--spore)', marginTop: 4 }}>
                  Semé/planté le {new Date(p.sow_or_plant_date).toLocaleDateString('fr-FR')}
                </div>
                {p.note ? (
                  <div style={{ fontSize: '.85rem', opacity: 0.85, marginTop: 6 }}>{p.note}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
