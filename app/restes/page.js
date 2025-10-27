'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import RestesManager from '@/components/RestesManager';

export default function Restes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <p>Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1>🗑️ Gestion Anti-Gaspillage</h1>
        <p>Connectez-vous pour accéder à la gestion des restes</p>
      </div>
    );
  }

  return <RestesManager userId={user.id} />;
}
