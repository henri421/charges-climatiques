/**
 * Rugosite du terrain, EN 1991-1-4 §4.3.2 et tableau 4.1.
 *
 * Unites : hauteurs en m, coefficients sans dimension.
 */

import type { CategorieTerrain } from '../model/site';

export interface ParametresTerrain {
  /** Longueur de rugosite z_0 (m). */
  z_0: number;
  /** Hauteur minimale z_min (m). */
  z_min: number;
}

/** Tableau 4.1 : categories de terrain et parametres associes. */
export const TERRAINS: Record<CategorieTerrain, ParametresTerrain> = {
  '0': { z_0: 0.003, z_min: 1 },
  I: { z_0: 0.01, z_min: 1 },
  II: { z_0: 0.05, z_min: 2 },
  III: { z_0: 0.3, z_min: 5 },
  IV: { z_0: 1.0, z_min: 10 },
};

/** z_0,II, longueur de rugosite de la categorie II, expression (4.5) (m). */
export const Z0_II = 0.05;

/** z_max, hauteur maximale de validite du profil logarithmique, §4.3.2(1) (m). */
export const Z_MAX = 200;

/** Facteur de terrain k_r = 0,19 (z_0 / z_0,II)^0,07, expression (4.5). */
export function facteurDeTerrain(categorie: CategorieTerrain): number {
  return 0.19 * (TERRAINS[categorie].z_0 / Z0_II) ** 0.07;
}

/** Hauteur effectivement employee : z_min sous z_min, expression (4.4). Leve au-dela de z_max. */
export function hauteurDeCalcul(categorie: CategorieTerrain, z: number): number {
  if (!Number.isFinite(z) || z <= 0) {
    throw new Error('La hauteur z doit etre un nombre strictement positif (m).');
  }
  if (z > Z_MAX) {
    throw new Error(`La hauteur z = ${z} m depasse z_max = ${Z_MAX} m : hors du domaine du §4.3.2.`);
  }
  return Math.max(z, TERRAINS[categorie].z_min);
}

/** Coefficient de rugosite c_r(z) = k_r ln(z / z_0), expression (4.4). */
export function coefficientDeRugosite(categorie: CategorieTerrain, z: number): number {
  const zc = hauteurDeCalcul(categorie, z);
  return facteurDeTerrain(categorie) * Math.log(zc / TERRAINS[categorie].z_0);
}
