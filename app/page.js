// app/page.jsx
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Myko</h1>
      <p>Bienvenue 👋</p>
      <p><a href="/login" style={{ color:'#2563eb' }}>Se connecter</a></p>
    </main>
  );
}
