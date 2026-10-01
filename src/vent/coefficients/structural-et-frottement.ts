/**
 * Coefficient structural, EN 1991-1-4 §6.2, et frottement, §7.5.
 *
 * Unites : longueurs en m, aires en m2, pressions en kN/m2, forces en kN.
 */

import type { CoefficientStructural, Rugosite } from '../../model/batiment';
import type { Constat } from '../../domaines/resultat';
import { exigerPositif } from '../../norms/profil';

/** Hauteur sous laquelle c_s c_d = 1, §6.2(1)a (m). */
const HAUTEUR_DISPENSE = 15;
/** Hauteur sous laquelle une ossature avec murs de contreventement est dispensee, §6.2(1)c (m). */
const HAUTEUR_OSSATURE = 100;

export interface ValeurStructurale {
  c_s_c_d: number;
  motif: string;
}

/**
 * c_s c_d pour la profondeur d de la direction consideree.
 * Dispense : h < 15 m (§6.2(1)a), ou ossature avec murs de contreventement,
 * h < 100 m et h < 4d (§6.2(1)c). Hors dispense et sans valeur saisie, le
 * module LEVE : l'analyse dynamique est hors perimetre, et extrapoler la
 * dispense serait non conservatif.
 */
export function coefficientStructural(cs: CoefficientStructural, h: number, d: number): ValeurStructurale {
  if (cs.mode === 'saisi') {
    exigerPositif(cs.valeur, 'Le coefficient structural c_s c_d', '-');
    return { c_s_c_d: cs.valeur, motif: 'Valeur saisie, calculee hors de l outil (§6.3 ou annexes B et C).' };
  }
  if (h < HAUTEUR_DISPENSE) {
    return { c_s_c_d: 1, motif: `h = ${h} m < ${HAUTEUR_DISPENSE} m : c_s c_d = 1 (§6.2(1)a).` };
  }
  if (cs.ossatureAvecMursDeContreventement && h < HAUTEUR_OSSATURE && h < 4 * d) {
    return {
      c_s_c_d: 1,
      motif: `Ossature avec murs de contreventement, h < ${HAUTEUR_OSSATURE} m et h < 4d : c_s c_d = 1 (§6.2(1)c).`,
    };
  }
  throw new Error(
    `Aucun critere de dispense du §6.2(1) n est rempli (h = ${h} m, d = ${d} m). Le calcul de ` +
      'c_s c_d (§6.3) est hors perimetre : saisir une valeur calculee par ailleurs.'
  );
}

/** Coefficients de frottement c_fr, tableau 7.10. */
export const COEFFICIENTS_FROTTEMENT: Record<Rugosite, number> = {
  lisse: 0.01,
  rugueuse: 0.02,
  'tres-rugueuse': 0.04,
};

/**
 * Frottement, §7.5.
 * Dispense (§7.5(3)) si l'aire des surfaces paralleles au vent est au plus
 * quatre fois celle des surfaces perpendiculaires (au vent et sous le vent).
 * Sinon F_fr = c_fr q_p(z_e) A_fr, A_fr etant la part des surfaces
 * paralleles au-dela de min(2b ; 4h) du bord au vent (§7.5(3)), z_e = h.
 * Surfaces paralleles : les deux parois laterales et la toiture.
 */
export function frottement(
  b: number,
  d: number,
  h: number,
  q_p_h: number,
  rugosite: Rugosite
): Constat & { F_fr?: number; A_fr?: number; c_fr?: number } {
  const paralleles = 2 * d * h + b * d;
  const perpendiculaires = 2 * b * h;
  if (paralleles <= 4 * perpendiculaires) {
    return {
      applicable: false,
      motif:
        `Surfaces paralleles ${paralleles.toFixed(1)} m2 <= 4 x surfaces perpendiculaires ` +
        `${(4 * perpendiculaires).toFixed(1)} m2 : frottement negligeable (§7.5(3)).`,
    };
  }
  const distance = Math.min(2 * b, 4 * h);
  const reste = Math.max(0, d - distance);
  const A_fr = 2 * h * reste + b * reste;
  const c_fr = COEFFICIENTS_FROTTEMENT[rugosite];
  return {
    applicable: true,
    motif: `Surfaces paralleles > 4 x surfaces perpendiculaires : frottement au-dela de min(2b ; 4h) = ${distance.toFixed(2)} m (§7.5).`,
    F_fr: c_fr * q_p_h * A_fr,
    A_fr,
    c_fr,
  };
}
