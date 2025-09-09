'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

// Helpers
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysUntil = (date) => {
  if (!date) return null;
  const diff = new Date(date) - new Date();
  return Math.ceil(diff / 86400000);
};

// Composant pour les particules mycorhiziennes animées
function MyceliumNetwork() {
  useEffect(() => {
    const canvas = document.getElementById('mycelium-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const connections = [];
    const particleCount = 50;
    
    // Créer les particules (spores)
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
      });
    }
    
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Mettre à jour et dessiner les particules
      particles.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Rebondir sur les bords
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        
        // Dessiner la particule
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 149, 109, 0.6)';
        ctx.fill();
        
        // Créer des connexions
        particles.forEach((otherParticle, j) => {
          if (i !== j) {
            const dist = Math.hypot(particle.x - otherParticle.x, particle.y - otherParticle.y);
            if (dist < 150) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = `rgba(139, 149, 109, ${0.2 * (1 - dist / 150)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        });
      });
      
      requestAnimationFrame(animate);
    }
    
    animate();
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return (
    <canvas
      id="mycelium-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.3,
        zIndex: 0,
      }}
    />
  );
}

// Carte de statistique animée
function StatCard({ icon, value, label, color, trend }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      className="stat-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: `linear-gradient(135deg, ${color}15, ${color}08)`,
        border: `2px solid ${color}30`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        textAlign: 'center',
        transition: 'all var(--transition-spring)',
        transform: isHovered ? 'translateY(-8px) scale(1.05)' : 'none',
        boxShadow: isHovered ? 'var(--shadow-lg)' : 'var(--shadow-md)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '200%',
          height: '200%',
          background: `radial-gradient(circle, ${color}10 0%, transparent 70%)`,
          transform: isHovered ? 'scale(1)' : 'scale(0)',
          transition: 'transform var(--transition-slow)',
        }}
      />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{icon}</div>
        <div style={{ fontSize: '2.5rem', fontWeight: '700', color, marginBottom: '0.25rem' }}>
          {value}
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--earth-600)', fontWeight: '500' }}>
          {label}
        </div>
        {trend && (
          <div style={{ 
            fontSize: '0.8rem', 
            color: trend > 0 ? 'var(--success)' : 'var(--danger)',
            marginTop: '0.5rem',
          }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% cette semaine
          </div>
        )}
      </div>
    </div>
  );
}

// Carte d'action rapide
function QuickActionCard({ icon, title, description, href, color = 'var(--forest-500)' }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          background: 'var(--warm-white)',
          border: `2px solid ${isHovered ? color : 'var(--soft-gray)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          height: '100%',
          transition: 'all var(--transition-base)',
          transform: isHovered ? 'translateY(-4px)' : 'none',
          boxShadow: isHovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '0.75rem',
        }}
      >
        <div
          style={{
            fontSize: '3rem',
            transform: isHovered ? 'scale(1.2) rotate(5deg)' : 'scale(1)',
            transition: 'transform var(--transition-spring)',
          }}
        >
          {icon}
        </div>
        <h3 style={{ margin: 0, color: 'var(--forest-700)', fontSize: '1.1rem' }}>
          {title}
        </h3>
        {description && (
          <p style={{ margin: 0, color: 'var(--earth-600)', fontSize: '0.85rem', opacity: 0.8 }}>
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}

// Carte d'alerte produit
function AlertCard({ item, type = 'expiring' }) {
  const days = daysUntil(item.dlc || item.best_before);
  
  const getStatus = () => {
    if (type === 'expired' || days < 0) return { color: 'var(--danger)', label: 'Périmé', icon: '🍂' };
    if (days === 0) return { color: 'var(--autumn-orange)', label: "Aujourd'hui", icon: '⚡' };
    if (days <= 3) return { color: 'var(--autumn-yellow)', label: `${days}j`, icon: '⏰' };
    if (days <= 7) return { color: 'var(--forest-500)', label: `${days}j`, icon: '📅' };
    return { color: 'var(--success)', label: `${days}j`, icon: '🌿' };
  };
  
  const status = getStatus();
  
  return (
    <div
      className="alert-card"
      style={{
        background: 'var(--warm-white)',
        border: `2px solid ${status.color}30`,
        borderLeft: `4px solid ${status.color}`,
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'all var(--transition-base)',
        cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: '600', color: 'var(--forest-700)', marginBottom: '0.25rem' }}>
          {item.product?.name || 'Produit'}
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--earth-600)' }}>
          {item.qty} {item.unit}
          {item.location?.name && (
            <span style={{ marginLeft: '0.5rem', color: 'var(--earth-500)' }}>
              📍 {item.location.name}
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.4rem 0.8rem',
          background: `${status.color}15`,
          borderRadius: 'var(--radius-full)',
          color: status.color,
          fontWeight: '500',
          fontSize: '0.9rem',
        }}
      >
        <span>{status.icon}</span>
        <span>{status.label}</span>
      </div>
    </div>
  );
}

// Section Hero avec animation
function HeroSection({ user }) {
  const [timeOfDay, setTimeOfDay] = useState('');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('Bonjour');
    else if (hour < 18) setTimeOfDay('Bon après-midi');
    else setTimeOfDay('Bonsoir');
  }, []);
  
  return (
    <section
      className="hero-section"
      style={{
        background: 'linear-gradient(135deg, var(--forest-50), var(--earth-50))',
        borderRadius: 'var(--radius-xl)',
        padding: '3rem',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Pattern décoratif */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '40%',
          height: '100%',
          opacity: 0.1,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}
      />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', marginBottom: '1rem' }}>
          {timeOfDay}{user ? `, ${user.email?.split('@')[0]}` : ''} 🌿
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--earth-600)', marginBottom: '2rem', maxWidth: '600px' }}>
          Bienvenue dans <strong>Myko</strong>, votre réseau mycorhizien qui connecte 
          <span style={{ color: 'var(--forest-500)', fontWeight: '600' }}> garde-manger</span>,
          <span style={{ color: 'var(--autumn-orange)', fontWeight: '600' }}> recettes</span> et
          <span style={{ color: 'var(--earth-600)', fontWeight: '600' }}> potager</span>.
        </p>
        
        {!user && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link href="/login" className="btn primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
              Se connecter
            </Link>
            <Link href="/recipes" className="btn secondary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
              Explorer les recettes
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

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
  
  // Auth
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
  
  // Load data
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    async function loadData() {
      try {
        const today = todayISO();
        
        // Charger toutes les données en parallèle
        const [lotsRes, recipesRes, tasksRes, plantingsRes, harvestsRes] = await Promise.all([
          supabase
            .from('inventory_lots')
            .select('*, product:products_catalog(name), location:locations(name)')
            .order('dlc', { ascending: true })
            .limit(20),
          supabase
            .from('recipes')
            .select('*')
            .limit(10),
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
  
  // Calculs
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
    <div className="container" style={{ position: 'relative' }}>
      <MyceliumNetwork />
      
      <HeroSection user={user} />
      
      {/* Stats Dashboard */}
      {user && !loading && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>📊 Vue d'ensemble</h2>
          <div className="grid cols-4">
            <StatCard
              icon="🏺"
              value={stats.totalLots}
              label="Lots en stock"
              color="var(--forest-500)"
              trend={5}
            />
            <StatCard
              icon="⚠️"
              value={stats.expiring}
              label="À consommer"
              color="var(--autumn-orange)"
              trend={-10}
            />
            <StatCard
              icon="🌱"
              value={stats.activePlants}
              label="Plantations actives"
              color="var(--earth-600)"
              trend={15}
            />
            <StatCard
              icon="📖"
              value={stats.totalRecipes}
              label="Recettes disponibles"
              color="var(--mushroom)"
            />
          </div>
        </section>
      )}
      
      {/* Actions rapides */}
      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>⚡ Actions rapides</h2>
        <div className="grid cols-4">
          <QuickActionCard
            icon="➕"
            title="Ajouter un lot"
            description="Nouveau produit"
            href="/pantry"
            color="var(--forest-500)"
          />
          <QuickActionCard
            icon="🥘"
            title="Cuisiner"
            description="Lancer une recette"
            href="/recipes"
            color="var(--autumn-orange)"
          />
          <QuickActionCard
            icon="🌱"
            title="Planter"
            description="Nouveau semis"
            href="/garden"
            color="var(--earth-600)"
          />
          <QuickActionCard
            icon="📅"
            title="Planning"
            description="Voir les tâches"
            href="/planning"
            color="var(--mushroom)"
          />
        </div>
      </section>
      
      {/* Alertes et notifications */}
      {user && urgentItems.length > 0 && (
        <section style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0 }}>🔔 Produits à consommer rapidement</h2>
            <Link href="/pantry" className="btn secondary small">
              Voir tout →
            </Link>
          </div>
          <div className="grid cols-2">
            {urgentItems.map(item => (
              <AlertCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}
      
      {/* Section réseau mycorhizien */}
      <section
        className="card"
        style={{
          background: 'linear-gradient(135deg, var(--mushroom)10, var(--earth-100))',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h2 style={{ marginBottom: '1rem' }}>🍄 Le Réseau Mycorhizien</h2>
        <p style={{ maxWidth: '600px', margin: '0 auto 1.5rem', color: 'var(--earth-700)' }}>
          Comme les champignons connectent les arbres dans la forêt, Myko relie vos aliments,
          recettes et cultures pour créer un écosystème alimentaire harmonieux et durable.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏺</div>
            <div style={{ fontWeight: '600', color: 'var(--forest-700)' }}>Garde-manger</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--earth-600)' }}>Gérez vos stocks</div>
          </div>
          <div style={{ fontSize: '2rem', alignSelf: 'center', color: 'var(--mushroom)' }}>↔️</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📖</div>
            <div style={{ fontWeight: '600', color: 'var(--forest-700)' }}>Recettes</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--earth-600)' }}>Cuisinez malin</div>
          </div>
          <div style={{ fontSize: '2rem', alignSelf: 'center', color: 'var(--mushroom)' }}>↔️</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌱</div>
            <div style={{ fontWeight: '600', color: 'var(--forest-700)' }}>Potager</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--earth-600)' }}>Cultivez local</div>
          </div>
        </div>
      </section>
      
      {/* Message de bienvenue pour non-connectés */}
      {!user && (
        <section
          className="card"
          style={{
            marginTop: '2rem',
            padding: '3rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, var(--forest-50), var(--warm-white))',
          }}
        >
          <h2 style={{ marginBottom: '1rem' }}>🌿 Rejoignez le réseau</h2>
          <p style={{ maxWidth: '500px', margin: '0 auto 2rem', color: 'var(--earth-700)' }}>
            Connectez-vous pour accéder à toutes les fonctionnalités et commencer à gérer
            votre écosystème alimentaire de manière intelligente et durable.
          </p>
          <Link href="/login" className="btn primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
            Commencer maintenant →
          </Link>
        </section>
      )}
    </div>
  );
}
