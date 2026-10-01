/**
 * Zonage geometrique des parois et de la toiture plate, EN 1991-1-4
 * figures 7.5 et 7.6.
 *
 * Unites : m.
 *
 * Fonctions pures de geometrie : elles disent OU sont les zones, pas ce
 * qu'elles valent. Les coefficients viennent de `coefficients/exterieur.ts`.
 */

import type { ZoneParoi, ZoneToiturePlate } from '../coefficients/exterieur';

/** Troncon de zone le long de la profondeur d, mesure depuis le bord au vent (m). */
export interface TronconZone<N extends string> {
  nom: N;
  debut: number;
  fin: number;
}

/** Parametre e = min(b ; 2h), §7.2.2(2) (m). */
export function parametreE(b: number, h: number): number {
  return Math.min(b, 2 * h);
}

/** Nature du decoupage des parois laterales, figure 7.5. */
export type NatureDecoupage = 'e<d' | 'd<=e<5d' | 'e>=5d';

export function natureDecoupage(e: number, d: number): NatureDecoupage {
  if (e < d) return 'e<d';
  if (e < 5 * d) return 'd<=e<5d';
  return 'e>=5d';
}

/**
 * Zones A, B, C d'une paroi laterale de profondeur d, figure 7.5. Selon la
 * position de e par rapport a d, le decoupage CHANGE DE NATURE, pas
 * seulement de dimensions :
 *   e < d       : A [0 ; e/5], B [e/5 ; e], C [e ; d] ;
 *   d <= e < 5d : A [0 ; e/5], B [e/5 ; d], pas de zone C ;
 *   e >= 5d     : A seule, sur toute la profondeur.
 */
export function zonesParoiLaterale(e: number, d: number): TronconZone<ZoneParoi>[] {
  switch (natureDecoupage(e, d)) {
    case 'e<d':
      return [
        { nom: 'A', debut: 0, fin: e / 5 },
        { nom: 'B', debut: e / 5, fin: e },
        { nom: 'C', debut: e, fin: d },
      ];
    case 'd<=e<5d':
      return [
        { nom: 'A', debut: 0, fin: e / 5 },
        { nom: 'B', debut: e / 5, fin: d },
      ];
    case 'e>=5d':
      return [{ nom: 'A', debut: 0, fin: d }];
  }
}

/** Rectangle de zone de toiture dans le repere du vent : u le long du vent depuis la rive au vent, v en travers (m). */
export interface RectangleToiture {
  nom: ZoneToiturePlate;
  u0: number;
  u1: number;
  v0: number;
  v1: number;
}

/**
 * Zones F, G, H, I d'une toiture plate de largeur b (en travers du vent) et
 * de profondeur d, figure 7.6 :
 *   F : deux coins de e/4 x e/10 en rive au vent ;
 *   G : entre les deux F, profondeur e/10 ;
 *   H : de e/10 a e/2 ;
 *   I : au-dela de e/2.
 * Les zones sont ecretees a la profondeur d ; une zone vide est omise.
 */
export function zonesToiturePlate(e: number, b: number, d: number): RectangleToiture[] {
  const u1 = Math.min(e / 10, d);
  const u2 = Math.min(e / 2, d);
  const brut: RectangleToiture[] = [
    { nom: 'F', u0: 0, u1, v0: 0, v1: e / 4 },
    { nom: 'G', u0: 0, u1, v0: e / 4, v1: b - e / 4 },
    { nom: 'F', u0: 0, u1, v0: b - e / 4, v1: b },
    { nom: 'H', u0: u1, u1: u2, v0: 0, v1: b },
    { nom: 'I', u0: u2, u1: d, v0: 0, v1: b },
  ];
  const EPS = 1e-9;
  return brut.filter((r) => r.u1 - r.u0 > EPS && r.v1 - r.v0 > EPS);
}
