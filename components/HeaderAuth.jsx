// components/HeaderAuth.jsx (Server Component)
import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabaseServer';

export default async function HeaderAuth() {
  const supabase = getServerSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return (
      <Link href="/login" className="btn btn-secondary" prefetch>
        Se connecter
      </Link>
    );
  }

  return (
    <form action="/auth/signout" method="post">
      <button className="btn" type="submit">Se déconnecter</button>
    </form>
  );
}
