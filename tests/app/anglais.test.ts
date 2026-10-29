/**
 * Version anglaise (lot 8.8) : page `en/index.html` de meme squelette que la
 * page francaise, et AUCUN reste de francais dans ce qui s'affiche en anglais
 * (ecran, dessins, note, CSV, messages). Le francais, lui, est couvert par
 * `finitions.test.ts`, inchange.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { blocsEnTexte, constatsAffichage, contenuBalise, definirLangue, noteDeCalculHtml, notationHtml, resultatsEnCsv, texteVisible } from 'aedificium-ui';
import { ec1Recommande, verifierNeige, verifierVent } from '../../src/index';
import {
  aireChargeeDepuisModele,
  batimentDepuisModele,
  champsDepuisModele,
  modeleDepuisChamps,
  modeleParDefaut,
  siteDepuisModele,
  type ModeleSaisie,
} from '../../app/src/form';
import {
  avertissementsDeLaNote,
  bandeauProfil,
  blocsDEntree,
  blocsNeige,
  blocsVent,
  messageDErreur,
  rendreAvertissements,
  rendreCasDeVent,
  rendreNeige,
  tableauOrigines,
} from '../../app/src/vue';
import { dessinCasDeVent } from '../../app/src/dessin-vent';
import { chargeMaximale, dessinCasDeNeige } from '../../app/src/dessin-neige';
import { STYLES_TRACE } from '../../app/src/export';
import { noteDuCalcul } from '../../app/src/note';
import { textes } from '../../app/src/textes';

const P = ec1Recommande();
const lire = (chemin: string): string => readFileSync(fileURLToPath(new URL(chemin, import.meta.url)), 'utf8');
const controler = (nom: string, html: string): string[] => constatsAffichage(texteVisible(html), { langue: 'en' }).map((c) => `${nom} : ${c}`);
/** CSV : la virgule y est le separateur, pas une virgule decimale. */
const controlerCsv = (nom: string, csv: string): string[] =>
  constatsAffichage(csv, { langue: 'en' })
    .filter((c) => !c.startsWith('virgule decimale'))
    .map((c) => `${nom} : ${c}`);

/** Squelette d'une page : les attributs que lit le script, dans l'ordre. */
function squelette(html: string): string[] {
  return [...html.matchAll(/\s(id|data-[a-z-]+|type|inputmode|accept|value)="([^"]*)"/g)].map((m) => `${m[1]}=${m[2]}`);
}

function messageDe(f: () => unknown): string {
  try {
    f();
  } catch (e) {
    return messageDErreur(e);
  }
  throw new Error('une erreur etait attendue');
}

describe('page anglaise', () => {
  const fr = lire('../../app/index.html');
  const en = lire('../../app/en/index.html');

  it('meme squelette que la page francaise', () => {
    expect(squelette(en)).toEqual(squelette(fr));
  });

  it('langue, script commun, liens entre les deux versions', () => {
    expect(en).toContain('<html lang="en">');
    expect(en).toContain('src="../src/main.ts"');
    expect(en).toMatch(/class="barre-langue" href="\.\.\/"/);
    expect(fr).toMatch(/class="barre-langue" href="en\/"/);
  });

  it('titre anglais, aucun reste de francais', () => {
    expect(contenuBalise(en, 'h1')).toBe('Climatic actions');
    expect(controler('page', en.replace(/lang="fr"[^>]*>FR</, '>'))).toEqual([]);
  });
});

describe('affichage en anglais', () => {
  beforeEach(() => definirLangue('en'));
  afterEach(() => definirLangue('fr'));

  function modeles(): ModeleSaisie[] {
    const s: ModeleSaisie = { ...modeleParDefaut(), v_b0: 26, s_k: 0.65 };
    return [
      s,
      { ...s, toiture: 'un-versant' },
      { ...s, toiture: 'deux-versants' },
      { ...s, acrotere: 1.5 },
      { ...s, hauteur: 30, largeur: 12 },
      { ...s, longueur: 80, largeur: 10, hauteur: 6 },
      { ...s, piMode: 'face-dominante', piFace: 'x-', piRapport: 3, piAbscisse: 6 },
      { ...s, csMode: 'saisi', csValeur: 0.9, oroMode: 'saisi', c_o: 1.1, aireMode: 'saisie', aire: 5 },
      { ...s, hauteur: 20, csOssature: true },
      { ...s, hauteur: 40 },
      { ...s, altitude: 1000, debord: true, arret: true, toiture: 'deux-versants' },
      { ...s, altitude: 1000, toiture: 'un-versant', arret: true },
      { ...s, arret: true },
      { ...s, topographie: 'battue-par-les-vents', ctSaisi: true, C_t: 0.9 },
      { ...s, obstacle: true, obsNom: 'plant room', obsHauteur: 1.5 },
      { ...s, adjacente: true, adjFace: 'y+' },
      { ...s, toiture: 'un-versant', adjacente: true, adjFace: 'x-' },
    ];
  }

  it('ecran, dessins, note et CSV', () => {
    const constats: string[] = [...controler('profil', bandeauProfil(P))];
    modeles().forEach((m, i) => {
      const batiment = batimentDepuisModele(m);
      const site = siteDepuisModele(m);
      let vent: ReturnType<typeof verifierVent> | string;
      let neige: ReturnType<typeof verifierNeige> | string;
      try {
        vent = verifierVent(P, batiment, site, { aireChargee: aireChargeeDepuisModele(m) });
      } catch (e) {
        vent = messageDErreur(e);
      }
      try {
        neige = verifierNeige(P, batiment, site);
      } catch (e) {
        neige = messageDErreur(e);
      }
      const ecran: string[] = [tableauOrigines(P, typeof vent === 'string' ? null : vent, typeof neige === 'string' ? null : neige)];
      if (typeof vent !== 'string') {
        ecran.push(...vent.cas.map((c) => dessinCasDeVent(c) + rendreCasDeVent(c)), rendreAvertissements([vent.toiture.motif, ...vent.avertissements]));
      } else ecran.push(notationHtml(vent));
      if (typeof neige !== 'string') {
        const sMax = chargeMaximale(neige.cas);
        ecran.push(...neige.cas.map((c) => dessinCasDeNeige(c, batiment.toiture, sMax)), rendreNeige(neige), rendreAvertissements(neige.avertissements));
      } else ecran.push(notationHtml(neige));
      ecran.push(rendreAvertissements(avertissementsDeLaNote(vent, neige)));
      constats.push(...ecran.flatMap((h, j) => controler(`cas ${i} ecran ${j}`, h)));
      constats.push(...controler(`cas ${i} note`, noteDeCalculHtml(noteDuCalcul(P, m, vent, neige, { projet: 'Hall', element: '', date: '2026-10-29' }), STYLES_TRACE)));
      constats.push(...controlerCsv(`cas ${i} csv`, resultatsEnCsv(blocsEnTexte([...blocsDEntree(m), ...blocsVent(vent), ...blocsNeige(neige)]))));
    });
    // Calcul impossible : grandeurs de base non renseignees.
    const vide = modeleParDefaut();
    const motifVent = messageDe(() => verifierVent(P, batimentDepuisModele(vide), siteDepuisModele(vide)));
    const motifNeige = messageDe(() => verifierNeige(P, batimentDepuisModele(vide), siteDepuisModele(vide)));
    constats.push(...controler('vide ecran', tableauOrigines(P, null, null) + notationHtml(motifVent) + notationHtml(motifNeige)));
    constats.push(...controler('vide note', noteDeCalculHtml(noteDuCalcul(P, vide, motifVent, motifNeige, { projet: '', element: '', date: '2026-10-29' }), STYLES_TRACE)));
    expect(constats).toEqual([]);
  });

  it('messages et erreurs', () => {
    const d: ModeleSaisie = { ...modeleParDefaut(), v_b0: 26, s_k: 0.65 };
    const champs = champsDepuisModele(d);
    const lectures = [
      modeleDepuisChamps({ ...champs, longueur: 'abc' }),
      modeleDepuisChamps({ ...champs, v_b0: 'abc' }),
      modeleDepuisChamps({ ...champs, toiture: 'voute' }),
    ];
    const vent = (m: Partial<ModeleSaisie>): string => {
      const x = { ...d, ...m };
      return messageDe(() => verifierVent(P, batimentDepuisModele(x), siteDepuisModele(x), { aireChargee: aireChargeeDepuisModele(x) }));
    };
    const neige = (m: Partial<ModeleSaisie>): string => {
      const x = { ...d, ...m };
      return messageDe(() => verifierNeige(P, batimentDepuisModele(x), siteDepuisModele(x)));
    };
    const messages = [
      ...lectures.map((l) => (l.ok ? '' : l.message)),
      vent({ longueur: 0 }),
      vent({ largeur: 0 }),
      vent({ hauteur: 0 }),
      vent({ v_b0: 0 }),
      vent({ hauteur: 250 }),
      vent({ acrotere: -1 }),
      vent({ csMode: 'saisi', csValeur: 0 }),
      vent({ oroMode: 'saisi', c_o: 0 }),
      vent({ aireMode: 'saisie', aire: 0 }),
      vent({ piMode: 'face-dominante', piRapport: 1 }),
      vent({ piMode: 'face-dominante', piAbscisse: 100 }),
      neige({ s_k: 0 }),
      neige({ ctSaisi: true, C_t: 1.2 }),
      neige({ ctSaisi: true, C_t: 0 }),
      neige({ toiture: 'un-versant', pente: 95 }),
      neige({ toiture: 'deux-versants', pente1: 95 }),
      neige({ toiture: 'deux-versants', pente2: 95 }),
      neige({ obstacle: true, obsHauteur: 0 }),
      neige({ adjacente: true, adjDifference: 0 }),
      neige({ adjacente: true, adjLargeur: -1 }),
      messageDErreur(new Error('')),
      textes().messages.rienAExporter,
      textes().messages.nouvelleVersion,
      textes().messages.ceSchema,
      textes().messages.elementAbsent('#x'),
    ];
    expect(messages.flatMap((m, i) => controler(`message ${i}`, notationHtml(m)))).toEqual([]);
  });
});
