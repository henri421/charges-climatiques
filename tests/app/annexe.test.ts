/**
 * Tests d'acceptation du lot E (audit R4) : annexe nationale luxembourgeoise,
 * coefficients prerempli et modifiables, sources AN-LU, note qui montre l'annexe.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { constatsAffichage, definirLangue, noteDeCalculHtml, texteVisible } from 'aedificium-ui';
import { ec1Recommande, verifierNeige, verifierVent } from '../../src/index';
import { COEFS, coefsDeLAnnexe, ec1Lu, profilDeCalcul, profilDeLAnnexe, valeurDe } from '../../app/src/annexe';
import {
  aireChargeeDepuisModele,
  batimentDepuisModele,
  champsDepuisModele,
  modeleDepuisChamps,
  modeleParDefaut,
  siteDepuisModele,
  type ModeleSaisie,
} from '../../app/src/form';
import { noteDuCalcul } from '../../app/src/note';
import { phrase } from '../../app/src/textes';

const SOURCE_LU = /^ILNAS-EN 1991-1-[34]\/AN-LU:2020, [^§]+ : valeur recommandée présumée retenue, non vérifiée sur l’annexe$/;

/** Modele avec les grandeurs de base saisies (sans elles, rien ne se calcule). */
function modeleDeBase(): ModeleSaisie {
  return { ...modeleParDefaut(), v_b0: 26, s_k: 0.65 };
}

/** Note complete pour une annexe donnee, coefficients recommandes ou luxembourgeois. */
function noteAvec(annexe: 'recommande' | 'lu') {
  const coefs = coefsDeLAnnexe(annexe);
  const m: ModeleSaisie = { ...modeleDeBase(), annexe, coefs };
  const p = profilDeCalcul(annexe, coefs);
  const vent = verifierVent(p, batimentDepuisModele(m), siteDepuisModele(m), { aireChargee: aireChargeeDepuisModele(m) });
  const neige = verifierNeige(p, batimentDepuisModele(m), siteDepuisModele(m));
  return noteDuCalcul(p, m, vent, neige, { projet: 'P', element: 'E', date: '2026-11-18' });
}

describe('profil luxembourgeois', () => {
  it('chaque coefficient est presume egal a la valeur recommandee, avec sa source AN-LU', () => {
    const lu = ec1Lu();
    const rec = ec1Recommande();
    expect(lu.nom).toMatch(/Luxembourg/);
    for (const k of COEFS) {
      expect(valeurDe(lu, k).valeur, k).toBe(valeurDe(rec, k).valeur);
      expect(valeurDe(lu, k).source, k).toMatch(SOURCE_LU);
      expect(valeurDe(lu, k).source, k).not.toMatch(/§| et /);
    }
  });

  it('les clauses reprennent celles de la source recommandee', () => {
    expect(valeurDe(ec1Lu(), 'C_e_normal').source).toContain('tableau 5.1');
    expect(valeurDe(ec1Lu(), 'c_dir').source).toContain('ILNAS-EN 1991-1-4/AN-LU:2020, 4.2(2) note 2');
    expect(valeurDe(ec1Lu(), 'l_s_min').source).toContain('5.3.6(1) note 2, 6.2(2)');
  });
});

describe('valeurs recommandees inchangees', () => {
  it('profil recommande et profil de calcul recommande = ec1Recommande', () => {
    expect(profilDeLAnnexe('recommande')).toEqual(ec1Recommande());
    expect(profilDeCalcul('recommande', coefsDeLAnnexe('recommande'))).toEqual(ec1Recommande());
  });

  it('defaut : annexe recommandee, coefficients recommandes', () => {
    const m = modeleParDefaut();
    expect(m.annexe).toBe('recommande');
    expect(m.coefs).toEqual(coefsDeLAnnexe('recommande'));
  });
});

describe('valeur changee par l utilisateur', () => {
  it('marquee imposee, les autres gardent la source de l annexe', () => {
    const coefs = { ...coefsDeLAnnexe('lu'), C_t: 0.9 };
    const p = profilDeCalcul('lu', coefs);
    expect(p.neige.C_t.valeur).toBe(0.9);
    expect(p.neige.C_t.source).toMatch(/valeur imposée par l’utilisateur/);
    expect(valeurDe(p, 'C_e_normal')).toEqual(valeurDe(ec1Lu(), 'C_e_normal'));
  });
});

describe('saisie', () => {
  it('annexe et coefficients enregistres, puis relus a l identique', () => {
    const m: ModeleSaisie = { ...modeleDeBase(), annexe: 'lu', coefs: { ...coefsDeLAnnexe('lu'), C_t: 0.9 } };
    const champs = champsDepuisModele(m);
    expect(champs['annexe']).toBe('lu');
    expect(champs['coef_C_t']).toBe('0,9');
    const lecture = modeleDepuisChamps(champs);
    expect(lecture.ok).toBe(true);
    if (lecture.ok) {
      expect(lecture.modele.annexe).toBe('lu');
      expect(lecture.modele.coefs).toEqual(m.coefs);
    }
  });

  it('ancien fichier sans annexe ni coefficients : valeurs recommandees', () => {
    const anciens = Object.fromEntries(Object.entries(champsDepuisModele(modeleDeBase())).filter(([c]) => c !== 'annexe' && !c.startsWith('coef_')));
    const lecture = modeleDepuisChamps(anciens);
    expect(lecture.ok).toBe(true);
    if (lecture.ok) {
      expect(lecture.modele.annexe).toBe('recommande');
      expect(lecture.modele.coefs).toEqual(coefsDeLAnnexe('recommande'));
    }
  });

  it('coefficient illisible : refus nommant son symbole', () => {
    const lecture = modeleDepuisChamps({ ...champsDepuisModele(modeleDeBase()), coef_c_dir: 'abc' });
    expect(lecture.ok).toBe(false);
    if (!lecture.ok) expect(lecture.message).toContain('c_dir');
  });
});

describe('note de calcul', () => {
  it('Luxembourg : avertissement en tete, normes AN-LU, coefficients et sources', () => {
    const note = noteAvec('lu');
    expect(note.avertissements?.[0]).toMatch(/^Annexe nationale luxembourgeoise/);
    expect(note.cartouche.norme).toContain('ILNAS-EN 1991-1-3/AN-LU:2020');
    expect(note.cartouche.norme).toContain('ILNAS-EN 1991-1-4/AN-LU:2020');
    const texte = texteVisible(noteDeCalculHtml(note, ''));
    expect(texte).toContain('Luxembourg');
    expect(texte).toContain('ILNAS-EN 1991-1-3/AN-LU:2020, tableau 5.1');
    expect(texte).toContain("coefficient d'exposition, site normal");
  });

  it('valeurs recommandees : aucun renvoi a l annexe luxembourgeoise', () => {
    const note = noteAvec('recommande');
    expect(note.avertissements?.some((a) => a.includes('luxembourgeoise'))).toBe(false);
    expect(note.cartouche.norme).toBe('EN 1991-1-3, EN 1991-1-4');
    expect(texteVisible(noteDeCalculHtml(note, ''))).not.toContain('AN-LU');
  });

  describe('en anglais', () => {
    beforeEach(() => definirLangue('en'));
    afterEach(() => definirLangue('fr'));

    it('note Luxembourg sans reste de francais, nom du profil traduit', () => {
      expect(phrase(ec1Lu().nom)).toBe('Eurocode 1, Luxembourg (ILNAS AN-LU:2020, presumed values)');
      const texte = texteVisible(noteDeCalculHtml(noteAvec('lu'), ''));
      expect(texte).toContain('Luxembourg National Annex');
      expect(texte).toContain('directional factor');
      expect(constatsAffichage(texte, { langue: 'en' })).toEqual([]);
    });
  });
});
