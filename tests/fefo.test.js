import { describe, it, expect } from 'vitest';
import { sortLotsFEFO } from '@/lib/utils';

describe('sortLotsFEFO', () => {
  it('trie par date de péremption croissante (champ expiration_date)', () => {
    const lots = [
      { id: 'b', expiration_date: '2026-06-20' },
      { id: 'a', expiration_date: '2026-06-12' },
      { id: 'c', expiration_date: '2026-07-01' },
    ];
    expect(sortLotsFEFO(lots).map(l => l.id)).toEqual(['a', 'b', 'c']);
  });

  it('priorise adjusted_expiration_date sur expiration_date', () => {
    const lots = [
      { id: 'ouvert', expiration_date: '2026-07-01', adjusted_expiration_date: '2026-06-10' },
      { id: 'fermé', expiration_date: '2026-06-15' },
    ];
    expect(sortLotsFEFO(lots).map(l => l.id)).toEqual(['ouvert', 'fermé']);
  });

  it('place les lots sans date en dernier', () => {
    const lots = [
      { id: 'sans-date' },
      { id: 'daté', expiration_date: '2026-06-15' },
    ];
    expect(sortLotsFEFO(lots).map(l => l.id)).toEqual(['daté', 'sans-date']);
  });

  it('ne mute pas le tableau original', () => {
    const lots = [
      { id: 'b', expiration_date: '2026-06-20' },
      { id: 'a', expiration_date: '2026-06-12' },
    ];
    sortLotsFEFO(lots);
    expect(lots[0].id).toBe('b');
  });
});
