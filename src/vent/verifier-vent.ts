/**
 * Orchestration des actions du vent, EN 1991-1-4, methode de la pression
 * de pointe.
 *
 * Unites : longueurs en m, aires en m2, vitesses en m/s, pressions en kN/m2,
 * forces en kN.
 *
 * Le resultat est une liste de CAS DE VENT — direction x pression
 * interieure — chacun portant ses faces et leurs zones. Aucun scalaire.
 *
 * Directions : 0 = vent frappant la face 'y-', 90 = 'x+', 180 = 'y+',
 * 270 = 'x-'. Sans face dominante, le batiment rectangulaire est symetrique
 * et deux directions suffisent (0 et 90) ; avec une face dominante, la
 * position des ouvertures rompt la symetrie et les quatre sont rendues.
 */

import type { Batiment, NomFace } from '../model/batiment';
import { longueurDeFace } from '../model/batiment';
import type { Site } from '../model/site';
import type { Origine, ProfilNormatif } from '../norms/profil';
import { exigerPositif, exigerPositifOuNul, verifierProfil } from '../norms/profil';
import type { BandeDeHauteur, CasDeVent, Constat, Face, ResultatVent, Zone } from '../domaines/resultat';
import { pressionDePointe, vitesseDeReference, type ParametresPression } from './pression-de-pointe';
import { bandesDeHauteur } from './hauteurs-de-reference';
import {
  cpeInterpole,
  cpeParoi,
  cpeToiturePlate,
  facteurDeCorrelation,
  type PaireCpe,
} from './coefficients/exterieur';
import { parametreE, zonesParoiLaterale, zonesToiturePlate } from './zones/geometrie';
import { cpiEnveloppe, cpiFaceDominante, type ValeurCpi } from './coefficients/interieur';
import { coefficientStructural, frottement } from './coefficients/structural-et-frottement';

export interface OptionsVent {
  /**
   * Aire chargee pour l'interpolation de c_pe (m2). `null` : l'aire de
   * chaque zone, ce qui convient a la structure porteuse ; une petite aire
   * (fixation, element de bardage) se saisit.
   */
  aireChargee: number | null;
}

interface Direction {
  angle: number;
  au_vent: NomFace;
  sous_le_vent: NomFace;
  /** Faces laterales et sens de leur abscisse par rapport a la profondeur. */
  laterales: Array<{ face: NomFace; inverse: boolean }>;
}

/**
 * Pour chaque direction, la face au vent, la face sous le vent, et pour
 * chaque face laterale si son abscisse (de gauche a droite vue de
 * l'exterieur) court dans le sens du vent ou a rebours.
 */
const DIRECTIONS: Direction[] = [
  { angle: 0, au_vent: 'y-', sous_le_vent: 'y+', laterales: [{ face: 'x+', inverse: false }, { face: 'x-', inverse: true }] },
  { angle: 90, au_vent: 'x+', sous_le_vent: 'x-', laterales: [{ face: 'y-', inverse: true }, { face: 'y+', inverse: false }] },
  { angle: 180, au_vent: 'y+', sous_le_vent: 'y-', laterales: [{ face: 'x+', inverse: true }, { face: 'x-', inverse: false }] },
  { angle: 270, au_vent: 'x-', sous_le_vent: 'x+', laterales: [{ face: 'y-', inverse: false }, { face: 'y+', inverse: true }] },
];

const LIBELLES_FACES: Record<NomFace, string> = {
  'y-': 'long pan y-',
  'y+': 'long pan y+',
  'x-': 'pignon x-',
  'x+': 'pignon x+',
};

function rectangle(x0: number, x1: number, y0: number, y1: number): Array<{ x: number; y: number }> {
  return [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];
}

/** Zone complete, sans pression interieure : w_net est complete plus tard. */
function zone(
  nom: string,
  contour: Array<{ x: number; y: number }>,
  aire: number,
  z_e: number,
  q_p: number,
  paires: PaireCpe[],
  aireChargee: number | null
): Zone {
  const a = aireChargee ?? aire;
  return {
    nom,
    contour,
    aire,
    aireChargee: a,
    z_e,
    q_p,
    valeurs: paires.map((p) => {
      const c_pe = cpeInterpole(p, a);
      return { c_pe_1: p.c_pe_1, c_pe_10: p.c_pe_10, c_pe, w_e: q_p * c_pe, w_net: q_p * c_pe };
    }),
  };
}

/** Faces d'une direction, sans pression interieure. */
function facesDeLaDirection(
  batiment: Batiment,
  dir: Direction,
  qp: (z: number) => number,
  options: OptionsVent,
  avertissements: Set<string>
): { faces: Face[]; b: number; d: number; e: number; bandes: BandeDeHauteur[] } {
  const h = batiment.hauteur;
  const b = longueurDeFace(batiment, dir.au_vent);
  const d = longueurDeFace(batiment, dir.laterales[0].face);
  const e = parametreE(b, h);
  const hd = h / d;
  const q_h = qp(h);
  const faces: Face[] = [];

  // Face au vent : zone D, decoupee en bandes de hauteur de reference.
  const bandes = bandesDeHauteur(h, b).map((bd) => ({ ...bd, q_p: qp(bd.z_e) }));
  const D = cpeParoi('D', hd);
  faces.push({
    nom: dir.au_vent,
    role: 'au-vent',
    largeur: b,
    hauteur: h,
    zones: bandes.map((bd) =>
      zone('D', rectangle(0, b, bd.z_bas, bd.z_haut), b * (bd.z_haut - bd.z_bas), bd.z_e, bd.q_p, [D], options.aireChargee)
    ),
  });

  // Face sous le vent : zone E, z_e = h.
  faces.push({
    nom: dir.sous_le_vent,
    role: 'sous-le-vent',
    largeur: b,
    hauteur: h,
    zones: [zone('E', rectangle(0, b, 0, h), b * h, h, q_h, [cpeParoi('E', hd)], options.aireChargee)],
  });

  // Faces laterales : zones A, B, C depuis le bord au vent, z_e = h.
  for (const lat of dir.laterales) {
    const zones = zonesParoiLaterale(e, d).map((t) => {
      const x0 = lat.inverse ? d - t.fin : t.debut;
      const x1 = lat.inverse ? d - t.debut : t.fin;
      return zone(t.nom, rectangle(x0, x1, 0, h), (t.fin - t.debut) * h, h, q_h, [cpeParoi(t.nom, hd)], options.aireChargee);
    });
    faces.push({ nom: lat.face, role: 'laterale', largeur: d, hauteur: h, zones });
  }

  // Toiture plate : zones F, G, H, I dans le repere du vent, z_e = h.
  if (batiment.toiture.type === 'plate') {
    const hp_h = exigerPositifOuNul(batiment.toiture.acrotere, 'La hauteur d acrotere h_p', 'm') / h;
    const zones = zonesToiturePlate(e, b, d).map((r) => {
      const c = cpeToiturePlate(r.nom, hp_h);
      if (c.avertissement !== null) avertissements.add(c.avertissement);
      return zone(r.nom, rectangle(r.v0, r.v1, r.u0, r.u1), (r.u1 - r.u0) * (r.v1 - r.v0), h, q_h, c.valeurs, options.aireChargee);
    });
    faces.push({ nom: 'toiture', role: 'toiture', largeur: b, hauteur: d, zones });
  }

  return { faces, b, d, e, bandes };
}

/** Zone d'une face contenant l'abscisse donnee, pour le c_pe au droit des ouvertures. */
function cpeAuDroitDe(face: Face, abscisse: number): number {
  for (const z of face.zones) {
    const xs = z.contour.map((p) => p.x);
    if (abscisse >= Math.min(...xs) - 1e-9 && abscisse <= Math.max(...xs) + 1e-9) {
      return z.valeurs[0].c_pe;
    }
  }
  throw new Error(`L abscisse des ouvertures (${abscisse} m) sort de la face ${face.nom}.`);
}

/** Complete les pressions nettes d'une face pour une pression interieure w_i. */
function avecPressionInterieure(faces: Face[], w_i: number): Face[] {
  return faces.map((f) => ({
    ...f,
    zones: f.zones.map((z) => ({
      ...z,
      valeurs: z.valeurs.map((v) => ({ ...v, w_net: v.w_e - w_i })),
    })),
  }));
}

export function verifierVent(
  profil: ProfilNormatif,
  batiment: Batiment,
  site: Site,
  options: OptionsVent = { aireChargee: null }
): ResultatVent {
  verifierProfil(profil);
  if (site.v_b0 === null) {
    throw new Error(
      'La vitesse de reference de base v_b,0 n est pas renseignee. Elle vient de la carte de l annexe ' +
        'nationale au lieu de construction : sans elle, aucune action du vent ne peut etre calculee.'
    );
  }
  exigerPositif(batiment.longueur, 'La longueur du batiment', 'm');
  exigerPositif(batiment.largeur, 'La largeur du batiment', 'm');
  const h = exigerPositif(batiment.hauteur, 'La hauteur h du batiment', 'm');
  if (options.aireChargee !== null) exigerPositif(options.aireChargee, 'L aire chargee', 'm2');

  const origines: Record<string, Origine> = {
    v_b0: 'saisi',
    c_dir: 'profil',
    c_season: 'profil',
    rho: 'profil',
    k_I: 'profil',
    c_o: site.orographie.mode === 'saisi' ? 'saisi' : 'defaut-recommande',
  };
  const c_o = site.orographie.mode === 'saisi' ? exigerPositif(site.orographie.c_o, 'Le coefficient d orographie c_o', '-') : 1;
  const v_b = vitesseDeReference(site.v_b0, profil.vent.c_dir.valeur, profil.vent.c_season.valeur);
  const parametres: ParametresPression = {
    categorie: site.categorieTerrain,
    v_b,
    c_o,
    rho: profil.vent.rho.valeur,
    k_I: profil.vent.k_I.valeur,
  };
  const qp = (z: number): number => pressionDePointe(parametres, z);
  const q_p_h = qp(h);

  const avertissements = new Set<string>();
  let toiture: Constat;
  if (batiment.toiture.type === 'plate') {
    toiture = { applicable: true, motif: 'Toiture plate : zones F, G, H, I du §7.2.3.' };
  } else {
    toiture = {
      applicable: false,
      motif:
        'Toitures inclinees (tableaux 7.3 et 7.4) : zonage non implemente dans cette version. ' +
        'La toiture subit bien une action du vent, a determiner par ailleurs.',
    };
    avertissements.add(
      'Toiture inclinee : seules les parois verticales sont traitees, dessinees jusqu a la hauteur h ' +
        '(pignons comptes en rectangle, du cote de la securite).'
    );
  }

  const pi = batiment.pressionInterieure;
  const directions = pi.mode === 'face-dominante' ? DIRECTIONS : DIRECTIONS.slice(0, 2);
  const cas: CasDeVent[] = [];

  for (const dir of directions) {
    const { faces, b, d, e, bandes } = facesDeLaDirection(batiment, dir, qp, options, avertissements);
    const structural = coefficientStructural(batiment.coefficientStructural, h, d);
    const fr = frottement(b, d, h, q_p_h, batiment.rugosite);

    let cpis: ValeurCpi[];
    if (pi.mode === 'face-dominante') {
      const face = faces.find((f) => f.nom === pi.face);
      if (face === undefined) throw new Error(`Face dominante inconnue : ${pi.face}.`);
      cpis = [cpiFaceDominante(pi.rapport, cpeAuDroitDe(face, pi.abscisse))];
    } else {
      cpis = cpiEnveloppe(profil);
    }

    for (const cpi of cpis) {
      // Hauteur de reference interieure z_i = h : la plus defavorable des
      // hauteurs de reference des faces, choix du cote de la securite
      // (§7.2.9(8)).
      const w_i = q_p_h * cpi.c_pi;
      cas.push({
        direction: dir.angle,
        libelle: `Vent sur ${LIBELLES_FACES[dir.au_vent]}, c_pi = ${cpi.c_pi >= 0 ? '+' : ''}${cpi.c_pi.toFixed(2).replace('.', ',')}`,
        b,
        d,
        e,
        c_pi: cpi.c_pi,
        origineCpi: cpi.origine,
        w_i,
        bandes,
        faces: avecPressionInterieure(faces, w_i),
        c_s_c_d: structural.c_s_c_d,
        motifStructural: structural.motif,
        facteurCorrelation: facteurDeCorrelation(h / d),
        frottement: fr,
      });
    }
  }

  return {
    profil: profil.nom,
    dateProfil: profil.date,
    v_b,
    q_p_h,
    c_o,
    cas,
    origines,
    toiture,
    avertissements: [...avertissements],
  };
}
