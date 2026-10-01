import { describe, expect, it } from 'vitest';
import { ec1Recommande } from '../../../src/index';
import { cpiEnveloppe, cpiFaceDominante } from '../../../src/vent/coefficients/interieur';

describe('pression interieure, §7.2.9', () => {
  it('enveloppe : DEUX cas, +0,2 et -0,3, jamais un seul', () => {
    expect(cpiEnveloppe(ec1Recommande())).toEqual([
      { c_pi: 0.2, origine: 'enveloppe-positive' },
      { c_pi: -0.3, origine: 'enveloppe-negative' },
    ]);
  });

  it('face dominante : 0,75 c_pe au rapport 2, 0,90 c_pe a 3 et au-dela', () => {
    expect(cpiFaceDominante(2, 0.8).c_pi).toBeCloseTo(0.6, 10);
    expect(cpiFaceDominante(3, 0.8).c_pi).toBeCloseTo(0.72, 10);
    expect(cpiFaceDominante(5, 0.8).c_pi).toBeCloseTo(0.72, 10);
  });

  it('face dominante : interpolation au rapport 2,5 -> 0,825 c_pe', () => {
    expect(cpiFaceDominante(2.5, -0.5).c_pi).toBeCloseTo(-0.4125, 10);
  });

  it('rapport inferieur a 2 : la face n est pas dominante, le module leve', () => {
    expect(() => cpiFaceDominante(1.5, 0.8)).toThrow('au moins 2');
  });
});
