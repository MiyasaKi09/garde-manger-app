import { describe, expect, it } from 'vitest'
import {
  PROTEIN_COEFFICIENT_DEFAULTS,
  calculateFullProfile,
  calculateMacros,
  calculateProteinTarget,
  resolveProteinCoefficient,
} from '@/lib/nutritionCalculator'
import { normalizeGoalInput } from '@/lib/domain/settings/planningSettings'

/**
 * LA CIBLE PROTÉIQUE SE CALCULE SUR LE POIDS CIBLE — livrable 1.3.
 *
 * CE QUE CE FICHIER VERROUILLE. Le défaut nommé au §5 du plan :
 * `calculateMacros` multipliait le poids ACTUEL par 1,4 / 1,6 / 1,8, et
 * `calculateFullProfile` lui passait `w` — le poids actuel — alors que `tw`, le
 * poids cible, ne servait qu'à estimer une durée. Les 216 g mesurés au §2.3
 * étaient donc 1,8 g/kg d'un poids qu'on cherche à quitter.
 *
 * ─── LA MESURE QUI A FIXÉ LE DÉFAUT, ET QU'ON PEUT CONTESTER ───
 *
 * Le §8 du plan exige de « mesurer P4 à 1,4 / 1,6 / 1,7 avant de figer ». Voici
 * la table. Protocole IDENTIQUE à celui du §2.3 et de
 * `tests/planning/rapportQualiteSemaine.test.js` : trois semaines consécutives
 * (21 et 28 septembre, 5 octobre 2026), historique cumulé, sans stock, faisceau
 * 48, corpus du dépôt (568 publiables), foyer réel, cible par repas recalculée
 * depuis les objectifs exactement comme `app/api/planning/generate-v3/route.js`
 * le fait. Seule la cible protéique de Julien change d'une ligne à l'autre.
 * SANS le plancher de densité du livrable 1.4 — c'est la mesure du seul 1.3.
 *
 * | cible protéique | P4 (jours ≥ 85 %) | protein_gate_relaxed | protéines servies |
 * |---|---|---|---|
 * | 216 g — 1,8 × poids ACTUEL 120 kg (l'existant) | 3, 0, 1 /7 | 4, 7, 6 /7 | 164, 138, 138 g |
 * | 119 g — 1,4 × 85 kg | 7, 7, 5 /7 | 2, 0, 2 /7 | 136, 121, 123 g |
 * | 126 g — 1,4 × 90 kg | 5, 5, 5 /7 | 2, 2, 2 /7 | 145, 126, 125 g |
 * | 133 g — 1,4 × 95 kg | 5, 6, 5 /7 | 2, 3, 2 /7 | 147, 124, 131 g |
 * | 136 g — 1,6 × 85 kg | 5, 5, 5 /7 | 3, 4, 2 /7 | 147, 125, 132 g |
 * | 140 g — 1,4 × 100 kg | 4, 4, 4 /7 | 3, 3, 3 /7 | 148, 121, 126 g |
 * | 144 g — 1,6 × 90 kg | 4, 4, 4 /7 | 3, 3, 4 /7 | 150, 122, 127 g |
 * | 145 g — 1,7 × 85 kg | 4, 4, 4 /7 | 3, 3, 4 /7 | 150, 122, 127 g |
 * | 152 g — 1,6 × 95 kg | 3, 3, 4 /7 | 4, 4, 5 /7 | 149, 122, 127 g |
 * | 153 g — 1,7 × 90 kg | 3, 3, 4 /7 | 4, 4, 5 /7 | 149, 122, 127 g |
 * | 160 g — 1,6 × 100 kg | 2, 3, 4 /7 | 5, 4, 3 /7 | 158, 131, 143 g |
 * | 162 g — 1,7 × 95 kg | 2, 3, 4 /7 | 5, 4, 3 /7 | 158, 131, 143 g |
 * | 170 g — 1,7 × 100 kg | 2, 2, 4 /7 | 5, 5, 3 /7 | 160, 131, 143 g |
 *
 * CE QUE LA TABLE DIT.
 * — La cible depuis le poids cible fait passer P4 de 3, 0, 1 à 4-7 jours sur 7
 *   selon le coefficient : c'est le gain du seul livrable 1.3, et il est net.
 * — Les protéines SERVIES ne dépendent presque pas de la cible : 121 à 164 g
 *   quel que soit le chiffre visé. Le corpus et l'équilibre hebdomadaire du
 *   foyer (8 repas végétariens sur 14, deux repas au plus par famille de
 *   protéine, `weeklyBalance.js`) plafonnent l'apport bien avant la cible. P4
 *   ne se gagne donc PAS en baissant la cible : il se gagne en changeant ce
 *   qu'on sert, ce qui est exactement le livrable 1.4.
 * — À aucun coefficient P4 n'atteint 6/7 sur les trois semaines avec le seul
 *   1.3. Le §5 du plan l'écrit d'ailleurs : 1.3 et 1.4 sont deux livrables.
 *
 * LE DÉFAUT RETENU : 1,6 en perte, 1,4 en maintien — ceux que le §8 recommande.
 * Ils ne sont PAS choisis parce qu'ils maximisent P4 : 1,4 fait mieux que 1,6
 * sur toute la table, et 1,2 ferait mieux encore. Choisir le coefficient qui
 * maximise P4 reviendrait à gagner le critère en abaissant sa cible, ce que le
 * plan s'interdit. Le coefficient est un choix de santé du foyer ; la table dit
 * ce qu'il coûte, elle ne le décide pas. 1,8 reste écarté tant que le vivier
 * dense n'existe pas, comme le §8 le demande.
 */
describe('cible protéique — coefficient × poids cible', () => {
  it('calcule la cible sur le poids CIBLE, jamais sur le poids actuel', () => {
    // Le cas du plan : 120 kg aujourd'hui, 95 kg visés, perte engagée.
    const profil = {
      weight_kg: 120, height_cm: 180, age: 38, sex: 'M',
      activityLevel: 'moderate', weightLossRate: 0.75, targetWeight: 95,
    }
    const resultat = calculateFullProfile(profil)
    expect(resultat.target_protein_g).toBe(Math.round(PROTEIN_COEFFICIENT_DEFAULTS.loss * 95))
    expect(resultat.target_protein_g).toBe(152)
    // Et surtout : ce n'est PAS 1,6 × 120 = 192, ni 1,8 × 120 = 216.
    expect(resultat.target_protein_g).not.toBe(Math.round(1.6 * 120))
    expect(resultat.target_protein_g).not.toBe(216)
    expect(resultat.protein_rule).toMatchObject({
      basis: 'target_weight',
      coefficient_g_per_kg: PROTEIN_COEFFICIENT_DEFAULTS.loss,
      coefficient_source: 'default_loss',
      target_weight_kg: 95,
    })
  })

  it('garde les kcal sur le poids ACTUEL : c’est lui qui dépense', () => {
    const commun = {
      height_cm: 180, age: 38, sex: 'M', activityLevel: 'moderate', weightLossRate: 0.75,
    }
    const lourd = calculateFullProfile({ ...commun, weight_kg: 120, targetWeight: 95 })
    const leger = calculateFullProfile({ ...commun, weight_kg: 100, targetWeight: 95 })
    // Deux poids actuels différents, même poids cible : l'énergie change, la
    // cible protéique non.
    expect(lourd.target_calories).toBeGreaterThan(leger.target_calories)
    expect(lourd.target_protein_g).toBe(leger.target_protein_g)
  })

  it('applique le défaut de maintien quand aucune perte n’est demandée', () => {
    const maintien = calculateFullProfile({
      weight_kg: 80, height_cm: 170, age: 40, sex: 'F',
      activityLevel: 'light', weightLossRate: 0, targetWeight: 72,
    })
    expect(maintien.target_protein_g).toBe(Math.round(PROTEIN_COEFFICIENT_DEFAULTS.maintenance * 72))
    expect(maintien.protein_rule.coefficient_source).toBe('default_maintenance')
  })

  it('laisse chaque personne régler son coefficient', () => {
    const regle = calculateFullProfile({
      weight_kg: 120, height_cm: 180, age: 38, sex: 'M',
      activityLevel: 'moderate', weightLossRate: 0.75, targetWeight: 95,
      proteinCoefficient: 1.4,
    })
    expect(regle.target_protein_g).toBe(133)
    expect(regle.protein_rule.coefficient_source).toBe('member')
    // Hors bornes = pas un coefficient : le défaut reprend la main plutôt que
    // d'enregistrer une cible absurde.
    expect(resolveProteinCoefficient({ proteinCoefficient: 42, weightLossRate: 0.5 }).source).toBe('default_loss')
    expect(resolveProteinCoefficient({ proteinCoefficient: 'beaucoup', weightLossRate: 0 }).source).toBe('default_maintenance')
  })

  it('rend une cible ABSENTE quand le poids cible n’est pas déclaré', () => {
    // C'est le cœur du livrable : l'ancienne version retombait sur le poids
    // actuel (`parseFloat(targetWeight) || w`), et une cible calculée sur le
    // mauvais poids ne se distingue plus d'une cible juste.
    const sansCible = calculateProteinTarget({ weightLossRate: 0.5 })
    expect(sansCible.protein_g).toBeNull()
    expect(sansCible.rule.missing).toEqual(['target_weight_kg'])

    const profil = calculateFullProfile({
      weight_kg: 120, height_cm: 180, age: 38, sex: 'M', activityLevel: 'moderate', weightLossRate: 0.75,
    })
    expect(profil.target_protein_g).toBeNull()
    // Les glucides sont « le reste » : sans protéines, il n'y a pas de reste.
    expect(profil.target_carbs_g).toBeNull()
    // L'énergie, elle, reste calculable : elle ne dépend pas du poids cible.
    expect(profil.target_calories).toBeGreaterThan(0)
  })

  it('ferme le budget énergétique : 4 P + 9 L + 4 G = kcal', () => {
    const macros = calculateMacros({
      targetCalories: 2357, targetWeightKg: 95, weightLossRate: 0.75,
    })
    const somme = macros.protein_g * 4 + macros.fat_g * 9 + macros.carbs_g * 4
    // Les arrondis à l'unité laissent au plus 2 kcal d'écart.
    expect(Math.abs(somme - 2357)).toBeLessThanOrEqual(2)
  })
})

describe('enregistrement : la cible est recalculée et sa règle versionnée', () => {
  const membre = { id: 'membre-1', name: 'Nora' }
  const saisie = {
    target_calories: 2100,
    target_protein_g: 110,   // valeur périmée envoyée par l'écran
    target_carbs_g: 240,
    target_fat_g: 70,
    target_fiber_g: 30,
    age: 31, sex: 'F', height_cm: 172,
    current_weight_kg: 82, target_weight_kg: 66,
    activity_level: 'light', weight_loss_rate: 0.5,
    bmr: 1500, tdee: 2100,
  }

  it('recalcule la cible du questionnaire au lieu de reprendre le nombre affiché', () => {
    const goal = normalizeGoalInput(saisie, membre)
    // 1,6 × 66 = 105,6 → 106. Le 110 envoyé par l'écran est ignoré : c'est ce
    // qui rend vraie la phrase « recalculée à chaque changement de poids cible ».
    expect(goal.target_protein_g).toBe(106)
    expect(goal.protein_rule).toMatchObject({
      basis: 'target_weight',
      coefficient_g_per_kg: 1.6,
      coefficient_source: 'default_loss',
      target_weight_kg: 66,
    })
  })

  it('respecte un coefficient réglé par la personne', () => {
    const goal = normalizeGoalInput({ ...saisie, protein_coefficient_g_per_kg: 1.4 }, membre)
    expect(goal.target_protein_g).toBe(Math.round(1.4 * 66))
    expect(goal.protein_rule.coefficient_source).toBe('member')
  })

  it('respecte une cible saisie à la main, et le dit dans la règle', () => {
    const goal = normalizeGoalInput({ ...saisie, calculation_source: 'manual' }, membre)
    expect(goal.target_protein_g).toBe(110)
    expect(goal.protein_rule.basis).toBe('manual')
  })

  it('refuse d’enregistrer une cible du questionnaire sans poids cible', () => {
    const { target_weight_kg: _ignore, ...sansPoidsCible } = saisie
    expect(() => normalizeGoalInput(sansPoidsCible, membre)).toThrowError('target_weight_kg_required')
  })
})
