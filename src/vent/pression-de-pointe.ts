/**
 * Vitesse et pression dynamique de pointe, EN 1991-1-4 §4.2 a §4.5.
 *
 * Unites : vitesses en m/s, hauteurs en m, masse volumique en kg/m3,
 * pressions en kN/m2.
 */

import type { CategorieTerrain } from '../model/site';
import { exigerPositif } from '../norms/profil';
import { TERRAINS, coefficientDeRugosite, hauteurDeCalcul } from './terrain';

/** Conversion des N/m2 de l'expression (4.8) en kN/m2. */
const N_PAR_KN = 1000;

/** Vitesse de reference v_b = c_dir c_season v_b,0, expression (4.1). */
export function vitesseDeReference(v_b0: number, c_dir: number, c_season: number): number {
  exigerPositif(v_b0, 'La vitesse de reference de base v_b,0', 'm/s');
  return c_dir * c_season * v_b0;
}

export interface ParametresPression {
  categorie: CategorieTerrain;
  /** Vitesse de reference v_b (m/s). */
  v_b: number;
  /** Coefficient d'orographie c_o (-). */
  c_o: number;
  /** Masse volumique de l'air (kg/m3). */
  rho: number;
  /** Coefficient de turbulence k_I (-). */
  k_I: number;
}

/** Vitesse moyenne v_m(z) = c_r(z) c_o(z) v_b, expression (4.3). */
export function vitesseMoyenne(p: ParametresPression, z: number): number {
  return coefficientDeRugosite(p.categorie, z) * p.c_o * p.v_b;
}

/** Intensite de turbulence I_v(z) = k_I / (c_o ln(z / z_0)), expression (4.7). */
export function intensiteDeTurbulence(p: ParametresPression, z: number): number {
  const zc = hauteurDeCalcul(p.categorie, z);
  return p.k_I / (p.c_o * Math.log(zc / TERRAINS[p.categorie].z_0));
}

/** Pression dynamique de pointe q_p(z) = [1 + 7 I_v(z)] 0,5 rho v_m(z)^2, expression (4.8) (kN/m2). */
export function pressionDePointe(p: ParametresPression, z: number): number {
  const v_m = vitesseMoyenne(p, z);
  return ((1 + 7 * intensiteDeTurbulence(p, z)) * 0.5 * p.rho * v_m * v_m) / N_PAR_KN;
}
