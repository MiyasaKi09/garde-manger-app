import { NextResponse } from 'next/server';

// La table cook_logs n'existe pas encore dans le schema.
// Cette route est un placeholder - l'annulation de cuisson sera implementee
// une fois la table cook_logs creee via migration.
export async function POST() {
  return NextResponse.json(
    { error: 'Fonctionnalite non disponible - table cook_logs manquante' },
    { status: 501 }
  );
}
