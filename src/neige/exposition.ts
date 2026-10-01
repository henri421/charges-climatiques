/**
 * Coefficients d'exposition et thermique, EN 1991-1-3 §5.2.
 *
 * Sans dimension.
 */

import type { Origine, ProfilNormatif } from '../norms/profil';
import { exigerPositif } from '../norms/profil';
import type { TopographieNeige } from '../model/site';

export interface CoefficientSource {
  valeur: number;
  origine: Origine;
  source: string;
}

/** C_e selon la topographie du site, tableau 5.1, lu dans le profil. */
export function coefficientExposition(profil: ProfilNormatif, topographie: TopographieNeige): CoefficientSource {
  const v =
    topographie === 'battue-par-les-vents'
      ? profil.neige.C_e_battu
      : topographie === 'abritee'
        ? profil.neige.C_e_abrite
        : profil.neige.C_e_normal;
  return { valeur: v.valeur, origine: 'profil', source: v.source };
}

/**
 * C_t, §5.2(8). La valeur du profil (1,0 recommandee) vaut sauf toiture
 * fortement deperditive ; une valeur reduite se justifie hors de l'outil et
 * se saisit, ce que le resultat signale.
 */
export function coefficientThermique(profil: ProfilNormatif, saisi: number | null): CoefficientSource {
  if (saisi === null) {
    return { valeur: profil.neige.C_t.valeur, origine: 'profil', source: profil.neige.C_t.source };
  }
  exigerPositif(saisi, 'Le coefficient thermique C_t', '-');
  if (saisi > 1) {
    throw new Error('Le coefficient thermique C_t ne peut pas depasser 1,0 (EN 1991-1-3 §5.2(8)).');
  }
  return { valeur: saisi, origine: 'saisi', source: 'saisie de l utilisateur, justification hors outil' };
}
