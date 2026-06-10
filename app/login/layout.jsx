// Layout imbriqué : simple passthrough. Le layout racine fournit déjà
// <html>/<body>, les fonts et les tokens — en rendre un second ici cassait
// la charte (page sans variables CSS ni typographies).
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function LoginLayout({ children }) {
  return children;
}
