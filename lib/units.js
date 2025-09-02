// lib/units.js
export const UNIT_CLASS = { g:'mass', kg:'mass', ml:'vol', cl:'vol', l:'vol', u:'count' };
const TO_BASE = { g:1, kg:1000, ml:1, cl:10, l:1000, u:1 };

export const unitClass = u => UNIT_CLASS[(u||'').toLowerCase()] || null;
export const toBase   = (q,u)=> Number(q)*(TO_BASE[(u||'').toLowerCase()]||1);
export const fromBase = (q,u)=> Number(q)/(TO_BASE[(u||'').toLowerCase()]||1);

/** Conversion avec métadonnées produit (density g/ml, grams_per_unit g/u) */
export function convertWithMeta(qty, unitFrom, unitTo, meta = {}) {
  const density = Number(meta.density_g_per_ml ?? 1.0);
  const gPerUnit = Number(meta.grams_per_unit ?? 0);
  const fromC = unitClass(unitFrom), toC = unitClass(unitTo);
  if (!fromC || !toC) return { qty, unit: unitTo };

  if (fromC === toC) return { qty: fromBase(toBase(qty, unitFrom), unitTo), unit: unitTo };

  if (fromC==='count' && toC==='mass' && gPerUnit>0)   return { qty: fromBase(qty*gPerUnit, unitTo), unit: unitTo };
  if (fromC==='mass'  && toC==='count' && gPerUnit>0)  return { qty: fromBase(toBase(qty,unitFrom)/gPerUnit, unitTo), unit: unitTo };

  if (fromC==='vol'   && toC==='mass') return { qty: fromBase(toBase(qty,unitFrom)*density, unitTo), unit: unitTo };
  if (fromC==='mass'  && toC==='vol')  return { qty: fromBase(toBase(qty,unitFrom)/density, unitTo), unit: unitTo };

  if (fromC==='count' && toC==='vol' && gPerUnit>0)    return convertWithMeta(qty*gPerUnit, 'g', unitTo, { density_g_per_ml:density, grams_per_unit:gPerUnit });
  if (fromC==='vol'   && toC==='count' && gPerUnit>0)  return convertWithMeta(qty, unitFrom, 'g', { density_g_per_ml:density, grams_per_unit:gPerUnit }) && convertWithMeta(fromBase(toBase(qty,unitFrom)*density,'g').qty, 'g', 'u', { grams_per_unit:gPerUnit });

  return { qty, unit: unitFrom }; // pas de conversion fiable
}

export function sumAvailableInUnitWithMeta(lots, unitTarget, meta = {}) {
  let total = 0;
  for (const lot of lots||[]) total += convertWithMeta(Number(lot.qty||0), lot.unit, unitTarget, meta).qty;
  return total;
}
