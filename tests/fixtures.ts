/**
 * Cas de reference des tests.
 *
 * ⚠ VALEURS DE BASE FICTIVES. `V_B0_FICTIVE` et `S_K_FICTIVE` ne viennent
 * d'aucune carte nationale : elles sont choisies pour que les calculs a la
 * main restent lisibles. Ne jamais les reprendre dans un profil ni dans un
 * exemple presente comme reel.
 */

import type { Batiment, Site } from '../src/index';

/** Vitesse de reference de base FICTIVE (m/s). */
export const V_B0_FICTIVE = 26;
/** Charge de neige au sol FICTIVE (kN/m2). */
export const S_K_FICTIVE = 0.7;

/** Halle courante : 30 x 12 m en plan, 8 m de haut, toiture plate sans acrotere. */
export function batimentCourant(modifs: Partial<Batiment> = {}): Batiment {
  return {
    longueur: 30,
    largeur: 12,
    hauteur: 8,
    toiture: { type: 'plate', acrotere: 0 },
    pressionInterieure: { mode: 'enveloppe' },
    rugosite: 'lisse',
    coefficientStructural: { mode: 'dispense', ossatureAvecMursDeContreventement: false },
    ...modifs,
  };
}

/** Site de plaine, categorie II, orographie negligeable, aucun obstacle. */
export function siteCourant(modifs: Partial<Site> = {}): Site {
  return {
    altitude: 300,
    v_b0: V_B0_FICTIVE,
    categorieTerrain: 'II',
    orographie: { mode: 'negligeable' },
    s_k: S_K_FICTIVE,
    topographieNeige: 'normale',
    C_t: null,
    arretDeNeige: false,
    obstacles: [],
    toitureAdjacente: null,
    debord: false,
    ...modifs,
  };
}
