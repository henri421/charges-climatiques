import { describe, expect, it } from 'vitest';
import { bandesDeHauteur } from '../../src/index';

describe('hauteurs de reference de la face au vent, §7.2.2(1)', () => {
  it('h <= b : une seule bande a z_e = h', () => {
    expect(bandesDeHauteur(8, 30)).toEqual([{ z_bas: 0, z_haut: 8, z_e: 8 }]);
    expect(bandesDeHauteur(12, 12)).toEqual([{ z_bas: 0, z_haut: 12, z_e: 12 }]);
  });

  it('b < h <= 2b : deux bandes, z_e = b puis z_e = h', () => {
    expect(bandesDeHauteur(20, 12)).toEqual([
      { z_bas: 0, z_haut: 12, z_e: 12 },
      { z_bas: 12, z_haut: 20, z_e: 20 },
    ]);
  });

  it('le seuil s active exactement a h = b', () => {
    expect(bandesDeHauteur(12.001, 12)).toHaveLength(2);
  });

  it('h > 2b : bande basse, bandes intermediaires a z_e = leur sommet, bande haute', () => {
    // h = 50, b = 20 : [0;20] z_e 20, [20;30] z_e 30, [30;50] z_e 50
    expect(bandesDeHauteur(50, 20)).toEqual([
      { z_bas: 0, z_haut: 20, z_e: 20 },
      { z_bas: 20, z_haut: 30, z_e: 30 },
      { z_bas: 30, z_haut: 50, z_e: 50 },
    ]);
  });

  it('partie intermediaire de plus de b : bandes egales de hauteur au plus b', () => {
    // h = 100, b = 20 : milieu 60 m -> 3 bandes de 20 m
    const bandes = bandesDeHauteur(100, 20);
    expect(bandes).toHaveLength(5);
    expect(bandes.map((b) => b.z_e)).toEqual([20, 40, 60, 80, 100]);
  });

  it('les z_e sont croissantes', () => {
    const z = bandesDeHauteur(73, 15).map((b) => b.z_e);
    for (let i = 1; i < z.length; i++) expect(z[i]).toBeGreaterThan(z[i - 1]);
  });

  it('refuse une hauteur nulle', () => {
    expect(() => bandesDeHauteur(0, 10)).toThrow('hauteur h');
  });
});
