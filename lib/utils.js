// lib/utils.js
// FEFO = First Expired First Out : trie par date d'expiration croissante, puis par date d'entrée.
// Priorité des champs : adjusted_expiration_date > expiration_date > best_before > dlc.
// Lots sans date d'expiration sont placés en dernier.
function lotExpirationTime(lot) {
  const raw = lot.adjusted_expiration_date ?? lot.expiration_date ?? lot.best_before ?? lot.dlc ?? null;
  return raw ? new Date(raw).getTime() : Infinity;
}

export function sortLotsFEFO(lots) {
  return [...lots].sort((a, b) => {
    const ad = lotExpirationTime(a);
    const bd = lotExpirationTime(b);
    if (ad !== bd) return ad - bd;
    return new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime();
  });
}

/** @deprecated use sortLotsFEFO */
export const sortLotsFIFO = sortLotsFEFO;

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
