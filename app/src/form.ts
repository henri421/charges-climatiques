/**
 * Saisie de l'interface : le modele, sa lecture depuis les champs, et sa
 * traduction en donnees du noyau.
 *
 * Module PUR : il ne connait ni le document ni les elements de formulaire.
 * Le cablage lui passe des chaines, il rend un modele ou un refus motive.
 *
 * Unites de l'interface : longueurs en m, angles en degres, vitesse en m/s,
 * charges en kN/m2, aire en m2.
 */

import { lireNombre } from 'aedificium-ui';
import type { Batiment, CategorieTerrain, NomFace, Rugosite, Site, TopographieNeige } from '../../src/index';

export type TypeToiture = 'plate' | 'un-versant' | 'deux-versants';

export interface ModeleSaisie {
  longueur: number;
  largeur: number;
  hauteur: number;
  toiture: TypeToiture;
  acrotere: number;
  pente: number;
  pente1: number;
  pente2: number;

  piMode: 'enveloppe' | 'face-dominante';
  piFace: NomFace;
  piRapport: number;
  piAbscisse: number;

  csMode: 'dispense' | 'saisi';
  csOssature: boolean;
  csValeur: number;
  rugosite: Rugosite;

  /** null : non renseignee, le calcul du vent est bloque. */
  v_b0: number | null;
  categorie: CategorieTerrain;
  oroMode: 'negligeable' | 'saisi';
  c_o: number;
  aireMode: 'zone' | 'saisie';
  aire: number;

  /** null : non renseignee, le calcul de la neige est bloque. */
  s_k: number | null;
  altitude: number;
  topographie: TopographieNeige;
  ctSaisi: boolean;
  C_t: number;
  arret: boolean;
  debord: boolean;

  obstacle: boolean;
  obsNom: string;
  obsHauteur: number;

  adjacente: boolean;
  adjFace: NomFace;
  adjDifference: number;
  adjLargeur: number;
  adjPente: number;
}

export type Lecture = { ok: true; modele: ModeleSaisie } | { ok: false; message: string };

/**
 * Modele de depart : halle 30 x 12 x 8 m a toiture plate. Les grandeurs de
 * base v_b,0 et s_k sont VIDES : elles viennent de la carte nationale, et
 * aucune valeur par defaut ne doit pouvoir passer pour celle du site.
 */
export function modeleParDefaut(): ModeleSaisie {
  return {
    longueur: 30,
    largeur: 12,
    hauteur: 8,
    toiture: 'plate',
    acrotere: 0,
    pente: 10,
    pente1: 15,
    pente2: 15,
    piMode: 'enveloppe',
    piFace: 'y-',
    piRapport: 3,
    piAbscisse: 15,
    csMode: 'dispense',
    csOssature: false,
    csValeur: 1,
    rugosite: 'lisse',
    v_b0: null,
    categorie: 'II',
    oroMode: 'negligeable',
    c_o: 1,
    aireMode: 'zone',
    aire: 1,
    s_k: null,
    altitude: 300,
    topographie: 'normale',
    ctSaisi: false,
    C_t: 1,
    arret: false,
    debord: false,
    obstacle: false,
    obsNom: 'edicule',
    obsHauteur: 1,
    adjacente: false,
    adjFace: 'y+',
    adjDifference: 3,
    adjLargeur: 10,
    adjPente: 10,
  };
}

const TOITURES: readonly TypeToiture[] = ['plate', 'un-versant', 'deux-versants'];
const FACES: readonly NomFace[] = ['y-', 'y+', 'x-', 'x+'];
const CATEGORIES: readonly CategorieTerrain[] = ['0', 'I', 'II', 'III', 'IV'];
const RUGOSITES: readonly Rugosite[] = ['lisse', 'rugueuse', 'tres-rugueuse'];
const TOPOGRAPHIES: readonly TopographieNeige[] = ['battue-par-les-vents', 'normale', 'abritee'];

/** Libelles des champs, pour des messages d'erreur lisibles. */
const LIBELLES: Record<string, string> = {
  longueur: 'Longueur (m)',
  largeur: 'Largeur (m)',
  hauteur: 'Hauteur h (m)',
  acrotere: 'Acrotere h_p (m)',
  pente: 'Pente (degres)',
  pente1: 'Pente du versant y- (degres)',
  pente2: 'Pente du versant y+ (degres)',
  pi_rapport: 'Rapport des ouvertures (-)',
  pi_abscisse: 'Abscisse des ouvertures (m)',
  cs_valeur: 'c_s c_d (-)',
  v_b0: 'v_b,0 (m/s)',
  c_o: 'c_o (-)',
  aire: 'Aire chargee (m2)',
  s_k: 's_k (kN/m2)',
  altitude: 'Altitude (m)',
  C_t: 'C_t (-)',
  obs_hauteur: 'Hauteur de l obstacle (m)',
  adj_difference: 'Difference de hauteur h (m)',
  adj_largeur: 'Largeur b_1 de la toiture haute (m)',
  adj_pente: 'Pente de la toiture haute (degres)',
};

class ErreurDeSaisie extends Error {}

function choix<T extends string>(valeurs: Record<string, string>, nom: string, permis: readonly T[]): T {
  const v = valeurs[nom];
  if ((permis as readonly string[]).includes(v)) return v as T;
  throw new ErreurDeSaisie(`Valeur inattendue pour ${nom} : « ${v ?? ''} ».`);
}

function nombre(valeurs: Record<string, string>, nom: string, requis: boolean, repli: number): number {
  const v = lireNombre(valeurs[nom] ?? '');
  if (v === null) {
    if (requis) throw new ErreurDeSaisie(`${LIBELLES[nom] ?? nom} : nombre attendu.`);
    return repli;
  }
  return v;
}

function nombreOuVide(valeurs: Record<string, string>, nom: string): number | null {
  const texte = (valeurs[nom] ?? '').trim();
  if (texte === '') return null;
  const v = lireNombre(texte);
  if (v === null) throw new ErreurDeSaisie(`${LIBELLES[nom] ?? nom} : nombre attendu, ou champ vide.`);
  return v;
}

const oui = (valeurs: Record<string, string>, nom: string): boolean => valeurs[nom] === 'oui';

/**
 * Lit le modele depuis les valeurs des champs (des chaines, cases cochees
 * 'oui'). Un champ masque n'est pas exige : on garde la valeur par defaut.
 */
export function modeleDepuisChamps(valeurs: Record<string, string>): Lecture {
  const d = modeleParDefaut();
  try {
    const toiture = choix(valeurs, 'toiture', TOITURES);
    const piMode = choix(valeurs, 'pi_mode', ['enveloppe', 'face-dominante'] as const);
    const csMode = choix(valeurs, 'cs_mode', ['dispense', 'saisi'] as const);
    const oroMode = choix(valeurs, 'oro_mode', ['negligeable', 'saisi'] as const);
    const aireMode = choix(valeurs, 'aire_mode', ['zone', 'saisie'] as const);
    const ctSaisi = oui(valeurs, 'ct_saisi');
    const obstacle = oui(valeurs, 'obstacle');
    const adjacente = oui(valeurs, 'adjacente');
    const modele: ModeleSaisie = {
      longueur: nombre(valeurs, 'longueur', true, d.longueur),
      largeur: nombre(valeurs, 'largeur', true, d.largeur),
      hauteur: nombre(valeurs, 'hauteur', true, d.hauteur),
      toiture,
      acrotere: nombre(valeurs, 'acrotere', toiture === 'plate', d.acrotere),
      pente: nombre(valeurs, 'pente', toiture === 'un-versant', d.pente),
      pente1: nombre(valeurs, 'pente1', toiture === 'deux-versants', d.pente1),
      pente2: nombre(valeurs, 'pente2', toiture === 'deux-versants', d.pente2),
      piMode,
      piFace: choix(valeurs, 'pi_face', FACES),
      piRapport: nombre(valeurs, 'pi_rapport', piMode === 'face-dominante', d.piRapport),
      piAbscisse: nombre(valeurs, 'pi_abscisse', piMode === 'face-dominante', d.piAbscisse),
      csMode,
      csOssature: oui(valeurs, 'cs_ossature'),
      csValeur: nombre(valeurs, 'cs_valeur', csMode === 'saisi', d.csValeur),
      rugosite: choix(valeurs, 'rugosite', RUGOSITES),
      v_b0: nombreOuVide(valeurs, 'v_b0'),
      categorie: choix(valeurs, 'categorie', CATEGORIES),
      oroMode,
      c_o: nombre(valeurs, 'c_o', oroMode === 'saisi', d.c_o),
      aireMode,
      aire: nombre(valeurs, 'aire', aireMode === 'saisie', d.aire),
      s_k: nombreOuVide(valeurs, 's_k'),
      altitude: nombre(valeurs, 'altitude', true, d.altitude),
      topographie: choix(valeurs, 'topographie', TOPOGRAPHIES),
      ctSaisi,
      C_t: nombre(valeurs, 'C_t', ctSaisi, d.C_t),
      arret: oui(valeurs, 'arret'),
      debord: oui(valeurs, 'debord'),
      obstacle,
      obsNom: (valeurs.obs_nom ?? '').trim() || d.obsNom,
      obsHauteur: nombre(valeurs, 'obs_hauteur', obstacle, d.obsHauteur),
      adjacente,
      adjFace: choix(valeurs, 'adj_face', FACES),
      adjDifference: nombre(valeurs, 'adj_difference', adjacente, d.adjDifference),
      adjLargeur: nombre(valeurs, 'adj_largeur', adjacente, d.adjLargeur),
      adjPente: nombre(valeurs, 'adj_pente', adjacente, d.adjPente),
    };
    return { ok: true, modele };
  } catch (e) {
    if (e instanceof ErreurDeSaisie) return { ok: false, message: e.message };
    throw e;
  }
}

/** Valeurs des champs pour un modele : l'inverse de `modeleDepuisChamps`. */
export function champsDepuisModele(m: ModeleSaisie): Record<string, string> {
  const n = (v: number): string => String(v).replace('.', ',');
  const c = (v: boolean): string => (v ? 'oui' : 'non');
  return {
    longueur: n(m.longueur),
    largeur: n(m.largeur),
    hauteur: n(m.hauteur),
    toiture: m.toiture,
    acrotere: n(m.acrotere),
    pente: n(m.pente),
    pente1: n(m.pente1),
    pente2: n(m.pente2),
    pi_mode: m.piMode,
    pi_face: m.piFace,
    pi_rapport: n(m.piRapport),
    pi_abscisse: n(m.piAbscisse),
    cs_mode: m.csMode,
    cs_ossature: c(m.csOssature),
    cs_valeur: n(m.csValeur),
    rugosite: m.rugosite,
    v_b0: m.v_b0 === null ? '' : n(m.v_b0),
    categorie: m.categorie,
    oro_mode: m.oroMode,
    c_o: n(m.c_o),
    aire_mode: m.aireMode,
    aire: n(m.aire),
    s_k: m.s_k === null ? '' : n(m.s_k),
    altitude: n(m.altitude),
    topographie: m.topographie,
    ct_saisi: c(m.ctSaisi),
    C_t: n(m.C_t),
    arret: c(m.arret),
    debord: c(m.debord),
    obstacle: c(m.obstacle),
    obs_nom: m.obsNom,
    obs_hauteur: n(m.obsHauteur),
    adjacente: c(m.adjacente),
    adj_face: m.adjFace,
    adj_difference: n(m.adjDifference),
    adj_largeur: n(m.adjLargeur),
    adj_pente: n(m.adjPente),
  };
}

/** Le batiment du noyau. */
export function batimentDepuisModele(m: ModeleSaisie): Batiment {
  return {
    longueur: m.longueur,
    largeur: m.largeur,
    hauteur: m.hauteur,
    toiture:
      m.toiture === 'plate'
        ? { type: 'plate', acrotere: m.acrotere }
        : m.toiture === 'un-versant'
          ? { type: 'un-versant', pente: m.pente }
          : { type: 'deux-versants', pente1: m.pente1, pente2: m.pente2 },
    pressionInterieure:
      m.piMode === 'enveloppe'
        ? { mode: 'enveloppe' }
        : { mode: 'face-dominante', face: m.piFace, rapport: m.piRapport, abscisse: m.piAbscisse },
    rugosite: m.rugosite,
    coefficientStructural:
      m.csMode === 'saisi'
        ? { mode: 'saisi', valeur: m.csValeur }
        : { mode: 'dispense', ossatureAvecMursDeContreventement: m.csOssature },
  };
}

/** Le site du noyau. */
export function siteDepuisModele(m: ModeleSaisie): Site {
  return {
    altitude: m.altitude,
    v_b0: m.v_b0,
    categorieTerrain: m.categorie,
    orographie: m.oroMode === 'saisi' ? { mode: 'saisi', c_o: m.c_o } : { mode: 'negligeable' },
    s_k: m.s_k,
    topographieNeige: m.topographie,
    C_t: m.ctSaisi ? m.C_t : null,
    arretDeNeige: m.arret,
    obstacles: m.obstacle ? [{ nom: m.obsNom, hauteur: m.obsHauteur }] : [],
    toitureAdjacente: m.adjacente
      ? { face: m.adjFace, difference: m.adjDifference, largeurHaute: m.adjLargeur, penteHaute: m.adjPente }
      : null,
    debord: m.debord,
  };
}

/** Aire chargee pour l'interpolation de c_pe, ou null pour l'aire de chaque zone. */
export function aireChargeeDepuisModele(m: ModeleSaisie): number | null {
  return m.aireMode === 'saisie' ? m.aire : null;
}
