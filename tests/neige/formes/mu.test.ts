import { describe, expect, it } from 'vitest';
import { mu1 } from '../../../src/index';
import { palierMu1 } from '../../../src/neige/formes/mu';

describe('mu_1, tableau 5.2', () => {
  it('vaut 0,8 jusqu a 30 degres inclus', () => {
    expect(mu1(0, false)).toBe(0.8);
    expect(mu1(30, false)).toBe(0.8);
  });

  it('decroit lineairement entre 30 et 60 degres', () => {
    // 0,8 (60 - 45) / 30 = 0,4
    expect(mu1(45, false)).toBeCloseTo(0.4, 10);
    // 0,8 (60 - 35) / 30 = 0,666 667
    expect(mu1(35, false)).toBeCloseTo(0.666667, 5);
  });

  it('s annule a 60 degres et au-dela', () => {
    expect(mu1(60, false)).toBe(0);
    expect(mu1(75, false)).toBe(0);
  });

  it('n est pas reduit sous 0,8 avec un arret de neige (§5.3.3(4))', () => {
    expect(mu1(45, true)).toBe(0.8);
    expect(mu1(75, true)).toBe(0.8);
  });

  it('refuse une pente hors de [0 ; 90[', () => {
    expect(() => mu1(-5, false)).toThrow('alpha');
    expect(() => mu1(90, false)).toThrow('alpha');
  });

  it('nomme le palier', () => {
    expect(palierMu1(30)).toBe('0-30');
    expect(palierMu1(31)).toBe('30-60');
    expect(palierMu1(60)).toBe('60+');
  });
});
