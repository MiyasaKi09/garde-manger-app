import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const recipeId = 9401;

    // Durées pour chaque étape
    const durations = {
      1: 10,  // Préparation des œufs
      2: 7,   // Cuisson haricots verts
      3: 5,   // Laver et couper tomates
      4: 3,   // Égoutter thon
      5: 5,   // Préparer vinaigrette
      6: 5,   // Disposer feuilles de laitue
      7: 3    // Ajouter œufs, olives, anchois
    };

    // Mettre à jour chaque étape avec sa durée
    for (const [stepNo, duration] of Object.entries(durations)) {
      const { error } = await supabase
        .from('recipe_steps')
        .update({ duration: duration })
        .eq('recipe_id', recipeId)
        .eq('step_no', parseInt(stepNo));

      if (error) {
        console.error(`Erreur étape ${stepNo}:`, error);
      }
    }

    // Vérifier le résultat
    const { data: steps, error: fetchError } = await supabase
      .from('recipe_steps')
      .select('step_no, duration, description')
      .eq('recipe_id', recipeId)
      .order('step_no');

    if (fetchError) {
      throw fetchError;
    }

    const totalDuration = steps.reduce((sum, step) => sum + (parseInt(step.duration) || 0), 0);

    return NextResponse.json({
      success: true,
      message: 'Durées mises à jour avec succès!',
      steps: steps.map(s => ({ step_no: s.step_no, duration: s.duration })),
      totalDuration: totalDuration
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
