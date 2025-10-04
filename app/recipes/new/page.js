'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewRecipePage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/recipes/edit/new');
  }, [router]);
  
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <div>Redirection vers le formulaire de création...</div>
    </div>
  );
}
