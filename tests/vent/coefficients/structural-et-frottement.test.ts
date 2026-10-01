import { describe, expect, it } from 'vitest';
import { coefficientStructural, frottement } from '../../../src/vent/coefficients/structural-et-frottement';

describe('coefficient structural, §6.2', () => {
  it('h < 15 m : dispense, c_s c_d = 1', () => {
    const r = coefficientStructural({ mode: 'dispense', ossatureAvecMursDeContreventement: false }, 8, 12);
    expect(r.c_s_c_d).toBe(1);
    expect(r.motif).toContain('§6.2(1)a');
  });

  it('ossature avec murs, h < 100 m et h < 4d : dispense', () => {
    const r = coefficientStructural({ mode: 'dispense', ossatureAvecMursDeContreventement: true }, 50, 15);
    expect(r.c_s_c_d).toBe(1);
    expect(r.motif).toContain('§6.2(1)c');
  });

  it('aucun critere rempli : le module LEVE plutot que d extrapoler', () => {
    expect(() => coefficientStructural({ mode: 'dispense', ossatureAvecMursDeContreventement: false }, 20, 30)).toThrow(
      'Aucun critere de dispense'
    );
    // ossature mais h >= 4d
    expect(() => coefficientStructural({ mode: 'dispense', ossatureAvecMursDeContreventement: true }, 50, 12)).toThrow(
      'Aucun critere de dispense'
    );
  });

  it('valeur saisie : rendue et signalee', () => {
    const r = coefficientStructural({ mode: 'saisi', valeur: 1.08 }, 60, 10);
    expect(r.c_s_c_d).toBe(1.08);
    expect(r.motif).toContain('saisie');
  });
});

describe('frottement, §7.5', () => {
  it('surfaces paralleles <= 4 x perpendiculaires : non applicable avec motif', () => {
    // b = 30, d = 12, h = 8 : paralleles 552 m2, perpendiculaires 480 m2
    const r = frottement(30, 12, 8, 0.934713, 'lisse');
    expect(r.applicable).toBe(false);
    expect(r.motif).toContain('negligeable');
    expect(r.F_fr).toBeUndefined();
  });

  it('batiment profond : F_fr = c_fr q_p A_fr', () => {
    // b = 12, d = 30, h = 8 : paralleles 840 > 4 x 192 = 768
    // au-dela de min(24 ; 32) = 24 m : A_fr = 2 x 8 x 6 + 12 x 6 = 168 m2
    // F_fr = 0,01 x 0,934713 x 168 = 1,57032 kN
    const r = frottement(12, 30, 8, 0.934713, 'lisse');
    expect(r.applicable).toBe(true);
    expect(r.A_fr).toBeCloseTo(168, 10);
    expect(r.F_fr).toBeCloseTo(1.570318, 5);
  });

  it('rugosite tres rugueuse : c_fr = 0,04', () => {
    expect(frottement(12, 30, 8, 1, 'tres-rugueuse').c_fr).toBe(0.04);
  });
});
