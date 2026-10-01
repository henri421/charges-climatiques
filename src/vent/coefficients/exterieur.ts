/**
 * Coefficients de pression exterieure, EN 1991-1-4 §7.2.
 *
 * Unites : aires en m2, rapports et coefficients sans dimension.
 *
 * c_pe,1 ET c_pe,10 sont TOUJOURS rendus : c_pe,10 seul serait faux pour les
 * fixations, le bardage et les menuiseries, qui se dimensionnent avec c_pe,1.
 */

/** Paire de coefficients d'une zone : c_pe,10 et c_pe,1. */
export interface PaireCpe {
  c_pe_10: number;
  c_pe_1: number;
}

/**
 * Interpolation selon l'aire chargee A, §7.2.1 figure 7.2 :
 *   A <= 1 m2       : c_pe = c_pe,1
 *   1 < A < 10 m2   : c_pe = c_pe,1 - (c_pe,1 - c_pe,10) log10(A)
 *   A >= 10 m2      : c_pe = c_pe,10
 */
export function cpeInterpole(paire: PaireCpe, aire: number): number {
  if (!Number.isFinite(aire) || aire <= 0) {
    throw new Error('L aire chargee A doit etre un nombre strictement positif (m2).');
  }
  if (aire <= 1) return paire.c_pe_1;
  if (aire >= 10) return paire.c_pe_10;
  return paire.c_pe_1 - (paire.c_pe_1 - paire.c_pe_10) * Math.log10(aire);
}

function interpoler(x: number, x0: number, x1: number, y0: number, y1: number): number {
  return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

function interpolerPaire(x: number, x0: number, x1: number, p0: PaireCpe, p1: PaireCpe): PaireCpe {
  return {
    c_pe_10: interpoler(x, x0, x1, p0.c_pe_10, p1.c_pe_10),
    c_pe_1: interpoler(x, x0, x1, p0.c_pe_1, p1.c_pe_1),
  };
}

export type ZoneParoi = 'A' | 'B' | 'C' | 'D' | 'E';

/** Tableau 7.1, lignes h/d = 5, 1 et <= 0,25 : [c_pe,10, c_pe,1]. */
const TABLEAU_7_1: Array<{ hd: number; zones: Record<ZoneParoi, [number, number]> }> = [
  { hd: 5, zones: { A: [-1.2, -1.4], B: [-0.8, -1.1], C: [-0.5, -0.5], D: [0.8, 1.0], E: [-0.7, -0.7] } },
  { hd: 1, zones: { A: [-1.2, -1.4], B: [-0.8, -1.1], C: [-0.5, -0.5], D: [0.8, 1.0], E: [-0.5, -0.5] } },
  { hd: 0.25, zones: { A: [-1.2, -1.4], B: [-0.8, -1.1], C: [-0.5, -0.5], D: [0.7, 1.0], E: [-0.3, -0.3] } },
];

function paire(v: [number, number]): PaireCpe {
  return { c_pe_10: v[0], c_pe_1: v[1] };
}

/**
 * Coefficients des parois verticales, tableau 7.1, interpoles lineairement
 * en h/d (§7.2.2(2) note 2). Sous h/d = 0,25, les valeurs de 0,25. Au-dela
 * de h/d = 5 : la norme renvoie aux coefficients de force (§7.6 a §7.8),
 * HORS PERIMETRE, et le module leve plutot que d'extrapoler.
 */
export function cpeParoi(zone: ZoneParoi, hd: number): PaireCpe {
  if (!Number.isFinite(hd) || hd <= 0) {
    throw new Error('Le rapport h/d doit etre un nombre strictement positif (-).');
  }
  if (hd > 5) {
    throw new Error(
      `h/d = ${hd.toFixed(2)} > 5 : le tableau 7.1 ne s applique plus, la norme renvoie aux ` +
        'coefficients de force (§7.6 a §7.8), hors perimetre de cet outil.'
    );
  }
  const [l5, l1, l025] = TABLEAU_7_1;
  if (hd >= 1) return interpolerPaire(hd, 1, 5, paire(l1.zones[zone]), paire(l5.zones[zone]));
  if (hd > 0.25) return interpolerPaire(hd, 0.25, 1, paire(l025.zones[zone]), paire(l1.zones[zone]));
  return paire(l025.zones[zone]);
}

export type ZoneToiturePlate = 'F' | 'G' | 'H' | 'I';

/**
 * Tableau 7.2, toitures plates : rives a angle vif, puis acroteres
 * h_p/h = 0,025, 0,05 et 0,10. [c_pe,10, c_pe,1] pour F, G, H. La zone I
 * porte deux valeurs opposees, +0,2 et -0,2, quel que soit le cas.
 */
const TABLEAU_7_2: Array<{ hp_h: number; F: [number, number]; G: [number, number]; H: [number, number] }> = [
  { hp_h: 0, F: [-1.8, -2.5], G: [-1.2, -2.0], H: [-0.7, -1.2] },
  { hp_h: 0.025, F: [-1.6, -2.2], G: [-1.1, -1.8], H: [-0.7, -1.2] },
  { hp_h: 0.05, F: [-1.4, -2.0], G: [-0.9, -1.6], H: [-0.7, -1.2] },
  { hp_h: 0.1, F: [-1.2, -1.8], G: [-0.8, -1.4], H: [-0.7, -1.2] },
];

export interface CpeToiturePlate {
  valeurs: PaireCpe[];
  /** Rapport h_p/h effectivement employe (-). */
  hp_h: number;
  /** Mise en garde si le rapport sort du tableau. */
  avertissement: string | null;
}

/**
 * Coefficients d'une zone de toiture plate, tableau 7.2. Interpolation
 * lineaire en h_p/h (note 1 du tableau), la rive a angle vif valant
 * h_p/h = 0.
 *
 * Au-dela de h_p/h = 0,10, les valeurs de 0,10 sont retenues avec un
 * avertissement : un acrotere plus haut reduit encore les depressions, ces
 * valeurs restent donc du cote de la securite.
 */
export function cpeToiturePlate(zone: ZoneToiturePlate, hp_h: number): CpeToiturePlate {
  if (!Number.isFinite(hp_h) || hp_h < 0) {
    throw new Error('Le rapport h_p/h doit etre un nombre positif ou nul (-).');
  }
  if (zone === 'I') {
    return {
      valeurs: [
        { c_pe_10: 0.2, c_pe_1: 0.2 },
        { c_pe_10: -0.2, c_pe_1: -0.2 },
      ],
      hp_h,
      avertissement: null,
    };
  }
  const dernier = TABLEAU_7_2[TABLEAU_7_2.length - 1];
  if (hp_h >= dernier.hp_h) {
    return {
      valeurs: [paire(dernier[zone])],
      hp_h: dernier.hp_h,
      avertissement:
        hp_h > dernier.hp_h
          ? `h_p/h = ${hp_h.toFixed(3)} > 0,10 : valeurs du tableau 7.2 pour h_p/h = 0,10 retenues, du cote de la securite.`
          : null,
    };
  }
  for (let i = 0; i < TABLEAU_7_2.length - 1; i++) {
    const a = TABLEAU_7_2[i];
    const b = TABLEAU_7_2[i + 1];
    if (hp_h >= a.hp_h && hp_h <= b.hp_h) {
      return {
        valeurs: [interpolerPaire(hp_h, a.hp_h, b.hp_h, paire(a[zone]), paire(b[zone]))],
        hp_h,
        avertissement: null,
      };
    }
  }
  throw new Error('Rapport h_p/h hors du tableau 7.2.');
}

/**
 * Facteur de correlation entre faces au vent et sous le vent, §7.2.2(3) :
 * 1,0 pour h/d >= 5, 0,85 pour h/d <= 1, interpolation lineaire entre les
 * deux. Il ne s'applique qu'a la force d'ensemble, jamais aux pressions
 * locales.
 */
export function facteurDeCorrelation(hd: number): number {
  if (hd <= 1) return 0.85;
  if (hd >= 5) return 1;
  return interpoler(hd, 1, 5, 0.85, 1);
}
