/**
 * Charges en rive : neige en debord, EN 1991-1-3 §6.3, et charge sur les
 * dispositifs d'arret de neige, §6.4.
 *
 * Unites : longueurs en m, charges surfaciques en kN/m2, charges lineiques
 * en kN/m, poids volumiques en kN/m3, angles en degres.
 */

import type { ChargeLineique } from '../../domaines/resultat';
import { exigerPositif } from '../../norms/profil';

/**
 * Charge de neige en debord, §6.3(2) :
 *   s_e = k s^2 / gamma,   k = 3 / d <= d gamma,   d = s / gamma.
 * `s` est la charge du cas sans accumulation le plus defavorable sur la
 * toiture (kN/m2). CHOIX DE MODELISATION : l'epaisseur de neige d est
 * deduite de s et du poids volumique gamma du §6.3(2).
 */
export function chargeDeDebord(nomRive: string, s: number, gamma: number): ChargeLineique {
  exigerPositif(s, 'La charge de neige en toiture s', 'kN/m2');
  exigerPositif(gamma, 'Le poids volumique de la neige gamma', 'kN/m3');
  const d = s / gamma;
  const k = Math.min(3 / d, d * gamma);
  const s_e = (k * s * s) / gamma;
  return {
    nom: `Debord, rive ${nomRive}`,
    clause: 'EN 1991-1-3 §6.3, expression (6.4)',
    valeur: s_e,
    detail: `s = ${s.toFixed(3)} kN/m2, d = ${d.toFixed(3)} m, k = ${k.toFixed(3)}`,
  };
}

/**
 * Effort sur un dispositif d'arret de neige, §6.4(2) :
 *   F_s = s b sin(alpha).
 * `s` : charge du cas sans accumulation le plus defavorable sur le versant
 * (kN/m2) ; `b` : distance horizontale entre le dispositif et le faitage ou
 * le dispositif suivant (m).
 */
export function effortArretDeNeige(nomVersant: string, s: number, b: number, alpha: number): ChargeLineique {
  exigerPositif(b, 'La distance horizontale b au faitage', 'm');
  const F_s = s * b * Math.sin((alpha * Math.PI) / 180);
  return {
    nom: `Arret de neige, versant ${nomVersant}`,
    clause: 'EN 1991-1-3 §6.4, expression (6.5)',
    valeur: F_s,
    detail: `s = ${s.toFixed(3)} kN/m2, b = ${b.toFixed(2)} m, alpha = ${alpha} degres`,
  };
}
