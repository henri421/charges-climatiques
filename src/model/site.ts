/**
 * Le site : grandeurs de base, terrain, topographie, configuration de neige.
 *
 * Unites : longueurs et altitudes en m, vitesses en m/s, charges en kN/m2,
 * angles en degres.
 *
 * Les grandeurs de base (`v_b0`, `s_k`) sont TOUJOURS saisies : elles
 * viennent de la carte de l'annexe nationale en vigueur au lieu de
 * construction. `null` signifie « non renseignee » et bloque le calcul
 * correspondant.
 */

/** Categories de terrain, EN 1991-1-4 tableau 4.1. */
export type CategorieTerrain = '0' | 'I' | 'II' | 'III' | 'IV';

/** Effet de l'orographie, EN 1991-1-4 §4.3.3. */
export type Orographie =
  | { mode: 'negligeable' }
  | {
      mode: 'saisi';
      /** Coefficient d'orographie c_o, calcule hors de l'outil (annexe A.3). */
      c_o: number;
    };

/** Topographie du site pour la neige, EN 1991-1-3 tableau 5.1. */
export type TopographieNeige = 'battue-par-les-vents' | 'normale' | 'abritee';

export interface ObstacleNeige {
  nom: string;
  /** Hauteur de l'obstacle au-dessus de la toiture (m). */
  hauteur: number;
}

/** Construction plus haute accolee a la toiture etudiee, EN 1991-1-3 §5.3.6. */
export interface ToitureAdjacente {
  /** Face du batiment etudie contre laquelle s'eleve la construction plus haute. */
  face: 'y-' | 'y+' | 'x-' | 'x+';
  /** Difference de hauteur h entre les deux toitures (m). */
  difference: number;
  /** Largeur en plan b_1 de la toiture haute, perpendiculairement au mur (m). */
  largeurHaute: number;
  /** Pente du versant de la toiture haute qui descend vers la toiture basse (degres). */
  penteHaute: number;
}

export interface Site {
  /** Altitude du site (m), information portee dans la note. */
  altitude: number;
  /** Vitesse de reference de base v_b,0 (m/s), carte nationale. */
  v_b0: number | null;
  categorieTerrain: CategorieTerrain;
  orographie: Orographie;
  /** Charge de neige caracteristique au sol s_k au droit du site (kN/m2), altitude comprise. */
  s_k: number | null;
  topographieNeige: TopographieNeige;
  /** C_t saisi ; null pour la valeur du profil. */
  C_t: number | null;
  /** Dispositif d'arret de neige ou acrotere en rive basse, §5.3.3(4) et §5.3.4(4). */
  arretDeNeige: boolean;
  obstacles: ObstacleNeige[];
  toitureAdjacente: ToitureAdjacente | null;
  /** Calculer la charge de neige en debord de rive, §6.3. */
  debord: boolean;
}
