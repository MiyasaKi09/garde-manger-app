// ================================================================
// lib/textUtils.js - UTILS DE TEXTE (centralisé)
// ================================================================

/**
 * Normalise une chaîne pour la comparaison
 * - Enlève les accents
 * - Convertit en minuscules
 * - Enlève la ponctuation
 */
export const normalize = (str) => {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\0-\u036f]/g, '') // Enlève les accents
    .replace(/[^a-z0-9\s]/g, '') // Enlève la ponctuation sauf espaces
    .replace(/\s+/g, ' ') // Normalise les espaces multiples
    .trim();
};

/**
 * Calcule la similarité de Jaccard entre deux chaînes
 */
export const similarity = (a, b) => {
  if (!a || !b) return 0;
  const setA = new Set(normalize(a).split(' '));
  const setB = new Set(normalize(b).split(' '));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
};

/**
 * Calcule la distance de Levenshtein entre deux chaînes
 */
export const calculateLevenshteinDistance = (str1, str2) => {
  const m = str1.length;
  const n = str2.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
};

/**
 * Calcule la similarité de Levenshtein normalisée (score entre 0 et 1)
 */
export const calculateLevenshteinSimilarity = (str1, str2) => {
  const d = calculateLevenshteinDistance(str1, str2);
  const l = Math.max(str1.length, str2.length);
  return l === 0 ? 1 : 1 - d / l;
};