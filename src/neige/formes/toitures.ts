/**
 * Cas de charge de neige sans accumulation, par type de toiture,
 * EN 1991-1-3 §5.3.
 *
 * Unites : longueurs en m, angles en degres, charges en kN/m2 de projection
 * horizontale. Abscisse x depuis la rive 'y-', le long de la largeur.
 */

import type { CasDeNeige } from '../../domaines/resultat';
import type { Toiture } from '../../model/batiment';
import { mu1 } from './mu';
import { troncon } from './troncon';

/**
 * Largeurs en plan des deux versants d'une toiture a deux versants, egouts
 * a la meme hauteur : w1 tan(alpha1) = w2 tan(alpha2), w1 + w2 = largeur.
 * Choix de modelisation : sans cote de faitage saisie, c'est la seule
 * position du faitage que les deux pentes determinent.
 */
export function largeursDesVersants(largeur: number, pente1: number, pente2: number): [number, number] {
  const t1 = Math.tan((pente1 * Math.PI) / 180);
  const t2 = Math.tan((pente2 * Math.PI) / 180);
  const w1 = (largeur * t2) / (t1 + t2);
  return [w1, largeur - w1];
}

/**
 * Cas de charge sans accumulation.
 *
 * - toiture plate : mu_1 = 0,8, un cas (§5.3.2 avec alpha = 0) ;
 * - un versant : mu_1(alpha), un cas (§5.3.3, figure 5.2) ;
 * - deux versants : TROIS cas, rendus ensemble (§5.3.4, figure 5.3) : (i)
 *   sans accumulation, (ii) et (iii) avec un versant a demi-charge. Rendre le
 *   seul cas (i) serait faux : les cas dissymetriques gouvernent les efforts
 *   de flexion des portiques.
 */
export function casSansAccumulation(
  toiture: Toiture,
  largeur: number,
  facteur: number,
  arretDeNeige: boolean
): CasDeNeige[] {
  if (toiture.type === 'plate') {
    const m = mu1(0, arretDeNeige);
    return [
      {
        nom: 'Cas (i)',
        description: 'Toiture plate, charge uniforme',
        clause: 'EN 1991-1-3 §5.3.2, tableau 5.2 (alpha = 0)',
        repere: 'toiture',
        troncons: [troncon(0, largeur, m, m, facteur)],
        intermediaires: [{ symbole: 'mu_1', libelle: 'coefficient de forme', valeur: m, unite: '-' }],
      },
    ];
  }

  if (toiture.type === 'un-versant') {
    const m = mu1(toiture.pente, arretDeNeige);
    return [
      {
        nom: 'Cas (i)',
        description: `Toiture a un versant, alpha = ${toiture.pente} degres`,
        clause: 'EN 1991-1-3 §5.3.3, figure 5.2',
        repere: 'toiture',
        troncons: [troncon(0, largeur, m, m, facteur)],
        intermediaires: [{ symbole: 'mu_1', libelle: 'coefficient de forme', valeur: m, unite: '-' }],
      },
    ];
  }

  const { pente1, pente2 } = toiture;
  for (const [nom, a] of [['pente1', pente1], ['pente2', pente2]] as const) {
    if (!Number.isFinite(a) || a <= 0 || a >= 90) {
      throw new Error(`La ${nom} d une toiture a deux versants doit etre comprise entre 0 et 90 degres exclus (degres).`);
    }
  }
  const m1 = mu1(pente1, arretDeNeige);
  const m2 = mu1(pente2, arretDeNeige);
  const [w1] = largeursDesVersants(largeur, pente1, pente2);
  const inter = [
    { symbole: 'mu_1(alpha_1)', libelle: 'coefficient de forme, versant y-', valeur: m1, unite: '-' },
    { symbole: 'mu_1(alpha_2)', libelle: 'coefficient de forme, versant y+', valeur: m2, unite: '-' },
    { symbole: 'w_1', libelle: 'largeur en plan du versant y-', valeur: w1, unite: 'm' },
  ];
  const clause = 'EN 1991-1-3 §5.3.4, figure 5.3';
  return [
    {
      nom: 'Cas (i)',
      description: 'Deux versants, sans accumulation',
      clause,
      repere: 'toiture',
      troncons: [troncon(0, w1, m1, m1, facteur), troncon(w1, largeur, m2, m2, facteur)],
      intermediaires: inter,
    },
    {
      nom: 'Cas (ii)',
      description: 'Deux versants, versant y- a demi-charge',
      clause,
      repere: 'toiture',
      troncons: [troncon(0, w1, 0.5 * m1, 0.5 * m1, facteur), troncon(w1, largeur, m2, m2, facteur)],
      intermediaires: inter,
    },
    {
      nom: 'Cas (iii)',
      description: 'Deux versants, versant y+ a demi-charge',
      clause,
      repere: 'toiture',
      troncons: [troncon(0, w1, m1, m1, facteur), troncon(w1, largeur, 0.5 * m2, 0.5 * m2, facteur)],
      intermediaires: inter,
    },
  ];
}
