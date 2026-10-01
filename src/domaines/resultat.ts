/**
 * Types de sortie : des ZONES, jamais un scalaire.
 *
 * Une facade sous vent porte simultanement plusieurs zones de coefficients
 * differents, et chacune se combine aux deux signes de la pression interieure,
 * pour plusieurs directions de vent. Un outil qui rendrait « la charge de
 * vent » serait faux par construction : aucune fonction du noyau n'en rend.
 *
 * Unites : longueurs en m, aires en m2, pressions en kN/m2, forces en kN,
 * charges lineiques en kN/m.
 */

import type { Origine } from '../norms/profil';

/** Une valeur de coefficient exterieur d'une zone, et les pressions qui en decoulent. */
export interface ValeurZone {
  /** Coefficient pour une aire chargee de 1 m2 (-). */
  c_pe_1: number;
  /** Coefficient pour une aire chargee de 10 m2 et plus (-). */
  c_pe_10: number;
  /** Interpole pour l'aire chargee retenue, §7.2.1 figure 7.2 (-). */
  c_pe: number;
  /** Pression exterieure q_p(z_e) * c_pe, positive vers la paroi (kN/m2). */
  w_e: number;
  /** Pression nette w_e - w_i, positive vers l'interieur du batiment (kN/m2). */
  w_net: number;
}

export interface Zone {
  /** Designation normative : 'A', 'B', 'D', 'F', 'G'... */
  nom: string;
  /** Contour dans le plan de la face (m) : x le long de la face, y vers le haut ou dans le sens du vent. */
  contour: Array<{ x: number; y: number }>;
  /** Aire de la zone (m2). */
  aire: number;
  /** Aire chargee retenue pour l'interpolation de c_pe (m2). */
  aireChargee: number;
  /** Hauteur de reference de la zone (m). */
  z_e: number;
  /** Pression dynamique de pointe a z_e (kN/m2). */
  q_p: number;
  /**
   * Une valeur, ou deux quand la norme donne deux coefficients de signes
   * opposes pour la meme zone (zone I d'une toiture plate) : le module ne
   * choisit pas, il rend les deux.
   */
  valeurs: ValeurZone[];
}

export type RoleFace = 'au-vent' | 'sous-le-vent' | 'laterale' | 'toiture';

export interface Face {
  /** 'y-', 'y+', 'x-', 'x+' ou 'toiture'. */
  nom: string;
  role: RoleFace;
  /** Dimensions du dessin de la face (m) : largeur le long de x, hauteur le long de y. */
  largeur: number;
  hauteur: number;
  zones: Zone[];
}

export type OrigineCpi = 'face-dominante' | 'enveloppe-positive' | 'enveloppe-negative';

export interface BandeDeHauteur {
  /** Bas et haut de la bande sur la face au vent (m). */
  z_bas: number;
  z_haut: number;
  /** Hauteur de reference de la bande (m). */
  z_e: number;
  q_p: number;
}

export interface Constat {
  applicable: boolean;
  motif: string;
}

export interface CasDeVent {
  /** Direction : face frappee par le vent, 0 = 'y-', 90 = 'x+', 180 = 'y+', 270 = 'x-'. */
  direction: number;
  libelle: string;
  /** Dimension de la face au vent b et profondeur d (m). */
  b: number;
  d: number;
  /** Parametre e = min(b ; 2h), §7.2.2(2) (m). */
  e: number;
  c_pi: number;
  origineCpi: OrigineCpi;
  /** Pression interieure w_i = q_p(z_i) * c_pi (kN/m2). */
  w_i: number;
  /** Bandes de hauteur de reference de la face au vent, §7.2.2(1). */
  bandes: BandeDeHauteur[];
  faces: Face[];
  c_s_c_d: number;
  /** Critere de dispense ou origine de c_s c_d. */
  motifStructural: string;
  /** Facteur de correlation entre faces au vent et sous le vent, §7.2.2(3) : force d'ensemble seulement. */
  facteurCorrelation: number;
  frottement: Constat & { F_fr?: number; A_fr?: number; c_fr?: number };
}

export interface ResultatVent {
  profil: string;
  dateProfil: string;
  v_b: number;
  /** Pression de pointe a la hauteur du batiment, pour memoire (kN/m2). */
  q_p_h: number;
  c_o: number;
  cas: CasDeVent[];
  /** Zonage de la toiture : traite, ou non applicable avec son motif. */
  toiture: Constat;
  /** Provenance de chaque grandeur de base. */
  origines: Record<string, Origine>;
  avertissements: string[];
}

/**
 * Repartition de la charge de neige le long d'une coupe, par troncons
 * lineaires. x est l'abscisse horizontale (m) ; s en kN/m2 de projection
 * horizontale.
 */
export interface TronconNeige {
  x0: number;
  x1: number;
  mu0: number;
  mu1: number;
  s0: number;
  s1: number;
}

export interface CasDeNeige {
  nom: string;
  description: string;
  clause: string;
  /** 'toiture' : abscisse depuis la rive 'y-' ; 'depuis-obstacle' : depuis la face de l'obstacle ou du mur. */
  repere: 'toiture' | 'depuis-obstacle';
  troncons: TronconNeige[];
  /** Grandeurs intermediaires affichees dans la note (l_s, mu_w...). */
  intermediaires: Array<{ symbole: string; libelle: string; valeur: number; unite: string }>;
}

export interface ChargeLineique {
  nom: string;
  clause: string;
  /** kN/m de rive ou de dispositif. */
  valeur: number;
  detail: string;
}

export interface ResultatNeige {
  profil: string;
  dateProfil: string;
  s_k: number;
  C_e: number;
  C_t: number;
  origines: Record<string, Origine>;
  cas: CasDeNeige[];
  debord: Constat & { charges: ChargeLineique[] };
  arretDeNeige: Constat & { charges: ChargeLineique[] };
  avertissements: string[];
}
