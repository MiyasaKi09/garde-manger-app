import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const STEPS = [
  {
    step_no: 1,
    description: "Préparer les légumes : Laver la salade verte et bien l'égoutter. Couper les tomates en quartiers. Trancher finement les poivrons verts et les oignons rouges.",
    duration: 10,
    type: 'preparation'
  },
  {
    step_no: 2,
    description: "Cuire les œufs durs : Porter de l'eau à ébullition, y plonger les œufs et cuire 10 minutes. Rafraîchir sous l'eau froide puis écaler et couper en quartiers.",
    duration: 10,
    type: 'cooking'
  },
  {
    step_no: 3,
    description: "Préparer les pommes de terre : Cuire les pommes de terre à l'eau salée pendant 15-20 minutes jusqu'à ce qu'elles soient tendres. Laisser refroidir puis couper en rondelles.",
    duration: 20,
    type: 'cooking'
  },
  {
    step_no: 4,
    description: "Assembler la salade : Dans un grand saladier, disposer la salade verte comme base. Ajouter les tomates, les poivrons, les oignons rouges, les pommes de terre et les haricots verts cuits.",
    duration: 5,
    type: 'assembly'
  },
  {
    step_no: 5,
    description: "Ajouter le thon et les anchois : Émietter le thon au-dessus de la salade. Disposer les filets d'anchois. Ajouter les olives noires de Nice.",
    duration: 3,
    type: 'assembly'
  },
  {
    step_no: 6,
    description: "Disposer les œufs : Disposer harmonieusement les quartiers d'œufs durs sur le dessus de la salade.",
    duration: 2,
    type: 'assembly'
  },
  {
    step_no: 7,
    description: "Assaisonner : Arroser d'huile d'olive, de vinaigre de vin, saler et poivrer. Parsemer de basilic frais ciselé.",
    duration: 2,
    type: 'preparation'
  },
  {
    step_no: 8,
    description: "Servir : Servir immédiatement ou laisser reposer 10 minutes au frais pour que les saveurs se mélangent.",
    duration: 10,
    type: 'resting'
  }
];

export async function POST(request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const recipeId = 9401;

    // 1. Vérifier que la recette existe
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, name')
      .eq('id', recipeId)
      .single();

    if (recipeError || !recipe) {
      return NextResponse.json({
        success: false,
        error: 'Recette Salade niçoise (ID: 9401) introuvable'
      }, { status: 404 });
    }

    // 2. Vérifier s'il y a déjà des étapes
    const { data: existingSteps, error: checkError } = await supabase
      .from('recipe_steps')
      .select('id')
      .eq('recipe_id', recipeId);

    if (checkError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la vérification: ' + checkError.message
      }, { status: 500 });
    }

    const hadSteps = existingSteps && existingSteps.length > 0;

    // 3. Supprimer les anciennes étapes si elles existent
    if (hadSteps) {
      const { error: deleteError } = await supabase
        .from('recipe_steps')
        .delete()
        .eq('recipe_id', recipeId);

      if (deleteError) {
        return NextResponse.json({
          success: false,
          error: 'Erreur lors de la suppression: ' + deleteError.message
        }, { status: 500 });
      }
    }

    // 4. Insérer les nouvelles étapes
    const stepsToInsert = STEPS.map(step => ({
      recipe_id: recipeId,
      ...step,
      created_at: new Date().toISOString()
    }));

    const { data: insertedSteps, error: insertError } = await supabase
      .from('recipe_steps')
      .insert(stepsToInsert)
      .select();

    if (insertError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de l\'insertion: ' + insertError.message
      }, { status: 500 });
    }

    // 5. Calculer le temps total
    const totalDuration = STEPS.reduce((sum, step) => sum + step.duration, 0);

    return NextResponse.json({
      success: true,
      message: 'Étapes ajoutées avec succès!',
      recipe: {
        id: recipe.id,
        name: recipe.name
      },
      steps: {
        hadSteps: hadSteps,
        previousCount: hadSteps ? existingSteps.length : 0,
        newCount: insertedSteps.length,
        totalDuration: totalDuration
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request) {
  return NextResponse.json({
    info: 'Utilisez POST pour ajouter les étapes de la Salade niçoise',
    endpoint: '/api/admin/add-salade-nicoise-steps',
    method: 'POST',
    stepsCount: STEPS.length,
    totalDuration: STEPS.reduce((sum, step) => sum + step.duration, 0) + ' minutes'
  });
}
