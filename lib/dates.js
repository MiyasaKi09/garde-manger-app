// ================================================================
// 1. lib/dates.js - UTILITAIRES DE DATES UNIFIÉS
// ================================================================

/**
 * Calcule le nombre de jours jusqu'à une date donnée
 * @param {string|Date} dateStr - Date cible
 * @returns {number|null} Nombre de jours (négatif si dépassé, null si invalid)
 */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  try {
    // Comparer uniquement les parties YYYY-MM-DD en UTC pour éviter les décalages DST
    const todayISO = new Date().toISOString().split('T')[0];
    const targetISO = String(dateStr).split('T')[0];
    const today = new Date(todayISO);   // UTC midnight
    const target = new Date(targetISO); // UTC midnight
    return Math.round((target - today) / 86400000);
  } catch {
    return null;
  }
}

/**
 * Formate une date en français
 * @param {string|Date} dateStr - Date à formater
 * @returns {string} Date formatée ou '—' si invalid
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  } catch {
    return dateStr;
  }
}

/**
 * Objet DateHelpers pour compatibilité avec le code existant
 * @deprecated Utilisez directement daysUntil() et formatDate()
 */
export const DateHelpers = {
  daysUntil,
  fmtDate: formatDate
};
