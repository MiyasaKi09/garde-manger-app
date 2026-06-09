'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function ProduitsPage(){
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{ (async()=>{
    // On agrège par produit pour afficher une carte par produit
    const { data, error } = await supabase
      .from('inventory_lots')
      .select('id, qty, unit, dlc, product:products_catalog(id,name,category), location:locations(id,name,icon)')
      .order('dlc', { ascending: true });
    if(!error) setLots(data||[]);
    setLoading(false);
  })() },[]);

  // Regroupe par produit
  const products = useMemo(()=>{
    const map = new Map();
    for(const l of lots){
      const pid = l.product?.id;
      if(!pid) continue;
      if(!map.has(pid)){
        map.set(pid, { id: pid, name: l.product.name, category: l.product.category, total: 0, unit: l.unit, samples: [] });
      }
      const rec = map.get(pid);
      rec.total += Number(l.qty||0);
      rec.unit = rec.unit || l.unit;
      rec.samples.push(l);
    }
    return Array.from(map.values()).sort((a,b)=>a.name.localeCompare(b.name));
  },[lots]);

  return (
    <div className="v21-page">
      <header className="v21-hero">
        <div className="v21-hero-text">
          <span className="v21-eyebrow">Garde-manger</span>
          <h1 className="v21-title">Produits</h1>
          <div className="v21-rule" />
          <p className="v21-lede">Vos produits en stock, regroupés et triés par fraîcheur.</p>
        </div>
      </header>

      <section className="v21-section flush">
        <div className="v21-mast-h">
          <h2 className="v21-mast-title">Catalogue</h2>
          <span className="v21-mast-c">{products.length} produit{products.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="v21-cards" aria-busy="true" aria-label="Chargement des produits" style={{ marginTop: 22 }}>
            {[0,1,2,3].map(i => <div key={i} className="v21-skel" style={{ height: 132 }} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="v21-empty">
            <p>Aucun produit en stock pour le moment.</p>
            <Link href="/pantry" className="v21-btn">Ajouter un lot</Link>
          </div>
        ) : (
          <div className="v21-cards" style={{ marginTop: 22 }}>
            {products.map(p=>(
              <Link key={p.id} href={`/produits/${p.id}`} className="v21-card">
                <div className="v21-card-body">
                  <span className="v21-card-title">{p.name}</span>
                  <span className="v21-bignum" style={{ fontSize: 22 }}>{p.total} {p.unit}</span>
                  <span className="v21-card-meta">{p.category || '—'}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
