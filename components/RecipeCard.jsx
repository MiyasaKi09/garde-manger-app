// components/RecipeCard.jsx
"use client";
import { useMemo } from "react";
import { mealsFromBatch } from "@/lib/scale";

export default function RecipeCard({ recipe, people = 2, onOpen }) {
  const {
    title,
    image_url,
    category,
    servings,          // portions "de base" de la recette
    is_divisible = true,
    prep_min,
    cook_min,
  } = recipe;

  const batchMeals = useMemo(() => {
    if (is_divisible) return null;
    return mealsFromBatch(servings, people);
  }, [is_divisible, servings, people]);

  return (
    <div className="group relative rounded-2xl border bg-white shadow-sm hover:shadow-md transition p-4 flex flex-col">
      {/* Image */}
      <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-100 mb-3">
        {image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image_url} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-gray-400 text-sm">Aucune image</div>
        )}
      </div>

      {/* TITRE visible (demande) */}
      <h3 className="text-base font-semibold leading-tight line-clamp-2">{title}</h3>

      {/* Meta */}
      <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
        {category && <span className="px-2 py-0.5 rounded-full bg-gray-100">{category}</span>}
        <span>Prépa {prep_min ?? 0}′</span>
        <span>Cuisson {cook_min ?? 0}′</span>
      </div>

      {/* Servings / Batch info */}
      <div className="mt-3 text-sm">
        {is_divisible ? (
          <div className="text-gray-600">
            <span className="font-medium">{servings}</span> portions (base) • ajustées pour <span className="font-medium">{people}</span> pers.
          </div>
        ) : (
          <div className="text-gray-700">
            <div className="font-medium">Recette non divisible (batch entier)</div>
            <div className="text-gray-600">
              Rend <span className="font-medium">{servings}</span> portions.
              {people > 0 && (
                <>
                  {" "}Avec <span className="font-medium">{people}</span> pers :{" "}
                  {batchMeals && batchMeals > 0 ? (
                    <span className="font-medium">{batchMeals}</span>
                  ) : (
                    <span className="font-medium">0</span>
                  )} repas par batch.
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto pt-3">
        <button
          onClick={() => onOpen?.(recipe)}
          className="w-full rounded-xl border px-3 py-2 hover:bg-gray-50"
        >
          Ouvrir
        </button>
      </div>
    </div>
  );
}
