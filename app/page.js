'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

/* ----------------- Helpers ----------------- */
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysUntil = (date) => {
  if (!date) return null;
  const diff = new Date(date) - new Date();
  return Math.ceil(diff / 86400000);
};

/* ----------------- Composants UI (glass) ----------------- */
const glassBase = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(10px) saturate(120%)',
  WebkitBackdropFilter: 'blur(10px) saturate(120%)',
  border: '1px solid rgba(0,0,0,0.06)',
  boxShadow: '0 8px 28px rgba(0,0,0,0.08)',
  color: 'var(--ink, #1f281f)',
};

function StatCard({ icon, value, label, color, trend }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="glass-card"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...glassBase,
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        textAlign: 'center',
        transition: 'transform var(--transition-base), box-shadow var(--transition-base), background var(--transition-base), border-color var(--transition-base)',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? '0 12px 34px rgba(0,0,0,0.12)' : glassBase.boxShadow,
      }}
    >
      <div style={{ fontSize: '2rem', marginBottom: '.25rem' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '.9rem', color: 'var(--earth-600)' }}>{label}</div>
      {typeof trend === 'number' && (
        <div
          style={{
            fontSize: '.8rem',
            color: trend > 0 ? 'var(--success)' : 'var(--danger)',
            marginTop: '.5rem',
            fontWeight: 600,
          }}
        >
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% cette semaine
        </div>
      )}
    </div>
  );
}

function QuickActionCard({ icon, title, description, href, color = 'var(--forest-500)' }) {
  const [hover, setHover] = useState(false);
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="glass-card"
        style={{
          ...glassBase,
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '.6rem',
          transition: 'transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base)',
          transform: hover ? 'translateY(-2px)' : 'none',
          boxShadow: hover ? '0 12px 34px rgba(0,0,0,0.12)' : glassBase.boxShadow,
          borderColor: hover ? 'rgba(0,0,0,0.10)' : glassBase.borderColor,
        }}
      >
        <div
          style={{
            fontSize: '2.2rem',
            transform: hover ? 'scale(1.05) rotate(3deg)' : 'scale(1)',
            transition: 'transform var(--transition-slow)',
          }}
        >
          {icon}
        </div>
        <h3 style={{ margin: 0, color: 'var(--forest-700)', fontSize: '1.05rem' }}>{title}</h3>
        {description && (
          <p style={{ margin: 0, color: 'var(--earth-600)', fontSize: '.86rem', opacity: .9 }}>
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}

function AlertCard({ item, type = 'expiring' }) {
  const days = daysUntil(item.dlc || item.best_before);
  const status = (() => {
    if (type === 'expired' || days < 0) return { color: 'var(--danger)', label: 'Périmé', icon: '🍂' };
    if (days === 0) return { color: 'var(--autumn-orange)', label: "Aujourd'hui", icon: '⚡' };
    if (days <= 3) return { color: 'var(--autumn-yellow)', label: `${days}j`, icon: '⏰' };
    if (days <= 7) return { color: 'var(--forest-500)', label: `${days}j`, icon: '📅' };
    return { color: 'var(--success)', label: `${days}j`, icon: '🌿' };
  })();

  return (
    <div
      className="glass-card"
      style={{
        ...glassBase,
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeft: `4px solid ${getComputedStyleColor(status.color)}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: 'var(--forest-700)', marginBottom: '.25rem' }}>
          {item.product?.name || 'Produit'}
        </div>
        <div style={{ fontSize: '.9rem', color: 'var(--earth-600)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.qty} {item.unit}
          {item.location?.name && (
            <span style={{ marginLeft: '.5rem', color: 'var(--earth-500)' }}>
              📍 {item.location.name}
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '.5rem',
          padding: '.4rem .8rem',
          background: 'rgba(255,255,255,0.7)',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 'var(--radius-full)',
          color: status.color,
          fontWeight: 600,
          fontSize: '.9rem',
        }}
      >
        <span>{status.icon}</span>
        <span>{status.label}</span>
      </div>
    </div>
  );
}

/* Convertit une var CSS en valeur RGBA lisible quand utilisée inline */
function getComputedStyleColor(cssVar) {
  if (typeof window === 'undefined') return 'currentColor';
  try {
    const name = cssVar.replace('var(', '').replace(')', '').trim();
    const val = getComputedStyle(document.documentElement).getPropertyValue(name);
    return val || cssVar;
  } catch {
    return cssVar;
  }
}

/* ----------------- Hero ----------------- */
function HeroSection({ user }) {
  const [timeOfDay, setTimeOfDay] = useState('');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('Bonjour');
    else if (hour < 18) setTimeOfDay('Bon après-midi');
    else setTimeOfDay('Bonsoir');
  }, []);

  // Hero en “verre” pour une lisibilité parfaite sur le papier peint
  return (
    <section
      className="glass-card"
      style={{
        ...glassBase,
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        marginBottom: '2rem',
      }}
    >
      <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', marginBottom: '.5rem' }}>
        {timeOfDay}{user ? `, ${user.email?.split('@')[0]}` : ''} 🌿
      </h1>
      <p style={{ fontSize: '1.1rem', color: 'var(--earth-700)', marginBottom: user ? '0' : '1.25rem', maxWidth: 700 }}>
        Bienvenue dans <strong>Myko</strong>, votre réseau mycorhizien qui connecte
        <span style={{ color: 'var(--forest-600)', fontWeight: 600 }}> garde-manger</span>,
        <span style={{ color: 'var(--autumn-orange)', fontWeight: 600 }}> recettes</span> et
        <span style={{ color: 'var(--earth-700)', fontWeight: 600 }}> potager</span>.
      </p>

      {!user && (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="/login" className="btn primary" style={{ fontSize: '1.05rem', padding: '.7rem 1.6rem' }}>
            Se connecter
          </Link>
          <Link href="/recipes" className="btn secondary" style={{ fontSize: '1.05rem', padding: '.7rem 1.6rem' }}>
            Explorer les recettes
          </Link>
        </div>
      )}
    </section>
  );
}

/* ----------------- Page ----------------- */
export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    lots: [],
    recipes: [],
    tasks: [],
    plantings: [],
    harvests: [],
  });

  /* Auth */
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setUser(data?.session?.user || null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user || null);
    });
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  /* Data */
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    async function loadData() {
      try {
        const today = todayISO();
        const [lotsRes, recipesRes, tasksRes, plantingsRes, harvestsRes] = await Promise.all([
          supabase
            .from('inventory_lots')
            .select('*, product:products_catalog(name), location:locations(name)')
            .order('dlc', { ascending: true })
            .limit(20),
          supabase.from('recipes').select('*').limit(10),
          supabase
            .from('care_tasks')
            .select('*, planting:plantings(*, variety:plant_varieties(*))')
            .is('done_at', null)
            .lte('due_date', today)
            .limit(10),
          supabase
            .from('plantings')
            .select('*, variety:plant_varieties(*), bed:garden_beds(name)')
            .eq('status', 'en_cours')
            .limit(10),
          supabase
            .from('harvests')
            .select('*, planting:plantings(variety:plant_varieties(*))')
            .order('date', { ascending: false })
            .limit(5),
        ]);

        setData({
          lots: lotsRes.data || [],
          recipes: recipesRes.data || [],
          tasks: tasksRes.data || [],
          plantings: plantingsRes.data || [],
          harvests: harvestsRes.data || [],
        });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  /* Stats */
  const stats = useMemo(() => {
    const expired = data.lots.filter(l => daysUntil(l.dlc) < 0).length;
    const expiring = data.lots.filter(l => {
      const d = daysUntil(l.dlc);
      return d !== null && d >= 0 && d <= 7;
    }).length;
    const totalLots = data.lots.length;
    const activePlants = data.plantings.length;
    const pendingTasks = data.tasks.length;
    const totalRecipes = data.recipes.length;
    return { expired, expiring, totalLots, activePlants, pendingTasks, totalRecipes };
  }, [data]);

  const urgentItems = useMemo(() => {
    return data.lots
      .filter(l => {
        const d = daysUntil(l.dlc);
        return d !== null && d <= 3;
      })
      .slice(0, 5);
  }, [data.lots]);

  return (
    <div className="container" style={{ position: 'relative', zIndex: 1 }}>
      {/* HERO (verre) */}
      <HeroSection user={user} />

      {/* Stats Dashboard (verre) */}
      {user && !loading && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>📊 Vue d'ensemble</h2>
          <div className="grid cols-4">
            <StatCard icon="🏺" value={stats.totalLots} label="Lots en stock" color="var(--forest-600)" trend={5} />
            <StatCard icon="⚠️" value={stats.expiring} label="À consommer" color="var(--autumn-orange)" trend={-10} />
            <StatCard icon="🌱" value={stats.activePlants} label="Plantations actives" color="var(--earth-700)" trend={15} />
            <StatCard icon="📖" value={stats.totalRecipes} label="Recettes disponibles" color="var(--mushroom)" />
          </div>
        </section>
      )}

      {/* Actions rapides (verre) */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>⚡ Actions rapides</h2>
        <div className="grid cols-4">
          <QuickActionCard icon="➕" title="Ajouter un lot" description="Nouveau produit" href="/pantry" color="var(--forest-500)" />
          <QuickActionCard icon="🥘" title="Cuisiner" description="Lancer une recette" href="/recipes" color="var(--autumn-orange)" />
          <QuickActionCard icon="🌱" title="Planter" description="Nouveau semis" href="/garden" color="var(--earth-600)" />
          <QuickActionCard icon="📅" title="Planning" description="Voir les tâches" href="/planning" color="var(--mushroom)" />
        </div>
      </section>

      {/* Alertes (verre) */}
      {user && urgentItems.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>🔔 Produits à consommer rapidement</h2>
            <Link href="/pantry" className="btn secondary small">Voir tout →</Link>
          </div>
          <div className="grid cols-2">
            {urgentItems.map(item => (
              <AlertCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Section réseau mycorhizien (verre, lisible) */}
      <section
        className="glass-card"
        style={{
          ...glassBase,
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          marginBottom: '2rem',
          textAlign: 'center',
        }}
      >
        <h2 style={{ marginBottom: '.75rem' }}>🍄 Le Réseau Mycorhizien</h2>
        <p style={{ maxWidth: 700, margin: '0 auto 1.25rem', color: 'var(--earth-700)' }}>
          Comme les champignons connectent les arbres dans la forêt, Myko relie vos aliments,
          recettes et cultures pour créer un écosystème alimentaire harmonieux et durable.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '.25rem' }}>🏺</div>
            <div style={{ fontWeight: 600, color: 'var(--forest-700)' }}>Garde-manger</div>
            <div style={{ fontSize: '.85rem', color: 'var(--earth-700)' }}>Gérez vos stocks</div>
          </div>
          <div style={{ fontSize: '1.6rem', alignSelf: 'center', color: 'var(--mushroom)' }}>↔️</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '.25rem' }}>📖</div>
            <div style={{ fontWeight: 600, color: 'var(--forest-700)' }}>Recettes</div>
            <div style={{ fontSize: '.85rem', color: 'var(--earth-700)' }}>Cuisinez malin</div>
          </div>
          <div style={{ fontSize: '1.6rem', alignSelf: 'center', color: 'var(--mushroom)' }}>↔️</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: '.25rem' }}>🌱</div>
            <div style={{ fontWeight: 600, color: 'var(--forest-700)' }}>Potager</div>
            <div style={{ fontSize: '.85rem', color: 'var(--earth-700)' }}>Cultivez local</div>
          </div>
        </div>
      </section>

      {/* Message de bienvenue (verre) */}
      {!user && (
        <section
          className="glass-card"
          style={{
            ...glassBase,
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h2 style={{ marginBottom: '.75rem' }}>🌿 Rejoignez le réseau</h2>
          <p style={{ maxWidth: 560, margin: '0 auto 1.25rem', color: 'var(--earth-700)' }}>
            Connectez-vous pour accéder à toutes les fonctionnalités et commencer à gérer
            votre écosystème alimentaire de manière intelligente et durable.
          </p>
          <Link href="/login" className="btn primary" style={{ fontSize: '1.05rem', padding: '.7rem 1.6rem' }}>
            Commencer maintenant →
          </Link>
        </section>
      )}
    </div>
  );
}
