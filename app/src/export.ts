/**
 * Les sorties : SVG autonomes, CSV, JSON et note de calcul.
 *
 * Tout ici est PUR — aucun `document`. Le telechargement vit dans
 * `aedificium-ui` (`telecharger`, `ouvrirOuTelecharger`).
 */

import { JETONS, echapper, type BlocResultat } from 'aedificium-ui';

/**
 * Styles du trace, jetons compris : un document exporte ne voit pas la
 * feuille de la page, et les jetons seuls DEFINISSENT des couleurs sans en
 * appliquer aucune — le dessin sortirait en aplat noir. Les regles de
 * peinture de `style.css` sont donc recopiees ici ; toute evolution de l'une
 * doit etre reportee dans l'autre.
 */
export const STYLES_TRACE = `${JETONS}

svg { background: var(--surface); color-scheme: light; font-family: var(--sans); }
svg .titre { fill: var(--texte); font-size: 13px; font-weight: 600; }
svg .face-titre { fill: var(--texte-faible); font-size: 11px; }
svg .face-cadre { fill: none; stroke: var(--texte); stroke-width: 1.4; }
svg .zone { stroke: var(--bordure); stroke-width: 1; }
svg .zone-pression { fill: var(--compression); fill-opacity: 0.16; }
svg .zone-depression { fill: var(--traction); fill-opacity: 0.16; }
svg .zone-double { fill: var(--neutre); fill-opacity: 0.18; }
svg .zone-texte { fill: var(--texte); font-size: 11px; text-anchor: middle; font-family: var(--mono); }
svg .zone-nom { font-weight: 700; font-family: var(--sans); font-size: 12px; }
svg .sol { stroke: var(--texte); stroke-width: 2; }
svg .vent line { stroke: var(--accent); stroke-width: 2; }
svg .vent path { fill: var(--accent); }
svg .vent text { fill: var(--accent); font-size: 12px; }
svg .charge { fill: var(--compression); fill-opacity: 0.2; stroke: var(--compression); stroke-width: 1.2; }
svg .base { stroke: var(--neutre); stroke-width: 1; }
svg .valeur { fill: var(--texte); font-size: 11px; font-family: var(--mono); }
svg .toiture { fill: none; stroke: var(--texte); stroke-width: 2.2; }
svg .mur { stroke: var(--texte); stroke-width: 4; }
svg .legende { fill: var(--texte-doux); font-size: 11px; }`;

export interface NoteDeCalcul {
  titre: string;
  date: string;
  profil: string;
  entrees: BlocResultat[];
  dessins: string[];
  resultats: BlocResultat[];
  avertissements: string[];
  hypotheses: string[];
}

const AIDE_AU_CALCUL =
  "Outil d'aide au calcul. Cet outil constate, il ne prescrit pas. Les actions climatiques " +
  "dependent de l'annexe nationale en vigueur au lieu de construction ; il appartient a " +
  "l'ingenieur de verifier que le profil actif correspond au texte applicable a son projet. " +
  "Cette note est un compte rendu, pas une justification reglementaire signee.";

const STYLE_NOTE = `
  body { margin: 0; padding: 24px 28px; background: var(--surface); color: var(--texte); font: 14px/1.5 var(--sans); }
  h1 { font-size: 1.1rem; font-weight: normal; letter-spacing: .02em; margin: 0 0 .2rem; }
  h2 { font-size: .95rem; font-weight: 600; margin: 1.6rem 0 .5rem; border-bottom: 1px solid var(--bordure); padding-bottom: .25rem; }
  h3 { font-size: .8rem; font-weight: 600; margin: 1rem 0 .35rem; }
  .date { color: var(--texte-faible); font-size: .8rem; margin: 0 0 1.2rem; }
  table { border-collapse: collapse; width: 100%; margin: .3rem 0 .6rem; }
  td { border-bottom: 1px solid var(--bordure-douce); padding: .25rem .4rem; vertical-align: top; }
  td.sym { font-family: var(--mono); width: 8rem; background: var(--surface-appui); }
  td.lib { color: var(--texte-doux); }
  td.val { font-family: var(--mono); font-variant-numeric: tabular-nums; text-align: right; white-space: nowrap; }
  .note { color: var(--texte-doux); font-size: .8rem; margin: .2rem 0 .8rem; }
  .avertissement { border-left: 3px solid var(--alerte); background: var(--alerte-fond); color: var(--alerte);
                   padding: .5rem .7rem; border-radius: var(--rayon); margin: .5rem 0; font-size: .82rem; }
  .dessin { margin: .6rem 0 1rem; page-break-inside: avoid; }
  .dessin svg { max-width: 100%; height: auto; }
  .pied { margin-top: 2rem; padding-top: .6rem; border-top: 1px solid var(--bordure); color: var(--texte-doux); font-size: .78rem; }
  ul { margin: .3rem 0 .6rem; padding-left: 1.1rem; color: var(--texte-doux); font-size: .82rem; }
  @media print { body { background: #fff; padding: 0; } h2 { page-break-after: avoid; } }
`;

function tableDuBloc(bloc: BlocResultat): string {
  const lignes = bloc.lignes
    .map(
      (l) =>
        `<tr><td class="sym">${echapper(l.symbole)}</td><td class="lib">${echapper(l.libelle)}</td><td class="val">${echapper(l.valeur)}</td></tr>`
    )
    .join('');
  const table = lignes === '' ? '' : `<table>${lignes}</table>`;
  // Le motif est rendu MEME sans ligne : c'est le cas ou il porte toute l'information.
  const note = bloc.note === null ? '' : `<p class="note">${echapper(bloc.note)}</p>`;
  return `<h3>${echapper(bloc.titre)}</h3>${table}${note}`;
}

/**
 * Note de calcul HTML autonome, imprimable en PDF. Elle porte les valeurs
 * intermediaires, le profil actif et sa date, et ne masque aucun calcul non
 * applicable.
 */
export function noteDeCalculHtml(note: NoteDeCalcul, styles: string): string {
  const avertissements = note.avertissements.map((a) => `<p class="avertissement">${echapper(a)}</p>`).join('');
  const dessins = note.dessins.map((svg) => `<div class="dessin">${svg}</div>`).join('');
  const hypotheses =
    note.hypotheses.length === 0
      ? ''
      : `<h2>Hypotheses et limites</h2><ul>${note.hypotheses.map((h) => `<li>${echapper(h)}</li>`).join('')}</ul>`;
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8" />
<title>Note de calcul — ${echapper(note.titre)}</title>
<style>${styles}${STYLE_NOTE}</style></head>
<body>
<h1>Note de calcul — actions climatiques (EN 1991-1-3, EN 1991-1-4)</h1>
<p class="date">${echapper(note.titre)} · ${echapper(note.date)} · profil : ${echapper(note.profil)}</p>
${avertissements}
<h2>Donnees d entree</h2>${note.entrees.map(tableDuBloc).join('')}
<h2>Zonage et cas de charge</h2>${dessins}
<h2>Actions caracteristiques</h2>${note.resultats.map(tableDuBloc).join('')}
${hypotheses}
<p class="pied">${AIDE_AU_CALCUL}</p>
</body></html>`;
}
