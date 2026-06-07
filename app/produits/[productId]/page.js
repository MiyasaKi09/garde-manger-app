'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

const daysUntil = (d) => {
  if (!d) return null;
  const todayISO = new Date().toISOString().split('T')[0];
  const targetISO = String(d).split('T')[0];
  return Math.round((new Date(targetISO) - new Date(todayISO)) / 86400000);
};

// Règle DLC : alerte à J-3 (cf. CLAUDE.md)
const dlcStatus = (d) => {
  const n = daysUntil(d);
  if (n === null) return 'ok';
  if (n < 0) return 'exp';
  if (n <= 3) return 'soon';
  return 'ok';
};

const dlcLabel = (d) => {
  const n = daysUntil(d);
  if (n === null) return '—';
  if (n < 0) return 'Périmé';
  if (n === 0) return "Aujourd'hui";
  if (n === 1) return 'Demain';
  if (n <= 3) return `J-${n}`;
  return `${n} j`;
};

export default function ProduitDetail(){
  const { productId } = useParams();
  const [rows, setRows] = useState([]);
  const [name, setName] = useState('…');
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ (async()=>{
    const { data: p } = await supabase.from('products_catalog').select('name').eq('id', productId).single();
    if (p) setName(p.name);
    const { data } = await supabase
      .from('inventory_lots')
      .select('id, qty, unit, dlc, entered_at, location:locations(name)')
      .eq('product_id', productId)
      .order('dlc', { ascending:true });
    setRows(data||[]);
    setLoading(false);
  })() }, [productId]);

  return (
    <div className="v21-page">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Produit</span>
          <h1 className="v21-title">{loading ? '…' : name}</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Tous les lots en stock, du plus urgent au plus frais.</p>
        </div>
        <div className="v21-hero-side">
          <Link href="/produits" className="v21-btn ghost">← Produits</Link>
        </div>
      </header>

      <section className="v21-section flush">
        <div className="v21-bh"><span className="v21-bl">Lots</span></div>

        {loading ? (
          <div aria-busy="true" aria-label="Chargement des lots">
            <div className="v21-skel" style={{ height: 56 }} />
            <div className="v21-skel" style={{ height: 56, marginTop: 12 }} />
          </div>
        ) : rows.length === 0 ? (
          <div className="v21-empty">
            <p>Aucun lot pour ce produit.</p>
            <Link href="/add" className="v21-btn">Ajouter un lot</Link>
          </div>
        ) : (
          <div className="v21-its">
            {rows.map(r=>{
              const st = dlcStatus(r.dlc);
              return (
                <div key={r.id} className={`v21-it ${st}`}>
                  <span className="v21-it-bar" aria-hidden="true" />
                  <span className="v21-it-n">{r.qty} {r.unit}</span>
                  <span className="v21-it-q">{r.location?.name || '—'}</span>
                  <span className="v21-it-lc">{r.entered_at ? `Entré ${String(r.entered_at).split('T')[0]}` : ''}</span>
                  <span className="v21-it-st">{dlcLabel(r.dlc)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
