import { describe, expect, it } from 'vitest';
import { ec1Recommande, verifierVent, type CasDeVent, type Face } from '../../src/index';
import { batimentCourant, siteCourant } from '../fixtures';

const P = ec1Recommande();

function face(cas: CasDeVent, nom: string): Face {
  const f = cas.faces.find((x) => x.nom === nom);
  if (f === undefined) throw new Error(`face absente : ${nom}`);
  return f;
}

describe('verifierVent, halle 30 x 12 x 8 m, toiture plate, categorie II', () => {
  const r = verifierVent(P, batimentCourant(), siteCourant());

  it('ne rend pas de scalaire : 2 directions x 2 pressions interieures = 4 cas', () => {
    expect(r.cas).toHaveLength(4);
    expect(r.cas.map((c) => [c.direction, c.origineCpi])).toEqual([
      [0, 'enveloppe-positive'],
      [0, 'enveloppe-negative'],
      [90, 'enveloppe-positive'],
      [90, 'enveloppe-negative'],
    ]);
  });

  it('q_p(h = 8 m) = 0,93471 kN/m2', () => {
    expect(r.q_p_h).toBeCloseTo(0.934713, 5);
  });

  it('direction 0 : b = 30, d = 12, e = 16, une seule bande', () => {
    const c = r.cas[0];
    expect([c.b, c.d, c.e]).toEqual([30, 12, 16]);
    expect(c.bandes).toHaveLength(1);
  });

  it('direction 0, face au vent D : c_pe = 0,75556, w_e = 0,70623, w_net = w_e - 0,2 q_p = 0,51929', () => {
    const D = face(r.cas[0], 'y-').zones[0];
    expect(D.nom).toBe('D');
    expect(D.valeurs[0].c_pe).toBeCloseTo(0.755556, 5);
    expect(D.valeurs[0].w_e).toBeCloseTo(0.706228, 5);
    expect(D.valeurs[0].w_net).toBeCloseTo(0.519285, 5);
  });

  it('rend toujours c_pe,1 ET c_pe,10', () => {
    const D = face(r.cas[0], 'y-').zones[0];
    expect(D.valeurs[0].c_pe_1).toBe(1);
    expect(D.valeurs[0].c_pe_10).toBeCloseTo(0.755556, 5);
  });

  it('direction 0, parois laterales : A et B seulement (e >= d)', () => {
    expect(face(r.cas[0], 'x+').zones.map((z) => z.nom)).toEqual(['A', 'B']);
  });

  it('direction 90, parois laterales : A, B et C (e < d)', () => {
    expect(face(r.cas[2], 'y-').zones.map((z) => z.nom).sort()).toEqual(['A', 'B', 'C']);
  });

  it('la zone A est contre le bord au vent, des deux cotes', () => {
    // direction 0, vent vers +y : sur x+ l abscisse croit avec y, sur x- elle decroit
    const Ax = face(r.cas[0], 'x+').zones.find((z) => z.nom === 'A');
    const Amoins = face(r.cas[0], 'x-').zones.find((z) => z.nom === 'A');
    expect(Math.min(...(Ax?.contour.map((p) => p.x) ?? []))).toBe(0);
    expect(Math.max(...(Amoins?.contour.map((p) => p.x) ?? []))).toBe(12);
  });

  it('toiture plate : zone I a deux valeurs, w_e = +-0,2 q_p', () => {
    const I = face(r.cas[0], 'toiture').zones.find((z) => z.nom === 'I');
    expect(I?.valeurs).toHaveLength(2);
    expect(I?.valeurs[0].w_e).toBeCloseTo(0.186943, 5);
    expect(I?.valeurs[1].w_e).toBeCloseTo(-0.186943, 5);
  });

  it('aire chargee de 1 m2 : c_pe = c_pe,1 partout', () => {
    const r1 = verifierVent(P, batimentCourant(), siteCourant(), { aireChargee: 1 });
    const F = face(r1.cas[0], 'toiture').zones.find((z) => z.nom === 'F');
    expect(F?.valeurs[0].c_pe).toBe(-2.5);
    expect(F?.aireChargee).toBe(1);
  });

  it('frottement : non applicable en direction 0, applicable en direction 90', () => {
    expect(r.cas[0].frottement.applicable).toBe(false);
    expect(r.cas[2].frottement.applicable).toBe(true);
    expect(r.cas[2].frottement.F_fr).toBeCloseTo(1.570318, 5);
  });

  it('c_s c_d = 1 par dispense h < 15 m', () => {
    expect(r.cas[0].c_s_c_d).toBe(1);
  });

  it('provenances declarees', () => {
    expect(r.origines.v_b0).toBe('saisi');
    expect(r.origines.rho).toBe('profil');
    expect(r.origines.c_o).toBe('defaut-recommande');
  });
});

describe('verifierVent, cas particuliers', () => {
  it('v_b,0 absente BLOQUE le calcul', () => {
    expect(() => verifierVent(P, batimentCourant(), siteCourant({ v_b0: null }))).toThrow('v_b,0 n est pas renseignee');
  });

  it('batiment eleve : bandes de hauteur de reference et q_p croissantes', () => {
    const r = verifierVent(
      P,
      batimentCourant({
        longueur: 20,
        largeur: 15,
        hauteur: 50,
        coefficientStructural: { mode: 'dispense', ossatureAvecMursDeContreventement: true },
      }),
      siteCourant()
    );
    const c = r.cas[0];
    expect(c.bandes.map((b) => b.z_e)).toEqual([20, 30, 50]);
    expect(c.bandes[1].q_p).toBeGreaterThan(c.bandes[0].q_p);
    expect(c.bandes[2].q_p).toBeGreaterThan(c.bandes[1].q_p);
    expect(face(c, 'y-').zones).toHaveLength(3);
  });

  it('h/d > 5 : leve avec un message qui nomme le motif', () => {
    expect(() =>
      verifierVent(
        P,
        batimentCourant({ longueur: 10, largeur: 8, hauteur: 60, coefficientStructural: { mode: 'saisi', valeur: 1 } }),
        siteCourant()
      )
    ).toThrow('coefficients de force');
  });

  it('toiture inclinee : toiture non applicable avec motif, parois traitees', () => {
    const r = verifierVent(P, batimentCourant({ toiture: { type: 'deux-versants', pente1: 15, pente2: 15 } }), siteCourant());
    expect(r.toiture.applicable).toBe(false);
    expect(r.toiture.motif).toContain('tableaux 7.3 et 7.4');
    expect(r.cas[0].faces.map((f) => f.nom)).not.toContain('toiture');
  });

  it('face dominante : quatre directions, un c_pi par direction', () => {
    // ouvertures au milieu du long pan y-, rapport 3 -> c_pi = 0,9 c_pe
    const r = verifierVent(
      P,
      batimentCourant({ pressionInterieure: { mode: 'face-dominante', face: 'y-', rapport: 3, abscisse: 15 } }),
      siteCourant()
    );
    expect(r.cas).toHaveLength(4);
    const cpi = r.cas.map((c) => c.c_pi);
    // 0 : au vent, D = 0,75556 -> 0,68 ; 90 et 270 : laterale, zone C -0,5 -> -0,45 ;
    // 180 : sous le vent, E = -0,41111 -> -0,37
    expect(cpi[0]).toBeCloseTo(0.68, 5);
    expect(cpi[1]).toBeCloseTo(-0.45, 5);
    expect(cpi[2]).toBeCloseTo(-0.37, 5);
    expect(cpi[3]).toBeCloseTo(-0.45, 5);
    expect(r.cas.every((c) => c.origineCpi === 'face-dominante')).toBe(true);
  });

  it('acrotere au-dela de h_p/h = 0,10 : avertissement porte au resultat', () => {
    const r = verifierVent(P, batimentCourant({ toiture: { type: 'plate', acrotere: 1.2 } }), siteCourant());
    expect(r.avertissements.join(' ')).toContain('0,10');
  });

  it('orographie saisie : c_o porte dans le resultat et signale', () => {
    const r = verifierVent(P, batimentCourant(), siteCourant({ orographie: { mode: 'saisi', c_o: 1.1 } }));
    expect(r.c_o).toBe(1.1);
    expect(r.origines.c_o).toBe('saisi');
    expect(r.q_p_h).toBeGreaterThan(0.934713);
  });
});
