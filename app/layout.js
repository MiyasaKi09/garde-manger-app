// app/layout.js
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: 'system-ui, sans-serif', background:'#fafafa', color:'#111' }}>
        {children}
      </body>
    </html>
  );
}
