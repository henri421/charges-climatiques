import { describe, expect, it } from 'vitest';
import { ec1Recommande } from '../../../src/index';
import {
  accumulationObstacle,
  accumulationToitureAdjacente,
  longueurAccumulation,
} from '../../../src/neige/accumulation/accumulations';
import type { ToitureAdjacente } from '../../../src/index';

const P = ec1Recommande();

function inter(cas: { intermediaires: Array<{ symbole: string; valeur: number }> }, symbole: string): number {
  const v = cas.intermediaires.find((i) => i.symbole === symbole);
  if (v === undefined) throw new Error(`intermediaire absent : ${symbole}`);
  return v.valeur;
}

describe('longueur d accumulation l_s = 2h bornee [5 ; 15] m', () => {
  it('borne basse, valeur courante, borne haute', () => {
    expect(longueurAccumulation(P, 1)).toBe(5);
    expect(longueurAccumulation(P, 4)).toBe(8);
    expect(longueurAccumulation(P, 10)).toBe(15);
  });
});

describe('accumulation contre un obstacle, §6.2', () => {
  it('mu_2 plafonne a 2,0 : h = 1 m, s_k = 0,7 -> 2 x 1 / 0,7 = 2,857', () => {
    const cas = accumulationObstacle(P, { nom: 'edicule', hauteur: 1 }, 0.7, 0.7);
    expect(inter(cas, 'gamma h / s_k')).toBeCloseTo(2.857143, 5);
    expect(inter(cas, 'mu_2')).toBe(2);
    expect(inter(cas, 'l_s')).toBe(5);
    expect(cas.troncons[0].s0).toBeCloseTo(1.4, 10);
    expect(cas.troncons[0].s1).toBeCloseTo(0.56, 10);
  });

  it('mu_2 plancher a 0,8 : h = 0,2 m, s_k = 0,7 -> 0,571', () => {
    const cas = accumulationObstacle(P, { nom: 'acrotere', hauteur: 0.2 }, 0.7, 0.7);
    expect(inter(cas, 'mu_2')).toBe(0.8);
  });

  it('mu_2 courant : h = 0,6 m, s_k = 1,0 -> 1,2', () => {
    const cas = accumulationObstacle(P, { nom: 'x', hauteur: 0.6 }, 1, 1);
    expect(inter(cas, 'mu_2')).toBeCloseTo(1.2, 10);
  });

  it('refuse une hauteur nulle', () => {
    expect(() => accumulationObstacle(P, { nom: 'x', hauteur: 0 }, 1, 1)).toThrow('hauteur');
  });
});

describe('toiture basse accolee, §5.3.6', () => {
  const adj: ToitureAdjacente = { face: 'y+', difference: 3, largeurHaute: 10, penteHaute: 10 };

  it('rend toujours les deux cas, (i) et (ii)', () => {
    const cas = accumulationToitureAdjacente(P, adj, 12, 0.7, 0.7, false);
    expect(cas.map((c) => c.nom)).toEqual(['Toiture basse, cas (i)', 'Toiture basse, cas (ii)']);
  });

  it('pente haute <= 15 degres : mu_s = 0, mu_w = (10 + 12) / 6 = 3,667, l_s = 6 m', () => {
    const [, ii] = accumulationToitureAdjacente(P, adj, 12, 0.7, 0.7, false);
    expect(inter(ii, 'mu_s')).toBe(0);
    expect(inter(ii, 'mu_w')).toBeCloseTo(3.666667, 5);
    expect(inter(ii, 'l_s')).toBe(6);
    expect(ii.troncons).toHaveLength(2);
    expect(ii.troncons[0].mu1).toBeCloseTo(0.8, 10);
    expect(ii.troncons[1].x0).toBe(6);
    expect(ii.troncons[1].x1).toBe(12);
  });

  it('pente haute 25 degres : mu_s = 0,8 x 10 / 6 = 1,333, mu_2 = 5,0', () => {
    const [, ii] = accumulationToitureAdjacente(P, { ...adj, penteHaute: 25 }, 12, 0.7, 0.7, false);
    expect(inter(ii, 'mu_s')).toBeCloseTo(1.333333, 5);
    expect(inter(ii, 'mu_2')).toBeCloseTo(5.0, 5);
  });

  it('mu_w plafonne a gamma h / s_k : h = 1, b1 = 20, b2 = 12, s_k = 1 -> 2,0', () => {
    const [, ii] = accumulationToitureAdjacente(P, { ...adj, difference: 1, largeurHaute: 20 }, 12, 1, 1, false);
    expect(inter(ii, '(b_1+b_2)/2h')).toBe(16);
    expect(inter(ii, 'mu_w')).toBe(2);
    expect(inter(ii, 'l_s')).toBe(5);
  });

  it('b_2 < l_s : distribution tronquee en bout de toiture basse', () => {
    // mu_w = 14 / 6 = 2,3333 ; a x = 4 : 2,3333 + (0,8 - 2,3333) x 4 / 6 = 1,3111
    const [, ii] = accumulationToitureAdjacente(P, adj, 4, 0.7, 0.7, false);
    expect(ii.troncons).toHaveLength(1);
    expect(ii.troncons[0].x1).toBe(4);
    expect(ii.troncons[0].mu1).toBeCloseTo(1.311111, 5);
  });
});
