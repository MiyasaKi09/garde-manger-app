import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const INSTRUCTIONS = `1. Préparer les légumes : Laver la salade verte et bien l'égoutter. Couper les tomates en quartiers. Trancher finement les poivrons verts et les oignons rouges.

2. Cuire les œufs durs : Porter de l'eau à ébullition, y plonger les œufs et cuire 10 minutes. Rafraîchir sous l'eau froide puis écaler et couper en quartiers.

3. Préparer les pommes de terre : Cuire les pommes de terre à l'eau salée pendant 15-20 minutes jusqu'à ce qu'elles soient tendres. Laisser refroidir puis couper en rondelles.

4. Assembler la salade : Dans un grand saladier, disposer la salade verte comme base. Ajouter les tomates, les poivrons, les oignons rouges, les pommes de terre et les haricots verts cuits.

5. Ajouter le thon et les anchois : Émietter le thon au-dessus de la salade. Disposer les filets d'anchois. Ajouter les olives noires de Nice.

6. Disposer les œufs : Disposer harmonieusement les quartiers d'œufs durs sur le dessus de la salade.

7. Assaisonner : Arroser d'huile d'olive, de vinaigre de vin, saler et poivrer. Parsemer de basilic frais ciselé.

8. Servir : Servir immédiatement ou laisser reposer 10 minutes au frais pour que les saveurs se mélangent.`;

export async function POST(request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const recipeId = 9401;

    // 1. Vérifier l'état actuel
    const { data: currentRecipe, error: checkError } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (checkError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la vérification: ' + checkError.message
      }, { status: 500 });
    }

    if (!currentRecipe) {
      return NextResponse.json({
        success: false,
        error: 'Recette Salade niçoise (ID: 9401) introuvable'
      }, { status: 404 });
    }

    const hadInstructions = !!currentRecipe.instructions;
    const oldInstructionsLength = currentRecipe.instructions ? currentRecipe.instructions.length : 0;

    // 2. Mettre à jour les instructions
    const { data: updatedRecipe, error: updateError } = await supabase
      .from('recipes')
      .update({
        instructions: INSTRUCTIONS,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipeId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la mise à jour: ' + updateError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Instructions mises à jour avec succès!',
      recipe: {
        id: updatedRecipe.id,
        name: updatedRecipe.name,
        hadInstructions: hadInstructions,
        oldInstructionsLength: oldInstructionsLength,
        newInstructionsLength: updatedRecipe.instructions.length,
        instructionsPreview: updatedRecipe.instructions.substring(0, 150) + '...'
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
    info: 'Utilisez POST pour mettre à jour les instructions de la Salade niçoise',
    endpoint: '/api/admin/fix-salade-nicoise',
    method: 'POST'
  });
}
