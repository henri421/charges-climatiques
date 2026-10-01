/**
 * Le batiment : base rectangulaire, toiture, ouvertures, surface.
 *
 * Unites : longueurs en m, angles en degres. Les actions climatiques se
 * raisonnent au metre et au kN/m2 : c'est l'unite des cartes et des tableaux
 * de l'EN 1991, et le declarer ici evite toute conversion implicite.
 *
 * Repere en plan : x le long de la `longueur`, y le long de la `largeur`.
 * Le faitage d'une toiture a deux versants est parallele a x. Les quatre
 * faces se nomment par leur normale sortante :
 *   - 'y-' et 'y+' : les longs pans, de longueur `longueur` ;
 *   - 'x-' et 'x+' : les pignons, de longueur `largeur`.
 */

export type NomFace = 'y-' | 'y+' | 'x-' | 'x+';

export type Toiture =
  | {
      type: 'plate';
      /** Hauteur d'acrotere h_p au-dessus de la toiture (m), 0 sans acrotere. */
      acrotere: number;
    }
  | {
      type: 'un-versant';
      /** Pente alpha (degres), versant descendant vers la face 'y-'. */
      pente: number;
    }
  | {
      type: 'deux-versants';
      /** Pente du versant cote 'y-' (degres). */
      pente1: number;
      /** Pente du versant cote 'y+' (degres). */
      pente2: number;
    };

/**
 * Pression interieure, EN 1991-1-4 §7.2.9.
 *
 * - 'enveloppe' : ni face dominante ni coefficient d'ouverture estimable ;
 *   la norme impose de retenir les DEUX valeurs opposees, et le module rend
 *   les deux cas sans choisir.
 * - 'face-dominante' : l'aire des ouvertures d'une face vaut au moins deux
 *   fois celle des autres faces (§7.2.9(5)).
 */
export type PressionInterieure =
  | { mode: 'enveloppe' }
  | {
      mode: 'face-dominante';
      face: NomFace;
      /** Aire des ouvertures de la face dominante / aire des autres ouvertures (-). */
      rapport: number;
      /** Abscisse du centre des ouvertures le long de la face, depuis son extremite gauche vue de l'exterieur (m). */
      abscisse: number;
    };

/** Rugosite des surfaces paralleles au vent, EN 1991-1-4 tableau 7.10. */
export type Rugosite = 'lisse' | 'rugueuse' | 'tres-rugueuse';

/**
 * Coefficient structural c_s c_d, EN 1991-1-4 §6.
 * - 'dispense' : le module verifie un critere du §6.2(1) et rend 1,0 ; si
 *   aucun critere n'est rempli, il LEVE.
 * - 'saisi' : valeur issue d'un calcul exterieur, signalee comme telle.
 */
export type CoefficientStructural =
  | { mode: 'dispense'; ossatureAvecMursDeContreventement: boolean }
  | { mode: 'saisi'; valeur: number };

export interface Batiment {
  /** Longueur en plan, le long de x (m). */
  longueur: number;
  /** Largeur en plan, le long de y (m). */
  largeur: number;
  /** Hauteur h du batiment (m) : au niveau de la toiture plate, acrotere exclu, ou au faitage. */
  hauteur: number;
  toiture: Toiture;
  pressionInterieure: PressionInterieure;
  rugosite: Rugosite;
  coefficientStructural: CoefficientStructural;
}

/** Longueur d'une face (m). */
export function longueurDeFace(batiment: Batiment, face: NomFace): number {
  return face === 'y-' || face === 'y+' ? batiment.longueur : batiment.largeur;
}
