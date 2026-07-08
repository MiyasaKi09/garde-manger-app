'use client';

export default function Error({ error, reset }) {
  return (
    <div className="card" style={{margin:'24px auto', maxWidth:700}}>
      <h2>Une erreur est survenue</h2>
      <p style={{color:'var(--ink-2,#555)', marginBottom:16}}>
        Quelque chose ne s&rsquo;est pas passé comme prévu. Vous pouvez réessayer
        ou revenir à l&rsquo;accueil.
      </p>
      {error?.digest && (
        <p style={{opacity:.6, fontSize:'0.8rem'}}>
          Référence : <code>{String(error.digest)}</code>
        </p>
      )}
      <div style={{display:'flex', gap:8, marginTop:12}}>
        <button className="btn" onClick={() => reset()}>Réessayer</button>
        <a className="btn" href="/">Accueil</a>
      </div>
    </div>
  );
}
