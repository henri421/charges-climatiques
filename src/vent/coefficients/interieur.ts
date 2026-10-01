/**
 * Pression interieure, EN 1991-1-4 §7.2.9.
 *
 * Sans dimension.
 */

import type { OrigineCpi } from '../../domaines/resultat';
import type { ProfilNormatif } from '../../norms/profil';

export interface ValeurCpi {
  c_pi: number;
  origine: OrigineCpi;
}

/**
 * Sans face dominante ni coefficient d'ouverture estimable : les DEUX
 * valeurs du profil, +0,2 et -0,3 recommandees (§7.2.9(6) note 2). Le module
 * ne choisit jamais la plus defavorable : il rend les deux cas, et c'est la
 * combinaison zone par zone qui decide.
 */
export function cpiEnveloppe(profil: ProfilNormatif): ValeurCpi[] {
  return [
    { c_pi: profil.vent.c_pi_positif.valeur, origine: 'enveloppe-positive' },
    { c_pi: profil.vent.c_pi_negatif.valeur, origine: 'enveloppe-negative' },
  ];
}

/**
 * Face dominante, §7.2.9(5) : c_pi = 0,75 c_pe si l'aire des ouvertures de
 * la face vaut deux fois celle des autres faces, 0,90 c_pe a trois fois et
 * au-dela, interpolation lineaire entre les deux. `c_pe` est la valeur au
 * droit des ouvertures. Sous le rapport 2, la face n'est pas dominante : le
 * module leve au lieu de retomber sur l'enveloppe.
 */
export function cpiFaceDominante(rapport: number, c_pe: number): ValeurCpi {
  if (!Number.isFinite(rapport) || rapport < 2) {
    throw new Error(
      'Le rapport des aires d ouvertures doit valoir au moins 2 pour qu une face soit dominante ' +
        '(EN 1991-1-4 §7.2.9(5)). En deca, choisir l enveloppe de pression interieure.'
    );
  }
  const facteur = rapport >= 3 ? 0.9 : 0.75 + 0.15 * (rapport - 2);
  return { c_pi: facteur * c_pe, origine: 'face-dominante' };
}
