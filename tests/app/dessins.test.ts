import { describe, expect, it } from 'vitest';
import { ec1Recommande, verifierNeige, verifierVent } from '../../src/index';
import { dessinCasDeVent, texteCpe } from '../../app/src/dessin-vent';
import { chargeMaximale, dessinCasDeNeige } from '../../app/src/dessin-neige';
import { batimentCourant, siteCourant } from '../fixtures';

const P = ec1Recommande();

describe('dessin du zonage du vent', () => {
  const r = verifierVent(P, batimentCourant(), siteCourant());

  it('rend un SVG avec les quatre parois et la toiture', () => {
    const svg = dessinCasDeVent(r.cas[0]);
    expect(svg.startsWith('<svg')).toBe(true);
    for (const f of ['y- · au vent', 'y+ · sous le vent', 'x+ · laterale', 'x- · laterale', 'toiture · plan']) {
      expect(svg).toContain(f);
    }
  });

  it('chaque zone porte une info-bulle avec c_pe et w_net', () => {
    const svg = dessinCasDeVent(r.cas[0]);
    expect(svg).toContain('<title>Zone D : c_pe = +0,76');
  });

  it('une zone a deux valeurs est neutre et affiche les deux', () => {
    const I = r.cas[0].faces.find((f) => f.nom === 'toiture')?.zones.find((z) => z.nom === 'I');
    if (I === undefined) throw new Error('zone I absente');
    expect(texteCpe(I)).toBe('+0,20 / -0,20');
    expect(dessinCasDeVent(r.cas[0])).toContain('zone zone-double');
  });

  it('les depressions et les pressions portent des classes distinctes', () => {
    const svg = dessinCasDeVent(r.cas[0]);
    expect(svg).toContain('zone zone-pression');
    expect(svg).toContain('zone zone-depression');
  });

  it('aucun NaN ne traverse le dessin', () => {
    for (const c of r.cas) expect(dessinCasDeVent(c)).not.toContain('NaN');
  });
});

describe('dessin des cas de neige', () => {
  const r = verifierNeige(
    P,
    batimentCourant({ toiture: { type: 'deux-versants', pente1: 20, pente2: 35 } }),
    siteCourant({ toitureAdjacente: { face: 'y+', difference: 3, largeurHaute: 10, penteHaute: 10 } })
  );

  it('echelle commune : la charge maximale de tous les cas', () => {
    // mu_2 = 3,6667 au pied du mur : s = 3,6667 x 0,7 = 2,5667 kN/m2
    expect(chargeMaximale(r.cas)).toBeCloseTo(2.566667, 5);
  });

  it('un SVG par cas, sans NaN', () => {
    const sMax = chargeMaximale(r.cas);
    const toiture = { type: 'deux-versants', pente1: 20, pente2: 35 } as const;
    for (const c of r.cas) {
      const svg = dessinCasDeNeige(c, toiture, sMax);
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).not.toContain('NaN');
    }
  });

  it('les valeurs extremes sont inscrites', () => {
    const ii = r.cas.find((c) => c.nom === 'Toiture basse, cas (ii)');
    if (ii === undefined) throw new Error('cas absent');
    const svg = dessinCasDeNeige(ii, { type: 'plate', acrotere: 0 }, chargeMaximale(r.cas));
    expect(svg).toContain('2,57');
    expect(svg).toContain('0,56');
  });
});
