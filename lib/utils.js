// lib/utils.js
// FEFO = First Expired First Out : trie par DLC croissante, puis par date d'entrée
export function sortLotsFEFO(lots) {
  return [...lots].sort((a, b) => {
    const ad = a.dlc ? new Date(a.dlc).getTime() : Infinity;
    const bd = b.dlc ? new Date(b.dlc).getTime() : Infinity;
    if (ad !== bd) return ad - bd;
    return new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime();
  });
}

/** @deprecated use sortLotsFEFO */
export const sortLotsFIFO = sortLotsFEFO;

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
