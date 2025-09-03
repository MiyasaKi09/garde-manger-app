// lib/scale.js
export function scaleQty(qty, fromServings, toServings) {
  if (qty == null) return qty;
  if (!fromServings || !toServings) return qty;
  return (Number(qty) * Number(toServings)) / Number(fromServings);
}

export function mealsFromBatch(servingsPerBatch, people) {
  if (!servingsPerBatch || !people) return null;
  // nb de repas complets possibles avec un "batch" (sans le diviser)
  // ex: quiche 6 portions, vous êtes 2 => 3 repas
  return Math.floor(Number(servingsPerBatch) / Number(people));
}
