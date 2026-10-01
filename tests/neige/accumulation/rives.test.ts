import { describe, expect, it } from 'vitest';
import { chargeDeDebord, effortArretDeNeige } from '../../../src/neige/accumulation/rives';

describe('neige en debord, §6.3', () => {
  it('s = 0,56, gamma = 3 : d = 0,1867 m, k = min(16,07 ; 0,56) = 0,56, s_e = 0,0585 kN/m', () => {
    const c = chargeDeDebord('y-', 0.56, 3);
    expect(c.valeur).toBeCloseTo(0.058539, 5);
  });

  it('k borne par 3/d pour une forte charge : s = 6, gamma = 3 -> d = 2, k = 1,5, s_e = 18', () => {
    expect(chargeDeDebord('y-', 6, 3).valeur).toBeCloseTo(18, 10);
  });

  it('refuse une charge nulle', () => {
    expect(() => chargeDeDebord('y-', 0, 3)).toThrow('charge de neige');
  });
});

describe('arret de neige, §6.4', () => {
  it('F_s = s b sin(alpha) : 0,56 x 6 x sin 30 = 1,68 kN/m', () => {
    expect(effortArretDeNeige('y-', 0.56, 6, 30).valeur).toBeCloseTo(1.68, 10);
  });

  it('refuse une distance nulle', () => {
    expect(() => effortArretDeNeige('y-', 0.56, 0, 30)).toThrow('distance');
  });
});
