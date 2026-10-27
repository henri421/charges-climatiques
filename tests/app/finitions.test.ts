/**
 * Tests d'acceptation de l'etape 8.2 (finitions) : notations, arrondis,
 * accents, titre, phrases types, sur le texte VISIBLE (ecran, dessins, note,
 * CSV, page). Le controle lui-meme vit dans aedificium-ui (`constatsAffichage`).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { NOMS_GRECS, blocsEnTexte, constatsAffichage, contenuBalise, noteDeCalculHtml, notationHtml, resultatsEnCsv, texteVisible } from 'aedificium-ui';
import { ec1Recommande, verifierNeige, verifierVent } from '../../src/index';
import { aireChargeeDepuisModele, batimentDepuisModele, modeleParDefaut, siteDepuisModele, type ModeleSaisie } from '../../app/src/form';
import {
  bandeauProfil,
  blocsDEntree,
  blocsNeige,
  blocsVent,
  rendreAvertissements,
  rendreCasDeVent,
  rendreNeige,
  tableauOrigines,
} from '../../app/src/vue';
import { dessinCasDeVent } from '../../app/src/dessin-vent';
import { chargeMaximale, dessinCasDeNeige } from '../../app/src/dessin-neige';
import { STYLES_TRACE } from '../../app/src/export';
import { noteDuCalcul } from '../../app/src/note';

const P = ec1Recommande();
const TITRE = 'Charges climatiques';
const lire = (chemin: string): string => readFileSync(fileURLToPath(new URL(chemin, import.meta.url)), 'utf8');
const controler = (nom: string, html: string): string[] => constatsAffichage(texteVisible(html)).map((c) => `${nom} : ${c}`);

// v_b,0 et s_k sont vides par defaut (carte nationale) : renseignes ici.
const SAISI: ModeleSaisie = { ...modeleParDefaut(), v_b0: 26, s_k: 0.65 };
const CARTOUCHE = { projet: 'Halle', element: '', date: '2026-10-24' };
const MODELES: ModeleSaisie[] = [SAISI, { ...SAISI, toiture: 'un-versant' }, { ...SAISI, toiture: 'deux-versants' }];

function sorties() {
  const ecran: string[] = [bandeauProfil(P)];
  const notes: string[] = [];
  const csv: string[] = [];
  for (const m of MODELES) {
    const batiment = batimentDepuisModele(m);
    const site = siteDepuisModele(m);
    const vent = verifierVent(P, batiment, site, { aireChargee: aireChargeeDepuisModele(m) });
    const neige = verifierNeige(P, batiment, site);
    const sMax = chargeMaximale(neige.cas);
    const dessins = [...vent.cas.map((c) => dessinCasDeVent(c)), ...neige.cas.map((c) => dessinCasDeNeige(c, batiment.toiture, sMax))];
    ecran.push(
      ...dessins,
      tableauOrigines(P, vent, neige),
      ...vent.cas.map((c) => rendreCasDeVent(c)),
      rendreNeige(neige),
      rendreAvertissements([...vent.avertissements, ...neige.avertissements])
    );
    const resultats = [...blocsVent(vent), ...blocsNeige(neige)];
    notes.push(noteDeCalculHtml(noteDuCalcul(P, m, vent, neige, CARTOUCHE), STYLES_TRACE));
    csv.push(resultatsEnCsv(blocsEnTexte([...blocsDEntree(m), ...resultats])));
  }
  // Calcul impossible : la note porte le motif a la place du resultat.
  const motif = 'v_b,0 non renseignée';
  ecran.push(tableauOrigines(P, null, null));
  notes.push(noteDeCalculHtml(noteDuCalcul(P, SAISI, motif, motif, CARTOUCHE), STYLES_TRACE));
  return { ecran, notes, csv };
}

function messageDe(f: () => unknown): string {
  try {
    f();
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
  throw new Error('une erreur etait attendue');
}

describe('texte visible : notations, arrondis, accents, phrases types', () => {
  const s = sorties();

  it('ecran et dessins', () => {
    expect(s.ecran.flatMap((h, i) => controler(`ecran ${i}`, h))).toEqual([]);
  });

  it('note de calcul', () => {
    expect(s.notes.flatMap((h, i) => controler(`note ${i}`, h))).toEqual([]);
  });

  it('page (index.html)', () => {
    expect(controler('page', lire('../../app/index.html'))).toEqual([]);
  });

  it('messages d erreur affiches (rendus par notationHtml, comme a l ecran)', () => {
    const m = modeleParDefaut();
    const messages = [
      messageDe(() => verifierVent(P, batimentDepuisModele(m), { ...siteDepuisModele(m), v_b0: null })),
      messageDe(() => verifierNeige(P, batimentDepuisModele(m), { ...siteDepuisModele(m), s_k: null })),
    ];
    expect(messages.flatMap((x) => constatsAffichage(texteVisible(notationHtml(x))))).toEqual([]);
  });

  it('CSV : texte brut, ni « _ » ni nom de lettre grecque ni balise', () => {
    for (const c of s.csv) {
      expect(c).not.toContain('_');
      expect(c).not.toMatch(NOMS_GRECS);
      expect(c).not.toContain('<');
    }
  });
});

describe('titre', () => {
  const page = lire('../../app/index.html');

  it('titre de la page sans tiret, majuscule initiale', () => {
    expect(contenuBalise(page, 'h1')).toBe(TITRE);
    expect(contenuBalise(page, 'title')?.startsWith(TITRE)).toBe(true);
  });

  it('titre en grand', () => {
    const regle = /(^|\n)h1\s*\{([^}]*)\}/.exec(lire('../../app/src/style.css'))?.[2] ?? '';
    expect(regle).toMatch(/font-size:\s*1\.75rem/);
    expect(regle).toMatch(/font-weight:\s*600/);
  });
});

describe('main.ts passe par les fonctions testees', () => {
  it('note commune et CSV', () => {
    const main = lire('../../app/src/main.ts');
    expect(main).toContain('blocsDEntree(');
    expect(main).toContain('noteDuCalcul(');
    expect(main).toContain('blocsEnTexte(');
  });
});
