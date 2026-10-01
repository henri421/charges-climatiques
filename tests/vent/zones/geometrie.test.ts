import { describe, expect, it } from 'vitest';
import { natureDecoupage, parametreE } from '../../../src/index';
import { zonesParoiLaterale, zonesToiturePlate } from '../../../src/vent/zones/geometrie';

describe('parametre e, §7.2.2(2)', () => {
  it('e = min(b ; 2h)', () => {
    expect(parametreE(30, 8)).toBe(16);
    expect(parametreE(12, 8)).toBe(12);
  });
});

describe('parois laterales : trois decoupages de NATURES differentes, figure 7.5', () => {
  it('e < d : zones A, B et C', () => {
    // e = 12, d = 30
    expect(natureDecoupage(12, 30)).toBe('e<d');
    expect(zonesParoiLaterale(12, 30)).toEqual([
      { nom: 'A', debut: 0, fin: 2.4 },
      { nom: 'B', debut: 2.4, fin: 12 },
      { nom: 'C', debut: 12, fin: 30 },
    ]);
  });

  it('d <= e < 5d : zones A et B, pas de C', () => {
    // e = 16, d = 12
    expect(natureDecoupage(16, 12)).toBe('d<=e<5d');
    expect(zonesParoiLaterale(16, 12)).toEqual([
      { nom: 'A', debut: 0, fin: 3.2 },
      { nom: 'B', debut: 3.2, fin: 12 },
    ]);
  });

  it('e >= 5d : zone A seule', () => {
    // e = 20, d = 4
    expect(natureDecoupage(20, 4)).toBe('e>=5d');
    expect(zonesParoiLaterale(20, 4)).toEqual([{ nom: 'A', debut: 0, fin: 4 }]);
  });

  it('bascule exacte a e = d et e = 5d', () => {
    expect(natureDecoupage(12, 12)).toBe('d<=e<5d');
    expect(natureDecoupage(60, 12)).toBe('e>=5d');
  });
});

describe('toiture plate, figure 7.6', () => {
  it('b = 30, d = 12, e = 16 : F, G, F, H, I', () => {
    const z = zonesToiturePlate(16, 30, 12);
    expect(z.map((r) => r.nom)).toEqual(['F', 'G', 'F', 'H', 'I']);
    const [F, G, , H, I] = z;
    expect([F.u1, F.v1]).toEqual([1.6, 4]);
    expect([G.v0, G.v1]).toEqual([4, 26]);
    expect([H.u0, H.u1]).toEqual([1.6, 8]);
    expect([I.u0, I.u1]).toEqual([8, 12]);
  });

  it('profondeur faible : les zones sont ecretees et la zone I disparait', () => {
    // e = 16, d = 6 : H de 1,6 a 6, pas de I
    const z = zonesToiturePlate(16, 30, 6);
    expect(z.map((r) => r.nom)).toEqual(['F', 'G', 'F', 'H']);
    expect(z[3].u1).toBe(6);
  });

  it('e <= b : la zone G subsiste toujours, de largeur b - e/2', () => {
    // b = e = 8 : F de 2 m de part et d autre, G de largeur 4
    const z = zonesToiturePlate(8, 8, 20);
    expect(z.map((r) => r.nom)).toEqual(['F', 'G', 'F', 'H', 'I']);
    expect(z[1].v1 - z[1].v0).toBe(4);
  });
});
