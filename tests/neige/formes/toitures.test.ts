import { describe, expect, it } from 'vitest';
import { largeursDesVersants } from '../../../src/index';
import { casSansAccumulation } from '../../../src/neige/formes/toitures';

/** C_e C_t s_k = 1 x 1 x 0,7 kN/m2 (s_k fictive). */
const FACTEUR = 0.7;

describe('cas sans accumulation', () => {
  it('toiture plate : un cas, mu_1 = 0,8, s = 0,56 kN/m2', () => {
    const cas = casSansAccumulation({ type: 'plate', acrotere: 0 }, 12, FACTEUR, false);
    expect(cas).toHaveLength(1);
    expect(cas[0].troncons).toHaveLength(1);
    expect(cas[0].troncons[0].s0).toBeCloseTo(0.56, 10);
    expect(cas[0].troncons[0].x1).toBe(12);
  });

  it('un versant a 45 degres : mu_1 = 0,4, s = 0,28 kN/m2', () => {
    const cas = casSansAccumulation({ type: 'un-versant', pente: 45 }, 12, FACTEUR, false);
    expect(cas).toHaveLength(1);
    expect(cas[0].troncons[0].s0).toBeCloseTo(0.28, 10);
  });

  it('deux versants : TROIS cas de charge rendus ensemble', () => {
    // alpha_1 = 20 : mu = 0,8 ; alpha_2 = 35 : mu = 0,666 667
    const cas = casSansAccumulation({ type: 'deux-versants', pente1: 20, pente2: 35 }, 12, FACTEUR, false);
    expect(cas.map((c) => c.nom)).toEqual(['Cas (i)', 'Cas (ii)', 'Cas (iii)']);
    const [i, ii, iii] = cas;
    expect(i.troncons[0].mu0).toBeCloseTo(0.8, 10);
    expect(i.troncons[1].mu0).toBeCloseTo(0.666667, 5);
    expect(ii.troncons[0].mu0).toBeCloseTo(0.4, 10);
    expect(ii.troncons[1].mu0).toBeCloseTo(0.666667, 5);
    expect(iii.troncons[0].mu0).toBeCloseTo(0.8, 10);
    expect(iii.troncons[1].mu0).toBeCloseTo(0.333333, 5);
    // faitage : w_1 = 12 tan35 / (tan20 + tan35) = 7,895 8 m
    expect(i.troncons[0].x1).toBeCloseTo(7.8958, 3);
  });

  it('deux versants egaux : faitage au milieu', () => {
    const [w1, w2] = largeursDesVersants(12, 25, 25);
    expect(w1).toBeCloseTo(6, 10);
    expect(w2).toBeCloseTo(6, 10);
  });

  it('refuse une pente nulle pour une toiture a deux versants', () => {
    expect(() => casSansAccumulation({ type: 'deux-versants', pente1: 0, pente2: 20 }, 12, FACTEUR, false)).toThrow(
      'pente1'
    );
  });
});
