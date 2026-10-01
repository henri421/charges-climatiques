import { describe, expect, it } from 'vitest';
import { pressionDePointe, vitesseDeReference, type ParametresPression } from '../../src/index';
import { intensiteDeTurbulence, vitesseMoyenne } from '../../src/vent/pression-de-pointe';

/** v_b = 26 m/s FICTIVE, rho = 1,25, k_I = 1, c_o = 1. */
function parametres(modifs: Partial<ParametresPression> = {}): ParametresPression {
  return { categorie: 'II', v_b: 26, c_o: 1, rho: 1.25, k_I: 1, ...modifs };
}

describe('vitesse et pression de pointe, §4', () => {
  it('v_b = c_dir c_season v_b,0', () => {
    expect(vitesseDeReference(26, 1, 1)).toBe(26);
    expect(vitesseDeReference(26, 0.9, 1)).toBeCloseTo(23.4, 10);
    expect(() => vitesseDeReference(0, 1, 1)).toThrow('v_b,0');
  });

  it('categorie II, z = 8 m : v_m = 25,071 m/s, I_v = 0,19704, q_p = 0,93471 kN/m2', () => {
    // c_r = 0,19 ln(8 / 0,05) = 0,96428 ; v_m = 0,96428 x 26
    // I_v = 1 / ln(160) ; q_p = (1 + 7 I_v) x 0,5 x 1,25 x v_m^2 / 1000
    expect(vitesseMoyenne(parametres(), 8)).toBeCloseTo(25.07136, 4);
    expect(intensiteDeTurbulence(parametres(), 8)).toBeCloseTo(0.197038, 5);
    expect(pressionDePointe(parametres(), 8)).toBeCloseTo(0.934713, 5);
  });

  it('categorie II sous z_min : q_p(1 m) = q_p(2 m) = 0,60140 kN/m2', () => {
    expect(pressionDePointe(parametres(), 1)).toBeCloseTo(0.601396, 5);
    expect(pressionDePointe(parametres(), 2)).toBeCloseTo(0.601396, 5);
  });

  it('categorie IV, z = 8 m sous z_min = 10 m : q_p = 0,49693 kN/m2', () => {
    expect(pressionDePointe(parametres({ categorie: 'IV' }), 8)).toBeCloseTo(0.496933, 5);
  });

  it('categorie 0, z = 8 m : q_p = 1,20817 kN/m2', () => {
    expect(pressionDePointe(parametres({ categorie: '0' }), 8)).toBeCloseTo(1.208169, 5);
  });

  it('categorie III, v_b = 24, z = 20 m : q_p = 0,78555 kN/m2', () => {
    expect(pressionDePointe(parametres({ categorie: 'III', v_b: 24 }), 20)).toBeCloseTo(0.785554, 5);
  });
});
