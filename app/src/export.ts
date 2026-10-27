/**
 * Les sorties : styles du trace SVG autonome.
 *
 * Tout ici est PUR — aucun `document`. Les SVG, CSV et la note de calcul
 * viennent d'`aedificium-ui` ; `main.ts` les cable.
 */

import { JETONS } from 'aedificium-ui';

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
