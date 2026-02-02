import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = params;
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Récupérer la recette avec toutes ses colonnes
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!recipe) {
      return NextResponse.json({ error: 'Recette non trouvée' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      recipe: recipe,
      columns: Object.keys(recipe),
      hasInstructions: !!recipe.instructions,
      instructionsLength: recipe.instructions ? recipe.instructions.length : 0
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
