/**
 * Dessin des cas de charge de neige : coupe de la toiture et diagramme de
 * charge au-dessus, a la meme echelle verticale pour tous les cas, de sorte
 * que les cas se comparent d'un coup d'oeil.
 *
 * Module PUR : il rend une chaine SVG.
 */

import { echapper, nombreFr } from 'aedificium-ui';
import type { CasDeNeige, Toiture } from '../../src/index';
import { largeursDesVersants } from '../../src/index';

const LARGEUR_SVG = 640;
const MARGE = 28;
const HAUT_DIAGRAMME = 90;
const HAUT_TOITURE = 46;

/** Charge maximale de tous les cas, pour une echelle verticale commune (kN/m2). */
export function chargeMaximale(cas: readonly CasDeNeige[]): number {
  let max = 0;
  for (const c of cas) for (const t of c.troncons) max = Math.max(max, t.s0, t.s1);
  return max;
}

/** Profil de la toiture en coupe, de 0 a `largeur` (points en m : x horizontal, y vers le haut). */
function profilToiture(toiture: Toiture, largeur: number): Array<{ x: number; y: number }> {
  if (toiture.type === 'plate') return [{ x: 0, y: 0 }, { x: largeur, y: 0 }];
  if (toiture.type === 'un-versant') {
    return [{ x: 0, y: 0 }, { x: largeur, y: largeur * Math.tan((toiture.pente * Math.PI) / 180) }];
  }
  const [w1] = largeursDesVersants(largeur, toiture.pente1, toiture.pente2);
  return [
    { x: 0, y: 0 },
    { x: w1, y: w1 * Math.tan((toiture.pente1 * Math.PI) / 180) },
    { x: largeur, y: 0 },
  ];
}

/** SVG d'un cas de neige. */
export function dessinCasDeNeige(cas: CasDeNeige, toiture: Toiture, sMax: number): string {
  const longueur = Math.max(...cas.troncons.map((t) => t.x1));
  const ex = (LARGEUR_SVG - 2 * MARGE) / longueur;
  const ey = sMax > 0 ? HAUT_DIAGRAMME / sMax : 0;
  const yBase = MARGE + 18 + HAUT_DIAGRAMME;
  const X = (x: number): string => (MARGE + x * ex).toFixed(1);
  const Y = (s: number): string => (yBase - s * ey).toFixed(1);

  const poly = cas.troncons
    .map((t) => `<polygon class="charge" points="${X(t.x0)},${Y(0)} ${X(t.x0)},${Y(t.s0)} ${X(t.x1)},${Y(t.s1)} ${X(t.x1)},${Y(0)}"/>`)
    .join('');

  // Valeurs aux extremites des troncons, sans doublon quand deux troncons se
  // raccordent a la meme valeur.
  const etiquettes: string[] = [];
  let precedent: { x: number; s: number } | null = null;
  for (const t of cas.troncons) {
    for (const [x, s, ancre] of [
      [t.x0, t.s0, 'start'],
      [t.x1, t.s1, 'end'],
    ] as const) {
      if (precedent !== null && Math.abs(precedent.x - x) < 1e-9 && Math.abs(precedent.s - s) < 1e-9) continue;
      etiquettes.push(
        `<text class="valeur" text-anchor="${ancre}" x="${X(x)}" y="${(Number(Y(s)) - 5).toFixed(1)}">${nombreFr(s, 2)}</text>`
      );
      precedent = { x, s };
    }
  }

  let support = '';
  if (cas.repere === 'toiture') {
    const prof = profilToiture(toiture, longueur);
    const hMax = Math.max(...prof.map((p) => p.y));
    const ez = hMax > 0 ? Math.min(ex, HAUT_TOITURE / hMax) : 0;
    const pts = prof.map((p) => `${X(p.x)},${(yBase + 12 + HAUT_TOITURE - p.y * ez).toFixed(1)}`).join(' ');
    support = `<polyline class="toiture" points="${pts}"/>`;
  } else {
    support = `<line class="mur" x1="${X(0)}" y1="${(yBase - HAUT_DIAGRAMME - 10).toFixed(1)}" x2="${X(0)}" y2="${(yBase + 12 + HAUT_TOITURE).toFixed(1)}"/><line class="toiture" x1="${X(0)}" y1="${(yBase + 12 + HAUT_TOITURE).toFixed(1)}" x2="${X(longueur)}" y2="${(yBase + 12 + HAUT_TOITURE).toFixed(1)}"/>`;
  }

  const hauteur = yBase + 12 + HAUT_TOITURE + 26;
  const legende =
    cas.repere === 'toiture'
      ? `x de 0 (rive y-) a ${nombreFr(longueur, 2)} m`
      : `x depuis le mur ou l obstacle, jusqu a ${nombreFr(longueur, 2)} m`;
  return `<svg class="schema-neige" viewBox="0 0 ${LARGEUR_SVG} ${hauteur.toFixed(0)}" role="img" aria-label="${echapper(
    cas.nom
  )}"><text class="titre" x="${MARGE}" y="${MARGE}">${echapper(`${cas.nom} — ${cas.description}`)}</text>${poly}<line class="base" x1="${X(0)}" y1="${Y(0)}" x2="${X(longueur)}" y2="${Y(0)}"/>${etiquettes.join('')}${support}<text class="legende" x="${MARGE}" y="${(hauteur - 8).toFixed(1)}">${echapper(
    `s en kN/m2 de projection horizontale · ${legende}`
  )}</text></svg>`;
}
