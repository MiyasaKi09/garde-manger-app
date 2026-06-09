'use client';

export default function Error({ error, reset }) {
  return (
    <div className="card" style={{margin:'24px auto', maxWidth:700}}>
      <h2>Oups, une erreur est survenue</h2>
      <pre style={{whiteSpace:'pre-wrap', background:'#f6f6f6', padding:12, borderRadius:6}}>
        {String(error?.message || error)}
      </pre>
      <button className="btn" onClick={() => reset()}>Réessayer</button>
    </div>
  );
}
