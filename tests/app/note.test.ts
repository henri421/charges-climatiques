/**
 * Tests d'acceptation du lot 8.7 : la note de calcul passe sur la note
 * commune d'aedificium-ui (cartouche, sections dans l'ordre fixe, figures
 * dans la section qu'elles illustrent, pas de verdict global).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { noteDeCalculHtml, texteVisible, type ElementNote } from 'aedificium-ui';
import { ec1Recommande, verifierNeige, verifierVent } from '../../src/index';
import { aireChargeeDepuisModele, batimentDepuisModele, modeleParDefaut, siteDepuisModele, type ModeleSaisie } from '../../app/src/form';
import { HYPOTHESES, noteDuCalcul } from '../../app/src/note';
import { STYLES_TRACE } from '../../app/src/export';

const P = ec1Recommande();
const lire = (chemin: string): string => readFileSync(fileURLToPath(new URL(chemin, import.meta.url)), 'utf8');
const SAISI: ModeleSaisie = { ...modeleParDefaut(), v_b0: 26, s_k: 0.65 };
const CARTOUCHE = { projet: 'Halle de stockage', element: 'Halle A', date: '2026-10-27' };

function calculer(m: ModeleSaisie) {
  const vent = verifierVent(P, batimentDepuisModele(m), siteDepuisModele(m), { aireChargee: aireChargeeDepuisModele(m) });
  const neige = verifierNeige(P, batimentDepuisModele(m), siteDepuisModele(m));
  return { vent, neige };
}

const { vent, neige } = calculer(SAISI);
const note = noteDuCalcul(P, SAISI, vent, neige, CARTOUCHE);
const html = noteDeCalculHtml(note, STYLES_TRACE);
const titresDeBlocs = (els: ElementNote[] | undefined): string[] =>
  (els ?? []).flatMap((e) => (e.type === 'bloc' ? [e.bloc.titre] : []));
const figures = (els: ElementNote[] | undefined) => (els ?? []).filter((e) => e.type === 'figure');

describe('cartouche', () => {
  it('projet, element et date repris de la saisie', () => {
    expect(note.cartouche.projet).toBe('Halle de stockage');
    expect(note.cartouche.element).toBe('Halle A');
    expect(note.cartouche.date).toBe('2026-10-27');
  });

  it('norme et outil', () => {
    expect(note.cartouche.norme).toBe('EN 1991-1-3, EN 1991-1-4');
    expect(note.cartouche.outil).toBe('charges-climatiques');
  });

  it('element vide : les dimensions du batiment', () => {
    const n = noteDuCalcul(P, SAISI, vent, neige, { ...CARTOUCHE, element: '  ' });
    expect(n.cartouche.element).toMatch(/^Bâtiment \d/);
    expect(n.cartouche.element).toContain(' x ');
    expect(n.cartouche.element.endsWith(' m')).toBe(true);
  });

  it('le texte du cartouche est echappe', () => {
    const h = noteDeCalculHtml(noteDuCalcul(P, SAISI, vent, neige, { ...CARTOUCHE, projet: 'Halle <test>' }), STYLES_TRACE);
    expect(h).toContain('Halle &lt;test&gt;');
    expect(h).not.toContain('Halle <test>');
  });
});

describe('sections', () => {
  it('ordre fixe, sections vides omises, pas de conclusions', () => {
    const titres = [...html.matchAll(/<h2>([^<]*)<\/h2>/g)].map((x) => x[1]);
    expect(titres).toEqual(['1. Géométrie', '2. Hypothèses', '3. Cas de charges', '4. Calculs et vérifications']);
  });

  it('aucune verification, aucun verdict global', () => {
    expect(note.verifications).toEqual([]);
    const texte = texteVisible(html);
    expect(texte).not.toContain('Conforme');
    expect(texte).not.toContain('Vérification déterminante');
  });

  it('geometrie : le batiment', () => {
    expect(titresDeBlocs(note.sections.geometrie)).toEqual(['Bâtiment']);
  });

  it('hypotheses : profil actif, liste des hypotheses, rappel de l annexe nationale', () => {
    const h = note.sections.hypotheses ?? [];
    const textes = h.flatMap((e) => (e.type === 'texte' ? [e.texte] : []));
    expect(textes.some((t) => t.includes(P.nom) && t.includes(P.date))).toBe(true);
    expect(textes.some((t) => t.includes('annexe nationale'))).toBe(true);
    const listes = h.flatMap((e) => (e.type === 'liste' ? [e.items] : []));
    expect(listes).toEqual([HYPOTHESES]);
  });

  it('cas de charges : le site et la provenance des grandeurs de base', () => {
    const c = note.sections.charges ?? [];
    expect(titresDeBlocs(c)).toEqual(['Site']);
    const tableaux = c.flatMap((e) => (e.type === 'tableau' ? [e] : []));
    expect(tableaux).toHaveLength(1);
    expect(tableaux[0].entetes).toEqual(['Grandeur', 'Libellé', 'Valeur', 'Origine', 'Source']);
    // v_b, c_dir, c_season, rho, k_I, c_o, puis s_k, C_e, C_t
    expect(tableaux[0].lignes.map((l) => l[0])).toEqual(['v_b', 'c_dir', 'c_season', 'rho', 'k_I', 'c_o', 's_k', 'C_e', 'C_t']);
  });

  it('pas de materiaux ni de combinaisons', () => {
    expect(note.sections.materiaux).toBeUndefined();
    expect(note.sections.combinaisons).toBeUndefined();
  });
});

describe('calculs et verifications', () => {
  const calculs = note.sections.calculs ?? [];

  it('grandeurs de base du vent puis de la neige', () => {
    const titres = titresDeBlocs(calculs);
    expect(titres[0]).toBe('Vent, grandeurs de base');
    expect(titres).toContain('Neige, grandeurs de base');
    expect(titres.indexOf('Neige, grandeurs de base')).toBe(vent.cas.length + 1);
  });

  it('un schema par cas de vent et par cas de neige', () => {
    expect(figures(calculs)).toHaveLength(vent.cas.length + neige.cas.length);
  });

  it('chaque schema precede le bloc qu il illustre', () => {
    calculs.forEach((e, i) => {
      if (e.type !== 'figure') return;
      const suivant = calculs[i + 1];
      expect(suivant?.type).toBe('bloc');
      if (suivant?.type === 'bloc') expect(e.legende).toBe(suivant.bloc.titre);
    });
  });

  it('les cas de vent dans l ordre du calcul', () => {
    const titres = titresDeBlocs(calculs);
    expect(titres.slice(1, vent.cas.length + 1)).toEqual(vent.cas.map((c) => c.libelle));
  });

  it('debord et arret de neige en dernier', () => {
    const titres = titresDeBlocs(calculs);
    expect(titres.slice(-2)).toEqual(['Neige en débord (§6.3)', 'Arrêt de neige (§6.4)']);
  });

  it('les schemas sont dans la note imprimee', () => {
    expect((html.match(/<figure>/g) ?? []).length).toBe(vent.cas.length + neige.cas.length);
  });

  it('toutes les toitures donnent une note complete', () => {
    for (const toiture of ['plate', 'un-versant', 'deux-versants'] as const) {
      const m = { ...SAISI, toiture };
      const r = calculer(m);
      const n = noteDuCalcul(P, m, r.vent, r.neige, CARTOUCHE);
      expect(figures(n.sections.calculs)).toHaveLength(r.vent.cas.length + r.neige.cas.length);
    }
  });
});

describe('calcul impossible', () => {
  const motif = 'v_b,0 non renseignée';

  it('vent impossible : son motif a sa place, la neige complete', () => {
    const n = noteDuCalcul(P, SAISI, motif, neige, CARTOUCHE);
    const calculs = n.sections.calculs ?? [];
    const premier = calculs[0];
    expect(premier?.type).toBe('bloc');
    if (premier?.type === 'bloc') {
      expect(premier.bloc.titre).toBe('Vent');
      expect(premier.bloc.note).toBe(motif);
    }
    expect(figures(calculs)).toHaveLength(neige.cas.length);
    expect(n.avertissements?.some((a) => a.startsWith('Vent non calculé'))).toBe(true);
  });

  it('vent impossible : provenance de la neige seule', () => {
    const n = noteDuCalcul(P, SAISI, motif, neige, CARTOUCHE);
    const t = (n.sections.charges ?? []).flatMap((e) => (e.type === 'tableau' ? [e] : []));
    expect(t[0].lignes.map((l) => l[0])).toEqual(['s_k', 'C_e', 'C_t']);
  });

  it('les deux impossibles : ni schema ni tableau de provenance', () => {
    const n = noteDuCalcul(P, SAISI, motif, motif, CARTOUCHE);
    expect(figures(n.sections.calculs)).toHaveLength(0);
    expect((n.sections.charges ?? []).filter((e) => e.type === 'tableau')).toHaveLength(0);
    expect(titresDeBlocs(n.sections.calculs)).toEqual(['Vent', 'Neige']);
    expect(n.avertissements).toHaveLength(2);
  });
});

describe('cablage', () => {
  const main = lire('../../app/src/main.ts');
  const page = lire('../../app/index.html');
  const sorties = page.slice(page.indexOf('id="sorties"'), page.indexOf('</section>', page.indexOf('id="sorties"')));

  it('la note passe par noteDuCalcul et la note commune', () => {
    expect(main).toContain('noteDuCalcul(');
    expect(main).toMatch(/import \{[^}]*\bnoteDeCalculHtml\b[^}]*\} from 'aedificium-ui'/);
    expect(main).not.toMatch(/import \{[^}]*\bnoteDeCalculHtml\b[^}]*\} from '\.\/export'/);
  });

  it('champs projet et element dans les sorties, memorises', () => {
    expect(sorties).toContain('data-role="projet"');
    expect(sorties).toContain('data-role="element"');
    expect(main).toContain("'charges-climatiques:cartouche'");
  });

  it('l ancienne note locale a disparu', () => {
    const exp = lire('../../app/src/export.ts');
    expect(exp).not.toContain('function noteDeCalculHtml');
    expect(exp).not.toContain('interface NoteDeCalcul');
    expect(exp).toContain('export const STYLES_TRACE');
  });
});
