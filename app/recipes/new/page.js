'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewRecipePage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/recipes/edit/new');
  }, [router]);
  
  return (
    <div className="v21-page narrow" aria-busy="true">
      <div className="v21-skel" style={{ height: 44, width: '50%' }} />
      <div className="v21-skel" style={{ height: 40, marginTop: 24 }} />
      <div className="v21-skel" style={{ height: 300, marginTop: 28 }} />
    </div>
  );
}
