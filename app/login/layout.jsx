// app/login/layout.jsx
export const dynamic = 'force-dynamic';
export const revalidate = false;   // ✅ valeur attendue: false ou un nombre
export const fetchCache = 'force-no-store';

export default function LoginLayout({ children }) {
  return children;
}
