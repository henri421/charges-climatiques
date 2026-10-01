import { describe, expect, it } from 'vitest';
import { ec1Recommande, profilDepuisJson, verifierProfil, type ProfilNormatif } from '../../src/index';

function profilSansSource(): ProfilNormatif {
  const p = ec1Recommande();
  p.vent.rho = { valeur: 1.25, source: '' };
  return p;
}

describe('profil normatif', () => {
  it('le profil recommande est complet et source', () => {
    expect(() => verifierProfil(ec1Recommande())).not.toThrow();
  });

  it('porte les valeurs recommandees de l EN 1991-1-4 et de l EN 1991-1-3', () => {
    const p = ec1Recommande();
    expect(p.vent.rho.valeur).toBe(1.25);
    expect(p.vent.c_pi_positif.valeur).toBe(0.2);
    expect(p.vent.c_pi_negatif.valeur).toBe(-0.3);
    expect(p.neige.C_e_battu.valeur).toBe(0.8);
    expect(p.neige.C_e_abrite.valeur).toBe(1.2);
    expect(p.neige.gamma_accumulation.valeur).toBe(2);
  });

  it('une valeur sans provenance BLOQUE le calcul', () => {
    expect(() => verifierProfil(profilSansSource())).toThrow('n a pas de source');
  });

  it('une valeur non numerique bloque le calcul', () => {
    const p = ec1Recommande();
    p.neige.C_t = { valeur: Number.NaN, source: 'x' };
    expect(() => verifierProfil(p)).toThrow('n a pas de valeur numerique');
  });

  it('une date mal formee est refusee', () => {
    const p = ec1Recommande();
    p.date = '1er octobre';
    expect(() => verifierProfil(p)).toThrow('AAAA-MM-JJ');
  });

  it('lit un profil JSON et le controle', () => {
    const p = profilDepuisJson(JSON.stringify(ec1Recommande()));
    expect(p.nom).toBe('Eurocode 1, valeurs recommandees');
    expect(() => profilDepuisJson(JSON.stringify(profilSansSource()))).toThrow('n a pas de source');
    expect(() => profilDepuisJson('{pas du json')).toThrow('JSON valide');
    expect(() => profilDepuisJson('{"nom":"x"}')).toThrow('nom, date et perimetre');
  });
});
