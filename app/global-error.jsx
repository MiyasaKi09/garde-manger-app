'use client';

export default function GlobalError({ error, reset }) {

  return (
    <html>
      <body style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24}}>
        <div style={{maxWidth:600}}>
          <h1>Oups 🙈</h1>
          <p>Une erreur est survenue pendant le rendu.</p>
          {error?.digest && (
            <p style={{opacity:.7}}>
              <small>Digest: <code>{String(error.digest)}</code></small>
            </p>
          )}
          <div style={{display:'flex',gap:8,marginTop:12}}>
            <button className="btn" onClick={() => reset()}>Réessayer</button>
            <a className="btn" href="/login">Aller à la connexion</a>
            <a className="btn" href="/">Accueil</a>
          </div>
        </div>
      </body>
    </html>
  );
}
