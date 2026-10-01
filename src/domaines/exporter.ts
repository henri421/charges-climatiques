/**
 * Export structure des actions, destine a un futur module de combinaisons
 * EN 1990.
 *
 * Unites : celles des resultats (m, m2, kN/m2, kN, kN/m), rappelees dans le
 * document lui-meme pour qu'un consommateur n'ait pas a les deviner.
 *
 * Le document porte les actions CARACTERISTIQUES, cas par cas, avec leur
 * provenance. Il ne combine rien et n'applique aucun coefficient partiel :
 * c'est le role du module de combinaisons.
 */

import type { ResultatNeige, ResultatVent } from './resultat';

/** Version du format, a incrementer a chaque changement incompatible. */
export const FORMAT_EXPORT = 'charges-climatiques/1';

export interface ExportActions {
  format: typeof FORMAT_EXPORT;
  unites: { longueur: 'm'; aire: 'm2'; pression: 'kN/m2'; force: 'kN'; chargeLineique: 'kN/m' };
  profil: { nom: string; date: string };
  neige: ResultatNeige | { nonCalcule: string };
  vent: ResultatVent | { nonCalcule: string };
}

/**
 * Assemble le document d'export. Un calcul absent n'est pas omis : il sort
 * avec son motif, comme dans les autres sorties de la suite.
 */
export function exporterActions(
  profil: { nom: string; date: string },
  neige: ResultatNeige | string,
  vent: ResultatVent | string
): ExportActions {
  return {
    format: FORMAT_EXPORT,
    unites: { longueur: 'm', aire: 'm2', pression: 'kN/m2', force: 'kN', chargeLineique: 'kN/m' },
    profil,
    neige: typeof neige === 'string' ? { nonCalcule: neige } : neige,
    vent: typeof vent === 'string' ? { nonCalcule: vent } : vent,
  };
}
