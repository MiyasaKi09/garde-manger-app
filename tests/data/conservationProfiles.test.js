import { describe, expect, it } from 'vitest'
import corpus from '@/data/recipes/corpus-v3.json'
import { getCanonicalRecipes } from '@/lib/domain/recipes/canonicalCatalog'
import { isRecipeFreezable, refrigeratorShelfLifeDays } from '@/lib/domain/planning/cookingSessions'
import { batchRejectionReason, isBatchCandidate, recipePlanningProfile } from '@/lib/domain/planning/recipePlanningProfile'
import {
  applyConservationProfiles,
  checkConservationProfiles,
  deriveConservationProfile,
  loadManualDecisions,
  parseConservation,
} from '../../scripts/data/recipes/derive-conservation-profiles.mjs'

/**
 * Chantier C1, point 2 (docs/PLAN_PLANNING_PARFAIT.md §4) : la conservation
 * de chaque recette est un profil STRUCTURÉ et DÉCLARÉ, et le moteur ne lit
 * plus que lui. Ces tests rejouent la mesure d'origine sur TOUT le corpus :
 * 90 « congelables » qui refusaient la congélation dans leur prose, un pan
 * bagnat de 24 heures produit pour trois jours, des carottes râpées jugées
 * congelables.
 */

const publiables = getCanonicalRecipes()
const parCode = new Map(publiables.map((recipe) => [recipe.code, recipe]))
const manuel = loadManualDecisions()

describe('profils de conservation — sur tout le corpus', () => {
  it('chaque recette publiable porte un profil de conservation', () => {
    const sansProfil = publiables.filter((recipe) => !recipe.conservationProfile).map((recipe) => recipe.code)
    expect(sansProfil).toEqual([])
  })

  it('le corpus porte exactement la dérivation courante (parsé + arbitrages manuels) — sinon relancer --write', () => {
    const derives = applyConservationProfiles(corpus.recipes, manuel)
    const perimes = corpus.recipes
      .filter((recipe, index) => JSON.stringify(recipe.conservation_profile ?? null) !== JSON.stringify(derives[index].conservation_profile))
      .map((recipe) => recipe.code)
    expect(perimes).toEqual([])
    expect(checkConservationProfiles(corpus.recipes, { manualByCode: manuel, publishableCodes: new Set(parCode.keys()) })).toEqual([])
  })

  it('aucun profil freezable=true dont la prose refuse la congélation', () => {
    const contredits = corpus.recipes
      .filter((recipe) => recipe.conservation_profile?.freezable === true)
      .filter((recipe) => parseConservation(recipe.conservation).evidence.freezeRefusal)
      .map((recipe) => `${recipe.code} : ${recipe.conservation}`)
    expect(contredits).toEqual([])
  })

  it('un plat congelable pour le moteur l’est parce que son profil le déclare, jamais parce que sa prose contient « congel »', () => {
    for (const recipe of publiables) {
      const declared = typeof recipe.freezable === 'boolean' ? recipe.freezable : recipe.conservationProfile.freezable === true
      expect(isRecipeFreezable(recipe), recipe.code).toBe(declared)
    }
  })

  it('serve_cold n’est jamais parsé : sans décision manuelle, il est nul', () => {
    for (const recipe of corpus.recipes) {
      if (manuel.has(recipe.code)) continue
      expect(recipe.conservation_profile?.serve_cold ?? null, recipe.code).toBeNull()
    }
  })
})

describe('profils de conservation — les cas que la mesure a nommés', () => {
  it('SRC-017-D4, pan bagnat : 24 h, non congelable, servi froid, jamais candidat au batch', () => {
    const panBagnat = parCode.get('SRC-017-D4')
    expect(panBagnat, 'SRC-017-D4 doit être publiable').toBeTruthy()
    expect(panBagnat.conservationProfile).toMatchObject({ fridgeHours: 24, freezable: false, serveCold: true, source: 'manual' })
    expect(isRecipeFreezable(panBagnat)).toBe(false)
    expect(recipePlanningProfile(panBagnat).servedCold).toBe(true)
    expect(isBatchCandidate(panBagnat)).toBe(false)
    expect(batchRejectionReason(panBagnat)).toBe('servi_froid')
    // Sa fenêtre déclarée est d'UN jour — plus jamais les trois jours constants.
    expect(refrigeratorShelfLifeDays(panBagnat)).toBe(1)
  })

  it('SRC-035, carottes râpées : non congelable', () => {
    const carottes = parCode.get('SRC-035')
    expect(carottes, 'SRC-035 doit être publiable').toBeTruthy()
    expect(isRecipeFreezable(carottes)).toBe(false)
    expect(carottes.conservationProfile.freezable).toBe(false)
  })

  it('une recette sans profil n’a ni fenêtre de production, ni documentation, et le motif le dit', () => {
    const sansProfil = { ...parCode.get('SRC-017-D4'), conservationProfile: null }
    expect(refrigeratorShelfLifeDays(sansProfil)).toBeNull()
    expect(recipePlanningProfile(sansProfil).documented).toBe(false)
    expect(batchRejectionReason(sansProfil)).toBe('conservation_non_declaree')
  })
})

describe('parseConservation — ce que la prose déclare, et rien de plus', () => {
  const lire = (prose) => parseConservation(prose).profile

  it('lit les durées en chiffres et en lettres, en heures et en jours, avant ou après le lieu', () => {
    expect(lire('3 jours au réfrigérateur.').fridge_hours).toBe(72)
    expect(lire('Trois jours au réfrigérateur.').fridge_hours).toBe(72)
    expect(lire('Se garde vingt-quatre heures au frais.').fridge_hours).toBe(24)
    expect(lire('Conserver au réfrigérateur pendant quarante-huit heures.').fridge_hours).toBe(48)
    expect(lire('Se garde 48 h au froid.').fridge_hours).toBe(48)
    expect(lire('Une semaine au frigo.').fridge_hours).toBe(168)
  })

  it('retient la borne basse d’une fourchette et la plus courte des gardes, jamais une durée de procédé', () => {
    expect(lire('Deux à trois jours au réfrigérateur.').fridge_hours).toBe(48)
    expect(lire('La sauce se garde quatre jours au réfrigérateur ; les pâtes enrobées ne se conservent pas plus de vingt-quatre heures.').fridge_hours).toBe(24)
    // « réchauffer 20 minutes », « sortir une heure avant de servir », « reposer
    // 12 h » ne sont pas des durées de garde.
    expect(lire('Se garde 3 jours au réfrigérateur ; sortir une heure avant de servir.').fridge_hours).toBe(72)
    expect(lire('Repos de 12 heures au réfrigérateur avant de servir. Se garde ensuite 4 jours au réfrigérateur.').fridge_hours).toBe(96)
    // Une durée d'une forme crue décrit un état avant cuisson, pas le plat.
    expect(lire('La pâte crue se garde 48 heures au réfrigérateur. Cuit, le plat se garde 3 jours au réfrigérateur.').fridge_hours).toBe(72)
  })

  it('une durée à température ambiante ou au congélateur n’est pas une durée réfrigérateur', () => {
    expect(lire('Deux jours à température ambiante, jamais au réfrigérateur.').fridge_hours).toBeNull()
    expect(lire('15 jours au congélateur.').fridge_hours).toBeNull()
    // Sans lieu du tout, le chiffre est gardé tel quel — sans décider du lieu.
    expect(lire('5 jours ; meilleur réchauffé.').fridge_hours).toBe(120)
  })

  it('reconnaît la consommation immédiate, sans confondre « meilleur immédiatement » avec une interdiction', () => {
    for (const prose of [
      'À consommer immédiatement.', 'Se mange aussitôt.', 'Se déguste dans l’heure.', 'Ne se garde pas.',
      'À manger dans la foulée.', 'Se mange dans la minute.', 'Se mange dans les minutes qui suivent la sortie du four.',
      'Rien ne se garde une fois monté.',
    ]) {
      expect(lire(prose).eat_immediately, prose).toBe(true)
    }
    expect(lire('2 jours au réfrigérateur, mais meilleur immédiatement.').eat_immediately).toBe(false)
    expect(lire('Refroidir dans l’heure qui suit la cuisson, puis garder 3 jours au réfrigérateur.').eat_immediately).toBe(false)
    expect(lire('La pâte crue ne se garde pas au-delà de deux heures.').eat_immediately).toBe(false)
  })

  it('refuse la congélation pour chacune des tournures de refus, quelle que soit l’autorisation voisine', () => {
    for (const refus of [
      'Ne pas congeler.', 'Pas de congélation.', 'Congélation déconseillée.', 'Sans congélation.', 'Congélation exclue.',
      'Congélation à éviter.', 'Congélation impossible.', 'Congélation proscrite.', 'Ne se congèle pas.',
      'Supporte mal la congélation.', 'Se congèle mal.', 'Jamais au congélateur.', 'Congélation à proscrire.',
      'La congélation est à exclure.', 'Ne congelez pas le plat monté.', 'Rien dans ce plat ne supporte la congélation.',
    ]) {
      expect(lire(`3 jours au réfrigérateur. ${refus}`).freezable, refus).toBe(false)
      expect(lire(`3 jours au réfrigérateur. ${refus}`).freezer_months, refus).toBeNull()
    }
    // Un refus l'emporte sur une autorisation de la même prose.
    expect(lire('La sauce seule se congèle 3 mois, mais le plat monté supporte mal la congélation.').freezable).toBe(false)
  })

  it('autorise seulement en toutes lettres, et lit les mois ; une simple mention donne null', () => {
    expect(lire('3 jours au réfrigérateur ; congélation 3 mois.')).toMatchObject({ freezable: true, freezer_months: 3 })
    expect(lire('Se congèle deux mois.')).toMatchObject({ freezable: true, freezer_months: 2 })
    expect(lire('La congélation est possible.')).toMatchObject({ freezable: true, freezer_months: null })
    expect(lire('2 jours ; congélation avant friture.').freezable).toBeNull()
    expect(lire('Pour la congélation, congeler la base sans crème.').freezable).toBeNull()
    // Autorisation restreinte à un composant ou à une forme crue : mention.
    expect(lire('La sauce seule se congèle 3 mois.').freezable).toBeNull()
    expect(lire('Le poulet mariné cru se congèle 2 mois.').freezable).toBeNull()
    // « décongélation » n'est pas « congélation ».
    expect(lire('Se réchauffe sans décongélation.').freezable).toBeNull()
    expect(lire('3 jours au réfrigérateur.').freezable).toBeNull()
  })

  it('ne devine jamais le service froid', () => {
    expect(lire('Salade à servir froide, 2 jours au réfrigérateur.').serve_cold).toBeNull()
  })
})

describe('deriveConservationProfile — les décisions manuelles priment champ par champ', () => {
  it('un champ manuel remplace le parsé, null compris, et la source le dit', () => {
    const recette = { code: 'X-1', conservation: '3 jours au réfrigérateur ; congélation 3 mois.' }
    const manual = new Map([['X-1', {
      code: 'X-1',
      prose: recette.conservation,
      profile: { fridge_hours: 24, eat_immediately: true, freezable: null, freezer_months: null, serve_cold: true },
    }]])
    expect(deriveConservationProfile(recette, manual).profile).toEqual({
      fridge_hours: 24, eat_immediately: true, freezable: null, freezer_months: null, serve_cold: true, source: 'manual',
    })
    expect(deriveConservationProfile(recette, new Map()).profile).toEqual({
      fridge_hours: 72, eat_immediately: false, freezable: true, freezer_months: 3, serve_cold: null, source: 'parsed',
    })
    const partielle = new Map([['X-1', { code: 'X-1', prose: recette.conservation, profile: { serve_cold: true } }]])
    expect(deriveConservationProfile(recette, partielle).profile).toMatchObject({ fridge_hours: 72, serve_cold: true, source: 'parsed+manual' })
  })

  it('refuse une décision manuelle prise sur une autre prose que celle du corpus', () => {
    const recette = { code: 'X-2', conservation: 'Nouvelle prose : 2 jours au réfrigérateur.' }
    const manual = new Map([['X-2', { code: 'X-2', prose: 'Ancienne prose.', profile: { fridge_hours: 48 } }]])
    expect(() => deriveConservationProfile(recette, manual)).toThrow(/prose différente/)
  })

  it('une prose muette donne une recette sans profil, pas un profil vide', () => {
    expect(deriveConservationProfile({ code: 'X-3', conservation: 'Rien à signaler.' }, new Map()).profile).toBeNull()
  })
})
