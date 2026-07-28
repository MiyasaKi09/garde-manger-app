import { defineConfig } from "vitest/config";
import path from "node:path";

// Alias @ → racine (comme jsconfig.json).
// include/exclude : les tests unitaires vitest sont tests/*.test.js ;
// tests/e2e/ contient les specs Playwright (*.spec.js) qui ne doivent
// jamais être chargées par vitest (test.describe de @playwright/test explose).
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    include: ["tests/**/*.test.js"],
    exclude: ["tests/e2e/**", "node_modules/**"],
    // Le délai par défaut de vitest est de 5 s. Il a été calibré, sans qu'on le
    // dise, sur un corpus de cinquante recettes publiables. Il en compte
    // aujourd'hui 118 et vise 3 000, et la recherche par faisceau du
    // planificateur coûte environ 14 ms par recette candidate : le moindre test
    // qui génère une semaine dépasse la seconde en local, et trois à quatre fois
    // plus sur un runner partagé. Deux tests ont déjà expiré à quelques jours
    // d'intervalle, pour cette seule raison — ni l'un ni l'autre ne signalait
    // une régression.
    //
    // Les rallonger un par un au fil des échecs reviendrait à courir derrière le
    // corpus. On relève donc le plancher commun, en gardant une borne assez
    // basse pour qu'un vrai blocage reste détecté.
    //
    // Ce n'est pas la solution du problème de fond : passé quelques centaines de
    // recettes, le moteur devra présélectionner ses candidats au lieu de lancer
    // le faisceau sur le corpus entier. Ce délai achète le temps de le faire.
    testTimeout: 20000,
  },
});
