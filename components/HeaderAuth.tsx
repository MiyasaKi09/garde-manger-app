// components/HeaderAuth.tsx
import Link from 'next/link';
import { getServerSupabase } from '@/lib/supabaseServer';
import { SignOutButton } from '@/components/SignOutButton'; // votre bouton client existant

export default async function HeaderAuth() {
  const supabase = getServerSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  // Connecté → bouton Déconnexion ; sinon → lien Connexion
  if (user) {
    return <SignOutButton />;
  }

  return (
    <Link href="/login" className="btn btn-secondary" prefetch={false}>
      Se connecter
    </Link>
  );
}
