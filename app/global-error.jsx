'use client';

export default function GlobalError({ error, reset }) {
  console.error('Global Error boundary:', error);
  return (
    <html>
      <body>
        <div className="card" style={{margin:'24px auto', maxWidth:700}}>
          <h2>Erreur critique</h2>
          <pre style={{whiteSpace:'pre-wrap', background:'#f6f6f6', padding:12, borderRadius:6}}>
            {String(error?.message || error)}
          </pre>
          <button className="btn" onClick={() => reset()}>Réessayer</button>
        </div>
      </body>
    </html>
  );
}
