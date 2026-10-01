/**
 * Coefficient de forme mu_1, EN 1991-1-3 tableau 5.2.
 *
 * Angle en degres, resultat sans dimension.
 */

/** Palier du tableau 5.2 dont releve la pente, pour l'affichage. */
export type PalierMu1 = '0-30' | '30-60' | '60+';

export function palierMu1(alpha: number): PalierMu1 {
  if (alpha <= 30) return '0-30';
  if (alpha < 60) return '30-60';
  return '60+';
}

/**
 * mu_1(alpha) :
 *   0 <= alpha <= 30   : 0,8
 *   30 < alpha < 60    : 0,8 (60 - alpha) / 30
 *   alpha >= 60        : 0
 *
 * Avec un dispositif d'arret de neige, ou un acrotere en rive basse, la neige
 * ne glisse plus : mu_1 n'est pas reduit sous 0,8 (§5.3.3(4), §5.3.4(4)).
 * C'est la clause la plus souvent omise des toitures raides.
 */
export function mu1(alpha: number, arretDeNeige: boolean): number {
  if (!Number.isFinite(alpha) || alpha < 0 || alpha >= 90) {
    throw new Error('La pente de toiture alpha doit etre comprise entre 0 et 90 degres exclus (degres).');
  }
  if (arretDeNeige) return 0.8;
  if (alpha <= 30) return 0.8;
  if (alpha < 60) return (0.8 * (60 - alpha)) / 30;
  return 0;
}
