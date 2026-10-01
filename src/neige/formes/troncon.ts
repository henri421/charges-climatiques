/**
 * Construction d'un troncon de charge de neige.
 *
 * Unites : abscisses en m, charges en kN/m2 de projection horizontale.
 */

import type { TronconNeige } from '../../domaines/resultat';

/**
 * Troncon lineaire de mu0 a mu1 entre x0 et x1. `facteur` vaut
 * C_e * C_t * s_k (kN/m2), de sorte que s = mu * facteur (§5.2(3)a).
 */
export function troncon(x0: number, x1: number, mu0: number, mu1: number, facteur: number): TronconNeige {
  return { x0, x1, mu0, mu1, s0: mu0 * facteur, s1: mu1 * facteur };
}
