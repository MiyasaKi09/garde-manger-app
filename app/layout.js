// app/layout.js
export const metadata = {
  title: 'Garde-Manger & Potager',
  description: 'Site perso mono-utilisateur',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto' }}>
        {children}
      </body>
    </html>
  );
}
