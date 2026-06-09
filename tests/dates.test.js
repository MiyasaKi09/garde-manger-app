import { describe, it, expect } from 'vitest';
import { daysUntil, formatDate } from '@/lib/dates';

function isoInDays(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().split('T')[0];
}

describe('daysUntil (comparaison en UTC)', () => {
  it("retourne 0 pour aujourd'hui", () => {
    expect(daysUntil(isoInDays(0))).toBe(0);
  });

  it('retourne 3 pour J+3 (seuil DLC)', () => {
    expect(daysUntil(isoInDays(3))).toBe(3);
  });

  it('retourne 7 pour J+7 (seuil DDM)', () => {
    expect(daysUntil(isoInDays(7))).toBe(7);
  });

  it('retourne un nombre négatif pour une date dépassée', () => {
    expect(daysUntil(isoInDays(-2))).toBe(-2);
  });

  it('ignore la partie heure des timestamps', () => {
    expect(daysUntil(`${isoInDays(1)}T23:59:59.000Z`)).toBe(1);
  });

  it('retourne null pour une entrée vide', () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil('')).toBeNull();
  });
});

describe('formatDate', () => {
  it("retourne '—' pour une entrée vide", () => {
    expect(formatDate(null)).toBe('—');
  });
});
