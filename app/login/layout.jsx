export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LoginLayout({ children }) {
  return (
    <html lang="fr">
      <body style={{ background: '#fafafa' }}>
        {children}
      </body>
    </html>
  );
}
