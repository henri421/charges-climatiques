import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JETONS, valeursDesJetons } from 'aedificium-ui';
import { ec1Recommande, verifierNeige, verifierVent } from '../../src/index';
import { blocsNeige, blocsVent, lignesZones, rendreCasDeVent, rendreNeige, tableauOrigines } from '../../app/src/vue';
import { STYLES_TRACE, noteDeCalculHtml } from '../../app/src/export';
import { batimentCourant, siteCourant } from '../fixtures';

const P = ec1Recommande();
const vent = verifierVent(P, batimentCourant(), siteCourant());
const neige = verifierNeige(P, batimentCourant(), siteCourant({ arretDeNeige: true }));

describe('vues', () => {
  it('une ligne par zone et par valeur : la zone I en donne deux', () => {
    const lignes = lignesZones(vent.cas[0]);
    expect(lignes.filter((l) => l[1].startsWith('I'))).toHaveLength(2);
    // D, E, A, B, A, B, F, G, F, H, I(+), I(-) = 12
    expect(lignes).toHaveLength(12);
  });

  it('le tableau d un cas porte le frottement non applicable et son motif', () => {
    const html = rendreCasDeVent(vent.cas[0]);
    expect(html).toContain('non applicable');
    expect(html).toContain('negligeable');
  });

  it('les provenances distinguent saisie et profil', () => {
    const html = tableauOrigines(P, vent, neige);
    expect(html).toContain('origine-saisie');
    expect(html).toContain('origine-profil');
  });

  it('sans aucun calcul, le tableau des provenances le dit', () => {
    expect(tableauOrigines(P, null, null)).toContain('renseigner v_b,0 et s_k');
  });

  it('la neige montre l arret de neige non applicable sur toiture plate', () => {
    expect(rendreNeige(neige)).toContain('Toiture plate');
  });
});

describe('blocs de sortie', () => {
  it('un calcul absent sort avec son motif', () => {
    expect(blocsVent('v_b,0 absente')).toEqual([{ titre: 'Vent', lignes: [], note: 'v_b,0 absente' }]);
  });

  it('un bloc par cas de vent, apres les grandeurs de base', () => {
    expect(blocsVent(vent)).toHaveLength(1 + vent.cas.length);
  });

  it('les charges en rive non applicables restent presentes avec leur motif', () => {
    const blocs = blocsNeige(neige);
    const debord = blocs.find((b) => b.titre.startsWith('Neige en debord'));
    expect(debord?.note).toContain('Non applicable');
  });
});

describe('export', () => {
  it('le :root de style.css concorde avec les jetons communs', () => {
    const css = readFileSync(fileURLToPath(new URL('../../app/src/style.css', import.meta.url)), 'utf8');
    const page = valeursDesJetons(css);
    for (const [nom, valeur] of valeursDesJetons(JETONS)) expect(page.get(nom)).toBe(valeur);
  });

  it('STYLES_TRACE porte les regles de peinture des zones', () => {
    expect(STYLES_TRACE).toContain('svg .zone-depression');
    expect(STYLES_TRACE).toContain('svg .charge');
  });

  it('la note porte le profil, les dessins et echappe le texte', () => {
    const html = noteDeCalculHtml(
      {
        titre: 'Halle <test>',
        date: '2026-10-01',
        profil: P.nom,
        entrees: [],
        dessins: ['<svg></svg>'],
        resultats: blocsVent(vent),
        avertissements: ['attention'],
        hypotheses: ['h1'],
      },
      STYLES_TRACE
    );
    expect(html).toContain('Halle &lt;test&gt;');
    expect(html).toContain(P.nom);
    expect(html).toContain('<div class="dessin"><svg></svg></div>');
    expect(html).toContain('constate, il ne prescrit pas');
  });
});
