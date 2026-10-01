import { describe, expect, it } from 'vitest';
import { ec1Recommande, verifierNeige } from '../../src/index';
import { batimentCourant, siteCourant } from '../fixtures';

const P = ec1Recommande();

describe('verifierNeige', () => {
  it('toiture plate en site normal : s = 0,8 x 1 x 1 x 0,7 = 0,56 kN/m2', () => {
    const r = verifierNeige(P, batimentCourant(), siteCourant());
    expect(r.C_e).toBe(1);
    expect(r.C_t).toBe(1);
    expect(r.cas).toHaveLength(1);
    expect(r.cas[0].troncons[0].s0).toBeCloseTo(0.56, 10);
    expect(r.origines).toEqual({ s_k: 'saisi', C_e: 'profil', C_t: 'profil' });
  });

  it('site battu par les vents : C_e = 0,8, s = 0,448 kN/m2', () => {
    const r = verifierNeige(P, batimentCourant(), siteCourant({ topographieNeige: 'battue-par-les-vents' }));
    expect(r.cas[0].troncons[0].s0).toBeCloseTo(0.448, 10);
  });

  it('C_t saisi est signale comme tel, et plafonne a 1', () => {
    const r = verifierNeige(P, batimentCourant(), siteCourant({ C_t: 0.9 }));
    expect(r.origines.C_t).toBe('saisi');
    expect(() => verifierNeige(P, batimentCourant(), siteCourant({ C_t: 1.1 }))).toThrow('C_t');
  });

  it('s_k absente BLOQUE le calcul', () => {
    expect(() => verifierNeige(P, batimentCourant(), siteCourant({ s_k: null }))).toThrow('s_k n est pas renseignee');
  });

  it('deux versants : les trois cas sont rendus', () => {
    const r = verifierNeige(
      P,
      batimentCourant({ toiture: { type: 'deux-versants', pente1: 20, pente2: 20 } }),
      siteCourant()
    );
    expect(r.cas).toHaveLength(3);
  });

  it('une toiture basse accolee EXIGE le cas d accumulation, rendu d office', () => {
    const r = verifierNeige(
      P,
      batimentCourant(),
      siteCourant({ toitureAdjacente: { face: 'y+', difference: 3, largeurHaute: 10, penteHaute: 10 } })
    );
    const noms = r.cas.map((c) => c.nom);
    expect(noms).toContain('Toiture basse, cas (ii)');
    // b_2 = largeur (12 m) pour un mur le long d un long pan
    const ii = r.cas.find((c) => c.nom === 'Toiture basse, cas (ii)');
    expect(ii?.troncons[ii.troncons.length - 1].x1).toBe(12);
  });

  it('mur sur pignon : b_2 = longueur', () => {
    const r = verifierNeige(
      P,
      batimentCourant(),
      siteCourant({ toitureAdjacente: { face: 'x-', difference: 3, largeurHaute: 10, penteHaute: 10 } })
    );
    const ii = r.cas.find((c) => c.nom === 'Toiture basse, cas (ii)');
    expect(ii?.troncons[ii.troncons.length - 1].x1).toBe(30);
  });

  it('un obstacle declare produit son cas d accumulation', () => {
    const r = verifierNeige(P, batimentCourant(), siteCourant({ obstacles: [{ nom: 'edicule', hauteur: 1 }] }));
    expect(r.cas.map((c) => c.nom)).toContain('Accumulation : edicule');
  });

  it('debord non demande : non applicable avec motif ; avertissement au-dessus de 800 m', () => {
    const bas = verifierNeige(P, batimentCourant(), siteCourant());
    expect(bas.debord.applicable).toBe(false);
    expect(bas.debord.motif).toContain('800 m');
    expect(bas.avertissements).toHaveLength(0);
    const haut = verifierNeige(P, batimentCourant(), siteCourant({ altitude: 1000 }));
    expect(haut.avertissements.join(' ')).toContain('debord');
  });

  it('debord demande : une charge par rive', () => {
    const r = verifierNeige(P, batimentCourant(), siteCourant({ debord: true }));
    expect(r.debord.applicable).toBe(true);
    expect(r.debord.charges).toHaveLength(2);
    expect(r.debord.charges[0].valeur).toBeCloseTo(0.058539, 5);
  });

  it('arret de neige sur toiture plate : non applicable, jamais satisfait', () => {
    const r = verifierNeige(P, batimentCourant(), siteCourant({ arretDeNeige: true }));
    expect(r.arretDeNeige.applicable).toBe(false);
    expect(r.arretDeNeige.motif).toContain('Toiture plate');
  });

  it('arret de neige sur deux versants a 30 degres : 0,56 x 6 x 0,5 = 1,68 kN/m par versant', () => {
    const r = verifierNeige(
      P,
      batimentCourant({ toiture: { type: 'deux-versants', pente1: 30, pente2: 30 } }),
      siteCourant({ arretDeNeige: true })
    );
    expect(r.arretDeNeige.charges).toHaveLength(2);
    expect(r.arretDeNeige.charges[0].valeur).toBeCloseTo(1.68, 10);
  });

  it('arret de neige sur toiture raide : mu_1 maintenu a 0,8', () => {
    const r = verifierNeige(
      P,
      batimentCourant({ toiture: { type: 'un-versant', pente: 70 } }),
      siteCourant({ arretDeNeige: true })
    );
    expect(r.cas[0].troncons[0].mu0).toBe(0.8);
  });
});
