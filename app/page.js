// app/page.jsx
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
  if (!days && days !== 0) return null;

  let color = 'var(--sage-green)';
  let icon = '🌿';

  if (days < 0) {
    color = 'var(--earth-brown)'; // périmé
    icon = '🍂';
  } else if (days <= 3) {
    color = 'var(--autumn-orange)'; // urgent
    icon = '🍁';
  } else if (days <= 7) {
    color = 'var(--gold-accent)'; // bientôt
    icon = '🌾';
  }

  return (
    <div
      className="life-indicator"
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
        fontWeight: '500',
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
            {new Date(item.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
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
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
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
            fontWeight: '500',
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
          style={{
            fontSize: '2rem',
            marginBottom: '0.25rem',
            transform: 'scale(1)',
            transition: 'transform 0.3s',
          }}
          className="action-icon"
        >
          {icon}
        </div>
        <div style={{ color: 'var(--forest-green)', fontWeight: '600', fontSize: '0.95rem' }}>{label}</div>
        {description && (
          <div
            style={{
              color: 'var(--moss-green)',
              fontSize: '0.8rem',
              opacity: 0.8,
              marginTop: '0.25rem',
            }}
          >
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
        <h4
          style={{
            margin: '0 0 0.5rem 0',
            color: 'var(--forest-green)',
            fontSize: '1rem',
          }}
        >
          {recipe.title}
        </h4>
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            fontSize: '0.85rem',
            color: 'var(--moss-green)',
          }}
        >
          {recipe.time_min && <span>⏱ {recipe.time_min}min</span>}
          {recipe.tags && recipe.tags.length > 0 && <span>• {recipe.tags.slice(0, 2).join(', ')}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [lots, setLots] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [tasksToday, setTasksToday] = useState([]);
  const [tasksNext, setTasksNext] = useState([]);
  const [plantings, setPlantings] = useState([]);
  const [harvestsRecent, setHarvestsRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr('');

      try {
        // 1) Session utilisateur
        const { data: userData, error: userErr } = await supabase.auth.getUser();
        if (userErr) throw userErr;
        if (cancelled) return;
        setMe(userData?.user ?? null);

        // Si pas de session : on arrête proprement (affichera CTA login + sections vides)
        if (!userData?.user) {
          setLots([]);
          setRecipes([]);
          setTasksToday([]);
          setTasksNext([]);
          setPlantings([]);
          setHarvestsRecent([]);
          return;
        }

        // 2) Charge toutes les données en parallèle
        const today = todayISO();
        const soon7 = addDaysISO(7);

        const promises = [
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
        ];

        const [
          lotsRes,
          recipesRes,
          todayTasksRes,
          nextTasksRes,
          plantingsRes,
          harvestsRes,
        ] = await Promise.all(promises);

        if (cancelled) return;

        // 3) Affectations avec fallback sûr
        setLots(lotsRes?.data || []);
        setRecipes(recipesRes?.data || []);
        setTasksToday(todayTasksRes?.data || []);
        setTasksNext(nextTasksRes?.data || []);
        setPlantings(plantingsRes?.data || []);
        setHarvestsRecent(harvestsRes?.data || []);

        // Optionnel: log des erreurs sans casser l’UI
        [lotsRes, recipesRes, todayTasksRes, nextTasksRes, plantingsRes, harvestsRes].forEach((r, i) => {
          if (r?.error) {
            console.warn('[Home] data fetch error idx', i, r.error?.message);
          }
        });
      } catch (e) {
        console.error('[Home] load error:', e);
        if (!cancelled) {
          setErr('Impossible de récupérer les données. Réessaie plus tard.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Dérivés : alertes garde-manger
  const urgentLots = useMemo(() => {
    const today = todayISO();
    return (lots || []).filter((l) => l.dlc && new Date(l.dlc) <= new Date(addDaysISO(3)));
  }, [lots]);

  const soonLots = useMemo(() => {
    const d7 = addDaysISO(7);
    const today = todayISO();
    return (lots || []).filter(
      (l) => l.dlc && new Date(l.dlc) > new Date(addDaysISO(3)) && new Date(l.dlc) <= new Date(d7)
    );
  }, [lots]);

  // Dérivés : quelques recettes liées aux produits urgents (heuristique simple)
  const recipeSuggestions = useMemo(() => {
    if (!recipes?.length || !urgentLots?.length) return [];
    const names = urgentLots
      .map((l) => l.product?.name?.toLowerCase())
      .filter(Boolean);

    const scored = recipes.map((r) => {
      const ingNames = (r.ingredients || []).map((i) => i.product?.name?.toLowerCase()).filter(Boolean);
      const score = ingNames.reduce((acc, n) => (names.some((x) => n.includes(x) || x.includes(n)) ? acc + 1 : acc), 0);
      return { ...r, _score: score };
    });

    return scored
      .filter((r) => r._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 6);
  }, [recipes, urgentLots]);

  // --- Rendu ---
  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <section className="hero card" style={{ padding: '1.25rem 1.25rem 0.75rem' }}>
        <h1>Bienvenue dans Myko</h1>
        <p style={{ opacity: 0.8, marginTop: 4 }}>
          Le réseau qui relie <b>garde-manger</b>, <b>recettes</b> et <b>potager</b>.
        </p>
        {!me && (
          <div style={{ marginTop: 12 }}>
            <Link className="btn" href="/login">
              Se connecter
            </Link>
          </div>
        )}
      </section>

      {err && (
        <div className="card" style={{ padding: 12, borderColor: '#ef4444' }}>
          <div style={{ color: '#b91c1c' }}>⚠️ {err}</div>
        </div>
      )}

      {/* état de chargement doux */}
      {loading && (
        <div className="card" style={{ padding: 16 }}>
          <div className="loading-container">
            <div className="loading-mycelium">
              <span></span><span></span><span></span>
            </div>
            <p>Connexion au réseau mycorhizien…</p>
          </div>
        </div>
      )}

      {/* quand pas connecté : on montre juste des actions rapides */}
      {!loading && !me && (
        <section className="card" style={{ padding: 16 }}>
          <h2 style={{ marginBottom: 8 }}>Actions rapides</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 12 }}>
            <QuickAction href="/login" icon="🔑" label="Se connecter" description="Accéder à vos données" />
            <QuickAction href="/recipes" icon="📖" label="Voir les recettes" />
            <QuickAction href="/pantry" icon="🏺" label="Voir le garde-manger" />
          </div>
        </section>
      )}

      {/* connecté : on affiche tout le dashboard */}
      {!loading && me && (
        <>
          <section style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr' }}>
            <div className="card" style={{ padding: 16 }}>
              <h2 style={{ marginBottom: 8 }}>Connexions & alertes</h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))',
                  gap: 12,
                }}
              >
                <ConnectionCard
                  title="Périssables (≤ 3j)"
                  items={urgentLots}
                  type="alert"
                  linkHref="/pantry"
                  linkText="Gérer le garde-manger →"
                  emptyMessage="Rien d’urgent pour l’instant 🍃"
                />
                <ConnectionCard
                  title="À surveiller (≤ 7j)"
                  items={soonLots}
                  type="alert"
                  linkHref="/pantry"
                  linkText="Voir tout →"
                  emptyMessage="Tout est au frais 🍶"
                />
                <ConnectionCard
                  title="Tâches du jour"
                  items={tasksToday}
                  type="task"
                  linkHref="/planning"
                  linkText="Planning →"
                  emptyMessage="Aucun soin prévu aujourd’hui 🌞"
                />
                <ConnectionCard
                  title="À venir (7 jours)"
                  items={tasksNext}
                  type="task"
                  linkHref="/planning"
                  linkText="Préparer →"
                  emptyMessage="Calendrier léger 🌿"
                />
              </div>
            </div>

            <aside className="card" style={{ padding: 16 }}>
              <h3 style={{ marginBottom: 8 }}>Actions rapides</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                <QuickAction href="/pantry" icon="➕" label="Ajouter un lot" description="Entrer un aliment" />
                <QuickAction href="/recipes/new" icon="🍳" label="Nouvelle recette" description="Écrire / importer" />
                <QuickAction href="/garden/plant" icon="🌱" label="Planter" description="Démarrer un semis" />
                <QuickAction href="/planning" icon="🗓️" label="Planifier" description="Arrosage, paillage…" />
              </div>
            </aside>
          </section>

          <section style={{ display: 'grid', gap: 12, gridTemplateColumns: '2fr 1fr' }}>
            <div className="card" style={{ padding: 16 }}>
              <h2 style={{ marginBottom: 8 }}>Recettes à partir du stock urgent</h2>
              {recipeSuggestions.length === 0 ? (
                <p style={{ opacity: 0.75 }}>Ajoutez des recettes ou des lots pour voir des suggestions ✨</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 10 }}>
                  {recipeSuggestions.map((r) => (
                    <RecipeConnection key={r.id} recipe={r} />
                  ))}
                </div>
              )}
            </div>

            <aside className="card" style={{ padding: 16 }}>
              <h3 style={{ marginBottom: 8 }}>Récoltes récentes</h3>
              {harvestsRecent?.length ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  {harvestsRecent.map((h) => (
                    <div
                      key={h.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem',
                        background: 'var(--warm-white)',
                        borderRadius: 8,
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--forest-green)' }}>
                          {h.qty} {h.unit}
                        </strong>
                        {h.planting?.variety && (
                          <span style={{ color: 'var(--moss-green)', marginLeft: 6 }}>
                            {h.planting.variety.species} {h.planting.variety.variety}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--spore)' }}>
                        {new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ opacity: 0.75 }}>Pas de récolte récente.</p>
              )}
            </aside>
          </section>

          <section className="card" style={{ padding: 16 }}>
            <h2 style={{ marginBottom: 8 }}>Plantations en cours</h2>
            {plantings?.length ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 10 }}>
                {plantings.map((p) => (
                  <div
                    key={p.id}
                    className="card"
                    style={{ padding: 12, border: '1px solid rgba(139,149,109,0.2)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <strong style={{ color: 'var(--forest-green)' }}>
                        {p.variety?.species} {p.variety?.variety}
                      </strong>
                      {p.bed?.name && (
                        <span style={{ color: 'var(--spore)', fontSize: 12, fontStyle: 'italic' }}>
                          {p.bed.name}
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'var(--moss-green)', fontSize: 13 }}>
                      🌱 {new Date(p.sow_or_plant_date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ opacity: 0.75 }}>Aucune plantation en cours.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
