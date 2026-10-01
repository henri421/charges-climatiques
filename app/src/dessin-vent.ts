/**
 * Dessin du zonage d'un cas de vent : les quatre parois depliees, vues de
 * l'exterieur, et la toiture en plan dans le repere du vent.
 *
 * Module PUR : il rend une chaine SVG. Les couleurs viennent des classes,
 * peintes par `style.css` et, a l'export, par `STYLES_TRACE`.
 *
 * Choix de lecture : une zone en depression (c_pe < 0) porte la couleur de
 * traction, une zone en pression celle de compression ; les valeurs inscrites
 * sont c_pe et la pression nette w_net = w_e - w_i du cas.
 */

import { echapper, nombreFr } from 'aedificium-ui';
import type { CasDeVent, Face, Zone } from '../../src/index';

const LARGEUR_SVG = 680;
const MARGE = 24;
const ECART = 28;
const HAUT_TITRE = 34;

const ROLES: Record<string, string> = {
  'au-vent': 'au vent',
  'sous-le-vent': 'sous le vent',
  laterale: 'laterale',
  toiture: 'toiture (plan)',
};

function signe(v: number, decimales: number): string {
  const t = nombreFr(v, decimales);
  return v > 0 && t !== nombreFr(0, decimales) ? `+${t}` : t;
}

function classeZone(z: Zone): string {
  const v = z.valeurs.map((x) => x.c_pe);
  if (v.length > 1 && Math.min(...v) < 0 && Math.max(...v) > 0) return 'zone zone-double';
  return v[0] < 0 ? 'zone zone-depression' : 'zone zone-pression';
}

/** Texte de c_pe : une ou deux valeurs. */
export function texteCpe(z: Zone): string {
  return z.valeurs.map((v) => signe(v.c_pe, 2)).join(' / ');
}

/** Texte de w_net : une ou deux valeurs (kN/m2). */
export function texteWnet(z: Zone): string {
  return z.valeurs.map((v) => signe(v.w_net, 2)).join(' / ');
}

interface Cadre {
  x: number;
  y: number;
  echelle: number;
  /** Retourne l'axe vertical : y du contour croit vers le haut (parois) ou vers le bas a partir du bas (toiture). */
  hauteurFace: number;
}

function dessinerZones(face: Face, c: Cadre): string {
  return face.zones
    .map((z) => {
      const pts = z.contour.map((p) => `${(c.x + p.x * c.echelle).toFixed(1)},${(c.y + (c.hauteurFace - p.y) * c.echelle).toFixed(1)}`);
      const xs = z.contour.map((p) => p.x);
      const ys = z.contour.map((p) => p.y);
      const largeurPx = (Math.max(...xs) - Math.min(...xs)) * c.echelle;
      const hauteurPx = (Math.max(...ys) - Math.min(...ys)) * c.echelle;
      const cx = c.x + ((Math.max(...xs) + Math.min(...xs)) / 2) * c.echelle;
      const cy = c.y + (c.hauteurFace - (Math.max(...ys) + Math.min(...ys)) / 2) * c.echelle;
      const lignes: string[] = [z.nom];
      if (largeurPx >= 46 && hauteurPx >= 40) lignes.push(texteCpe(z));
      if (largeurPx >= 46 && hauteurPx >= 56) lignes.push(texteWnet(z));
      const texte =
        largeurPx >= 12 && hauteurPx >= 14
          ? `<text class="zone-texte" x="${cx.toFixed(1)}" y="${(cy - (lignes.length - 1) * 7).toFixed(1)}">${lignes
              .map((l, i) => `<tspan x="${cx.toFixed(1)}" dy="${i === 0 ? 0 : 14}"${i === 0 ? ' class="zone-nom"' : ''}>${echapper(l)}</tspan>`)
              .join('')}</text>`
          : '';
      return `<polygon class="${classeZone(z)}" points="${pts.join(' ')}"><title>${echapper(
        `Zone ${z.nom} : c_pe = ${texteCpe(z)}, w_net = ${texteWnet(z)} kN/m2`
      )}</title></polygon>${texte}`;
    })
    .join('');
}

/** SVG du cas : parois depliees en haut, toiture en plan en bas. */
export function dessinCasDeVent(cas: CasDeVent): string {
  const parois = cas.faces.filter((f) => f.role !== 'toiture');
  const toiture = cas.faces.find((f) => f.role === 'toiture');
  // Ordre de depliage : au vent, laterale, sous le vent, laterale.
  const ordre = ['au-vent', 'laterale', 'sous-le-vent', 'laterale'];
  const restantes = [...parois];
  const deplies: Face[] = [];
  for (const role of ordre) {
    const i = restantes.findIndex((f) => f.role === role);
    if (i >= 0) deplies.push(...restantes.splice(i, 1));
  }

  // Deux rangees : au vent et laterale, puis sous le vent et laterale. Sur
  // une seule rangee, une halle allongee sortirait en bandeau illisible.
  const rangees = [deplies.slice(0, 2), deplies.slice(2)].filter((r) => r.length > 0);
  const utile = LARGEUR_SVG - 2 * MARGE;
  const largeurRangee = Math.max(...rangees.map((r) => r.reduce((s, f) => s + f.largeur, 0)));
  const hauteurMax = Math.max(...deplies.map((f) => f.hauteur));
  // Une seule echelle pour tout le dessin : les proportions se lisent.
  let echelle = Math.min((utile - ECART) / largeurRangee, 150 / hauteurMax);
  if (toiture !== undefined) echelle = Math.min(echelle, utile / toiture.largeur, 260 / toiture.hauteur);

  const morceaux: string[] = [];
  let y = MARGE + HAUT_TITRE;
  for (const rangee of rangees) {
    let x = MARGE;
    const hRangee = Math.max(...rangee.map((f) => f.hauteur));
    for (const f of rangee) {
      const yFace = y + (hRangee - f.hauteur) * echelle;
      morceaux.push(
        `<g class="face"><text class="face-titre" x="${x.toFixed(1)}" y="${(y - 8).toFixed(1)}">${echapper(
          `${f.nom} · ${ROLES[f.role]}`
        )}</text>${dessinerZones(f, { x, y: yFace, echelle, hauteurFace: f.hauteur })}<rect class="face-cadre" x="${x.toFixed(1)}" y="${yFace.toFixed(1)}" width="${(f.largeur * echelle).toFixed(1)}" height="${(f.hauteur * echelle).toFixed(1)}"/></g>`
      );
      x += f.largeur * echelle + ECART;
    }
    const basRangee = y + hRangee * echelle;
    morceaux.push(`<line class="sol" x1="${MARGE}" y1="${basRangee.toFixed(1)}" x2="${(x - ECART).toFixed(1)}" y2="${basRangee.toFixed(1)}"/>`);
    y = basRangee + MARGE + HAUT_TITRE - 10;
  }
  const solY = y - HAUT_TITRE + 10 - MARGE;

  let hauteurSvg = solY + MARGE;
  if (toiture !== undefined) {
    const yToit = solY + MARGE + HAUT_TITRE;
    const xToit = MARGE;
    const wPx = toiture.largeur * echelle;
    const hPx = toiture.hauteur * echelle;
    morceaux.push(
      `<g class="face"><text class="face-titre" x="${xToit}" y="${(yToit - 10).toFixed(1)}">toiture · plan, rive au vent en bas</text>${dessinerZones(
        toiture,
        { x: xToit, y: yToit, echelle, hauteurFace: toiture.hauteur }
      )}<rect class="face-cadre" x="${xToit}" y="${yToit.toFixed(1)}" width="${wPx.toFixed(1)}" height="${hPx.toFixed(1)}"/></g>`
    );
    // Fleche du vent, sous la rive au vent.
    const fx = xToit + wPx / 2;
    const fy = yToit + hPx + 34;
    morceaux.push(
      `<g class="vent"><line x1="${fx.toFixed(1)}" y1="${fy.toFixed(1)}" x2="${fx.toFixed(1)}" y2="${(fy - 24).toFixed(1)}"/><path d="M ${(fx - 5).toFixed(1)} ${(fy - 18).toFixed(1)} L ${fx.toFixed(1)} ${(fy - 26).toFixed(1)} L ${(fx + 5).toFixed(1)} ${(fy - 18).toFixed(1)} Z"/><text x="${(fx + 10).toFixed(1)}" y="${(fy - 8).toFixed(1)}">vent</text></g>`
    );
    hauteurSvg = fy + MARGE;
  }

  const titre = `${cas.libelle} · e = ${nombreFr(cas.e, 2)} m · w_i = ${signe(cas.w_i, 3)} kN/m2`;
  return `<svg class="schema-vent" viewBox="0 0 ${LARGEUR_SVG} ${hauteurSvg.toFixed(0)}" role="img" aria-label="${echapper(
    `Zonage du vent, ${cas.libelle}`
  )}"><text class="titre" x="${MARGE}" y="${MARGE}">${echapper(titre)}</text>${morceaux.join('')}</svg>`;
}
