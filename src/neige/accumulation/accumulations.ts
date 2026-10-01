/**
 * Accumulations de neige, EN 1991-1-3 §5.3.6 et §6.2.
 *
 * Unites : longueurs en m, charges en kN/m2, poids volumiques en kN/m3.
 *
 * Ces cas ne sont PAS optionnels : des qu'un obstacle ou une construction
 * plus haute accolee est declare, le cas d'accumulation correspondant est
 * rendu d'office, sans case a cocher pour l'ecarter.
 */

import type { CasDeNeige } from '../../domaines/resultat';
import type { ProfilNormatif } from '../../norms/profil';
import { exigerPositif, exigerPositifOuNul } from '../../norms/profil';
import type { ObstacleNeige, ToitureAdjacente } from '../../model/site';
import { mu1 } from '../formes/mu';
import { troncon } from '../formes/troncon';

function borner(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Longueur d'accumulation l_s = 2h, bornee par le profil (m). */
export function longueurAccumulation(profil: ProfilNormatif, h: number): number {
  return borner(2 * h, profil.neige.l_s_min.valeur, profil.neige.l_s_max.valeur);
}

/**
 * Accumulation contre un obstacle, §6.2 :
 *   mu_1 = 0,8 ; mu_2 = gamma h / s_k, borne [0,8 ; 2,0] ; l_s = 2h, borne [5 ; 15] m.
 * Distribution triangulaire de mu_2 au pied de l'obstacle a mu_1 a l_s.
 * Abscisse depuis la face de l'obstacle.
 */
export function accumulationObstacle(
  profil: ProfilNormatif,
  obstacle: ObstacleNeige,
  s_k: number,
  facteur: number
): CasDeNeige {
  const h = exigerPositif(obstacle.hauteur, `La hauteur de l obstacle « ${obstacle.nom} »`, 'm');
  const gamma = profil.neige.gamma_accumulation.valeur;
  const brut = (gamma * h) / s_k;
  const mu2 = borner(brut, profil.neige.mu_obstacle_min.valeur, profil.neige.mu_obstacle_max.valeur);
  const m1 = 0.8;
  const l_s = longueurAccumulation(profil, h);
  return {
    nom: `Accumulation : ${obstacle.nom}`,
    description: `Accumulation contre l obstacle « ${obstacle.nom} » (h = ${h} m)`,
    clause: 'EN 1991-1-3 §6.2, figure 6.1',
    repere: 'depuis-obstacle',
    troncons: [troncon(0, l_s, mu2, m1, facteur)],
    intermediaires: [
      { symbole: 'gamma h / s_k', libelle: 'valeur brute de mu_2', valeur: brut, unite: '-' },
      { symbole: 'mu_2', libelle: 'coefficient au pied de l obstacle, borne', valeur: mu2, unite: '-' },
      { symbole: 'mu_1', libelle: 'coefficient courant', valeur: m1, unite: '-' },
      { symbole: 'l_s', libelle: 'longueur d accumulation', valeur: l_s, unite: 'm' },
    ],
  };
}

/**
 * Toiture basse accolee a une construction plus haute, §5.3.6, figure 5.7.
 *
 *   cas (i)  : mu_1 = 0,8 uniforme ;
 *   cas (ii) : mu_2 = mu_s + mu_w au pied du mur, decroissant lineairement
 *              jusqu'a mu_1 a l_s.
 *   mu_w = (b_1 + b_2) / (2h), plafonne a gamma h / s_k, puis borne par le
 *          profil [0,8 ; 4,0] ;
 *   l_s  = 2h, borne [5 ; 15] m ;
 *   mu_s = 0 si la toiture haute a une pente <= 15 degres ; sinon, charge
 *          additionnelle egale a 50 % de la charge totale du versant haut
 *          adjacent. CHOIX DE MODELISATION : cette charge est repartie en
 *          triangle sur l_s, d'ou mu_s = 2 * 0,5 * mu_1(alpha) * b_1 / l_s.
 *
 * Si b_2 < l_s, la distribution est tronquee a l'extremite de la toiture
 * basse (§5.3.6(3)).
 */
export function accumulationToitureAdjacente(
  profil: ProfilNormatif,
  adj: ToitureAdjacente,
  b2: number,
  s_k: number,
  facteur: number,
  arretDeNeige: boolean
): CasDeNeige[] {
  const h = exigerPositif(adj.difference, 'La difference de hauteur h avec la construction plus haute', 'm');
  const b1 = exigerPositifOuNul(adj.largeurHaute, 'La largeur b_1 de la toiture haute', 'm');
  exigerPositif(b2, 'La largeur b_2 de la toiture basse', 'm');
  const gamma = profil.neige.gamma_accumulation.valeur;
  const l_s = longueurAccumulation(profil, h);
  const mu_w_brut = (b1 + b2) / (2 * h);
  const plafond = (gamma * h) / s_k;
  const mu_w = borner(Math.min(mu_w_brut, plafond), profil.neige.mu_w_min.valeur, profil.neige.mu_w_max.valeur);
  const mu_s = adj.penteHaute <= 15 ? 0 : (mu1(adj.penteHaute, arretDeNeige) * b1) / l_s;
  const m1 = 0.8;
  const mu2 = mu_s + mu_w;
  const fin = Math.min(l_s, b2);
  const muFin = mu2 + ((m1 - mu2) * fin) / l_s;
  const troncons = [troncon(0, fin, mu2, muFin, facteur)];
  if (b2 > l_s) troncons.push(troncon(l_s, b2, m1, m1, facteur));
  const inter = [
    { symbole: 'h', libelle: 'difference de hauteur', valeur: h, unite: 'm' },
    { symbole: 'b_1', libelle: 'largeur de la toiture haute', valeur: b1, unite: 'm' },
    { symbole: 'b_2', libelle: 'largeur de la toiture basse', valeur: b2, unite: 'm' },
    { symbole: '(b_1+b_2)/2h', libelle: 'valeur brute de mu_w', valeur: mu_w_brut, unite: '-' },
    { symbole: 'gamma h / s_k', libelle: 'plafond de mu_w', valeur: plafond, unite: '-' },
    { symbole: 'mu_w', libelle: 'coefficient du au vent, borne', valeur: mu_w, unite: '-' },
    { symbole: 'mu_s', libelle: 'coefficient du au glissement', valeur: mu_s, unite: '-' },
    { symbole: 'mu_2', libelle: 'coefficient au pied du mur', valeur: mu2, unite: '-' },
    { symbole: 'l_s', libelle: 'longueur d accumulation', valeur: l_s, unite: 'm' },
  ];
  const clause = 'EN 1991-1-3 §5.3.6, figure 5.7';
  return [
    {
      nom: 'Toiture basse, cas (i)',
      description: 'Toiture basse accolee, sans accumulation',
      clause,
      repere: 'depuis-obstacle',
      troncons: [troncon(0, b2, m1, m1, facteur)],
      intermediaires: [{ symbole: 'mu_1', libelle: 'coefficient courant', valeur: m1, unite: '-' }],
    },
    {
      nom: 'Toiture basse, cas (ii)',
      description: 'Toiture basse accolee, accumulation au pied du mur',
      clause,
      repere: 'depuis-obstacle',
      troncons,
      intermediaires: inter,
    },
  ];
}
