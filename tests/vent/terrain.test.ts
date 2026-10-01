import { describe, expect, it } from 'vitest';
import { coefficientDeRugosite, facteurDeTerrain, hauteurDeCalcul } from '../../src/vent/terrain';

describe('rugosite du terrain, §4.3.2', () => {
  it('k_r = 0,19 en categorie II, 0,2343 en IV, 0,1560 en 0', () => {
    expect(facteurDeTerrain('II')).toBeCloseTo(0.19, 10);
    expect(facteurDeTerrain('IV')).toBeCloseTo(0.234329, 5);
    expect(facteurDeTerrain('0')).toBeCloseTo(0.156036, 5);
  });

  it('c_r(8 m) en categorie II = 0,19 ln(160) = 0,96428', () => {
    expect(coefficientDeRugosite('II', 8)).toBeCloseTo(0.964283, 5);
  });

  it('sous z_min, la hauteur de calcul est z_min', () => {
    expect(hauteurDeCalcul('II', 1)).toBe(2);
    expect(hauteurDeCalcul('IV', 8)).toBe(10);
    expect(hauteurDeCalcul('II', 8)).toBe(8);
  });

  it('leve au-dela de z_max = 200 m', () => {
    expect(() => hauteurDeCalcul('II', 250)).toThrow('z_max');
  });

  it('leve pour une hauteur nulle', () => {
    expect(() => hauteurDeCalcul('II', 0)).toThrow('hauteur z');
  });
});
