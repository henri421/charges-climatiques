import { describe, expect, it } from 'vitest';
import { cpeInterpole, cpeParoi, cpeToiturePlate } from '../../../src/index';
import { facteurDeCorrelation } from '../../../src/vent/coefficients/exterieur';

describe('interpolation c_pe selon l aire chargee, figure 7.2', () => {
  const A = { c_pe_10: -1.2, c_pe_1: -1.4 };

  it('c_pe,1 a 1 m2 et en dessous', () => {
    expect(cpeInterpole(A, 1)).toBe(-1.4);
    expect(cpeInterpole(A, 0.5)).toBe(-1.4);
  });

  it('c_pe,10 a 10 m2 et au-dessus', () => {
    expect(cpeInterpole(A, 10)).toBe(-1.2);
    expect(cpeInterpole(A, 50)).toBe(-1.2);
  });

  it('logarithmique entre les deux : A = 5 m2 -> -1,4 + 0,2 log10(5) = -1,26021', () => {
    expect(cpeInterpole(A, 5)).toBeCloseTo(-1.260206, 5);
  });

  it('refuse une aire nulle', () => {
    expect(() => cpeInterpole(A, 0)).toThrow('aire chargee');
  });
});

describe('parois verticales, tableau 7.1', () => {
  it('valeurs de tableau aux lignes h/d = 5, 1 et 0,25', () => {
    expect(cpeParoi('E', 5)).toEqual({ c_pe_10: -0.7, c_pe_1: -0.7 });
    expect(cpeParoi('E', 1)).toEqual({ c_pe_10: -0.5, c_pe_1: -0.5 });
    expect(cpeParoi('D', 0.25)).toEqual({ c_pe_10: 0.7, c_pe_1: 1.0 });
    expect(cpeParoi('A', 2)).toEqual({ c_pe_10: -1.2, c_pe_1: -1.4 });
  });

  it('interpolation en h/d : D a h/d = 2/3 -> 0,75556 ; E a h/d = 3 -> -0,6', () => {
    expect(cpeParoi('D', 8 / 12).c_pe_10).toBeCloseTo(0.755556, 5);
    expect(cpeParoi('D', 8 / 12).c_pe_1).toBeCloseTo(1.0, 10);
    expect(cpeParoi('E', 8 / 12).c_pe_10).toBeCloseTo(-0.411111, 5);
    expect(cpeParoi('E', 3).c_pe_10).toBeCloseTo(-0.6, 10);
  });

  it('sous h/d = 0,25 : valeurs de 0,25', () => {
    expect(cpeParoi('E', 0.1)).toEqual({ c_pe_10: -0.3, c_pe_1: -0.3 });
  });

  it('au-dela de h/d = 5 : leve, hors perimetre', () => {
    expect(() => cpeParoi('D', 5.5)).toThrow('coefficients de force');
  });
});

describe('toiture plate, tableau 7.2', () => {
  it('rives a angle vif', () => {
    expect(cpeToiturePlate('F', 0).valeurs).toEqual([{ c_pe_10: -1.8, c_pe_1: -2.5 }]);
    expect(cpeToiturePlate('H', 0).valeurs).toEqual([{ c_pe_10: -0.7, c_pe_1: -1.2 }]);
  });

  it('zone I : deux valeurs opposees, toujours', () => {
    expect(cpeToiturePlate('I', 0).valeurs).toEqual([
      { c_pe_10: 0.2, c_pe_1: 0.2 },
      { c_pe_10: -0.2, c_pe_1: -0.2 },
    ]);
  });

  it('acrotere h_p/h = 0,0375 : interpolation, F = -1,5 / -2,1', () => {
    const [v] = cpeToiturePlate('F', 0.0375).valeurs;
    expect(v.c_pe_10).toBeCloseTo(-1.5, 10);
    expect(v.c_pe_1).toBeCloseTo(-2.1, 10);
  });

  it('acrotere h_p/h = 0,0125 : interpolation depuis l angle vif, G = -1,15 / -1,9', () => {
    const [v] = cpeToiturePlate('G', 0.0125).valeurs;
    expect(v.c_pe_10).toBeCloseTo(-1.15, 10);
    expect(v.c_pe_1).toBeCloseTo(-1.9, 10);
  });

  it('acrotere au-dela de 0,10 : valeurs de 0,10, avec avertissement', () => {
    const r = cpeToiturePlate('F', 0.2);
    expect(r.valeurs).toEqual([{ c_pe_10: -1.2, c_pe_1: -1.8 }]);
    expect(r.avertissement).toContain('0,10');
    expect(cpeToiturePlate('F', 0.1).avertissement).toBeNull();
  });
});

describe('facteur de correlation, §7.2.2(3)', () => {
  it('0,85 sous h/d = 1, 1 au-dela de 5, interpole entre', () => {
    expect(facteurDeCorrelation(0.5)).toBe(0.85);
    expect(facteurDeCorrelation(6)).toBe(1);
    expect(facteurDeCorrelation(3)).toBeCloseTo(0.925, 10);
  });
});
