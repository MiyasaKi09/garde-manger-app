// lib/utils.js
export function sortLotsFIFO(lots) {
  // Tri: DLC ascendante (les plus proches d'abord), puis par date d'entrée
  return [...lots].sort((a, b) => {
    const ad = a.dlc ? new Date(a.dlc).getTime() : Infinity;
    const bd = b.dlc ? new Date(b.dlc).getTime() : Infinity;
    if (ad !== bd) return ad - bd;
    return new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime();
  });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
