import { describe, expect, it } from 'vitest';
import { FORMAT_EXPORT, ec1Recommande, exporterActions, verifierNeige } from '../../src/index';
import { batimentCourant, siteCourant } from '../fixtures';

describe('export structure vers les combinaisons EN 1990', () => {
  const P = ec1Recommande();
  const neige = verifierNeige(P, batimentCourant(), siteCourant());

  it('porte son format, ses unites et le profil', () => {
    const doc = exporterActions({ nom: P.nom, date: P.date }, neige, 'v_b,0 absente');
    expect(doc.format).toBe(FORMAT_EXPORT);
    expect(doc.unites.pression).toBe('kN/m2');
    expect(doc.profil.nom).toBe(P.nom);
  });

  it('un calcul absent sort avec son motif, jamais omis', () => {
    const doc = exporterActions({ nom: P.nom, date: P.date }, neige, 'v_b,0 absente');
    expect(doc.vent).toEqual({ nonCalcule: 'v_b,0 absente' });
    expect('cas' in doc.neige).toBe(true);
  });

  it('se serialise en JSON sans perte', () => {
    const doc = exporterActions({ nom: P.nom, date: P.date }, neige, 'x');
    expect(JSON.parse(JSON.stringify(doc))).toEqual(doc);
  });
});
