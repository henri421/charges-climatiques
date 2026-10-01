/**
 * Orchestration des charges de neige, EN 1991-1-3, situations durables et
 * transitoires :  s = mu_i C_e C_t s_k  (§5.2(3)a).
 *
 * Unites : longueurs en m, charges en kN/m2 de projection horizontale,
 * charges lineiques en kN/m.
 *
 * Hors perimetre, et dit comme tel : neige exceptionnelle au sol et
 * accumulations exceptionnelles (annexe B), toitures multiples, toitures
 * en voute, en sheds.
 */

import type { CasDeNeige, ChargeLineique, ResultatNeige } from '../domaines/resultat';
import type { Batiment } from '../model/batiment';
import type { Site } from '../model/site';
import type { Origine, ProfilNormatif } from '../norms/profil';
import { exigerPositif, verifierProfil } from '../norms/profil';
import { coefficientExposition, coefficientThermique } from './exposition';
import { casSansAccumulation, largeursDesVersants } from './formes/toitures';
import { accumulationObstacle, accumulationToitureAdjacente } from './accumulation/accumulations';
import { chargeDeDebord, effortArretDeNeige } from './accumulation/rives';

/** Altitude au-dela de laquelle le §6.3(1) recommande de considerer le debord (m). */
const ALTITUDE_DEBORD = 800;

/** Charge maximale d'un cas a une abscisse donnee, en bord de toiture (kN/m2). */
function chargeEnRive(cas: CasDeNeige, rive: 'debut' | 'fin'): number {
  const t = rive === 'debut' ? cas.troncons[0] : cas.troncons[cas.troncons.length - 1];
  return rive === 'debut' ? t.s0 : t.s1;
}

/** Charge maximale d'un cas sur l'intervalle [x0, x1] (kN/m2). */
function chargeMaxSur(cas: CasDeNeige, x0: number, x1: number): number {
  let max = 0;
  for (const t of cas.troncons) {
    if (t.x1 <= x0 || t.x0 >= x1) continue;
    max = Math.max(max, t.s0, t.s1);
  }
  return max;
}

export function verifierNeige(profil: ProfilNormatif, batiment: Batiment, site: Site): ResultatNeige {
  verifierProfil(profil);
  if (site.s_k === null) {
    throw new Error(
      'La charge de neige au sol s_k n est pas renseignee. Elle vient de la carte de l annexe ' +
        'nationale au lieu de construction : sans elle, aucune charge de neige ne peut etre calculee.'
    );
  }
  const s_k = exigerPositif(site.s_k, 'La charge de neige au sol s_k', 'kN/m2');
  const largeur = exigerPositif(batiment.largeur, 'La largeur du batiment', 'm');
  const longueur = exigerPositif(batiment.longueur, 'La longueur du batiment', 'm');

  const C_e = coefficientExposition(profil, site.topographieNeige);
  const C_t = coefficientThermique(profil, site.C_t);
  const facteur = C_e.valeur * C_t.valeur * s_k;
  const origines: Record<string, Origine> = { s_k: 'saisi', C_e: C_e.origine, C_t: C_t.origine };
  const avertissements: string[] = [];

  const sansAccumulation = casSansAccumulation(batiment.toiture, largeur, facteur, site.arretDeNeige);
  const cas: CasDeNeige[] = [...sansAccumulation];

  for (const obstacle of site.obstacles) {
    cas.push(accumulationObstacle(profil, obstacle, s_k, facteur));
  }

  if (site.toitureAdjacente !== null) {
    const adj = site.toitureAdjacente;
    const b2 = adj.face === 'y-' || adj.face === 'y+' ? largeur : longueur;
    if (batiment.toiture.type !== 'plate') {
      avertissements.push(
        'Le §5.3.6 vise une toiture basse de faible pente : la toiture etudiee etant inclinee, ' +
          'le cas d accumulation est rendu mais son domaine d emploi est a confirmer.'
      );
    }
    cas.push(...accumulationToitureAdjacente(profil, adj, b2, s_k, facteur, site.arretDeNeige));
  }

  // Debord, §6.3 : en chaque rive d'egout, a partir du cas sans
  // accumulation le plus defavorable en cette rive.
  let debord: ResultatNeige['debord'];
  if (site.debord) {
    const gamma = profil.neige.gamma_debord.valeur;
    const charges: ChargeLineique[] = [];
    const sDebut = Math.max(...sansAccumulation.map((c) => chargeEnRive(c, 'debut')));
    const sFin = Math.max(...sansAccumulation.map((c) => chargeEnRive(c, 'fin')));
    if (sDebut > 0) charges.push(chargeDeDebord('y-', sDebut, gamma));
    if (sFin > 0) charges.push(chargeDeDebord('y+', sFin, gamma));
    debord = {
      applicable: charges.length > 0,
      motif: charges.length > 0 ? 'Debord demande (§6.3).' : 'Charge nulle en rive : aucun debord.',
      charges,
    };
  } else {
    debord = {
      applicable: false,
      motif: 'Non demande. Le §6.3(1) recommande de le considerer pour les sites au-dessus de 800 m.',
      charges: [],
    };
    if (site.altitude > ALTITUDE_DEBORD) {
      avertissements.push(
        `Site a ${site.altitude} m : au-dessus de ${ALTITUDE_DEBORD} m, le §6.3(1) recommande de ` +
          'considerer la neige en debord de rive, qui n a pas ete demandee.'
      );
    }
  }

  // Arret de neige, §6.4 : sur chaque versant incline, b etant la largeur en
  // plan du versant (dispositif en egout, aucun dispositif intermediaire).
  let arretDeNeige: ResultatNeige['arretDeNeige'];
  const t = batiment.toiture;
  if (!site.arretDeNeige) {
    arretDeNeige = { applicable: false, motif: 'Aucun dispositif d arret de neige declare.', charges: [] };
  } else if (t.type === 'plate') {
    arretDeNeige = {
      applicable: false,
      motif: 'Toiture plate : aucun glissement, effort sur le dispositif sans objet (§6.4).',
      charges: [],
    };
  } else if (t.type === 'un-versant') {
    const s = Math.max(...sansAccumulation.map((c) => chargeMaxSur(c, 0, largeur)));
    arretDeNeige = {
      applicable: t.pente > 0,
      motif:
        t.pente > 0
          ? 'Dispositif en egout, b = largeur en plan du versant.'
          : 'Pente nulle : aucun glissement, effort sans objet.',
      charges: t.pente > 0 ? [effortArretDeNeige('unique', s, largeur, t.pente)] : [],
    };
  } else {
    const [w1, w2] = largeursDesVersants(largeur, t.pente1, t.pente2);
    const s1 = Math.max(...sansAccumulation.map((c) => chargeMaxSur(c, 0, w1)));
    const s2 = Math.max(...sansAccumulation.map((c) => chargeMaxSur(c, w1, largeur)));
    arretDeNeige = {
      applicable: true,
      motif: 'Dispositifs en egout de chaque versant, b = largeur en plan du versant.',
      charges: [effortArretDeNeige('y-', s1, w1, t.pente1), effortArretDeNeige('y+', s2, w2, t.pente2)],
    };
  }

  return {
    profil: profil.nom,
    dateProfil: profil.date,
    s_k,
    C_e: C_e.valeur,
    C_t: C_t.valeur,
    origines,
    cas,
    debord,
    arretDeNeige,
    avertissements,
  };
}
