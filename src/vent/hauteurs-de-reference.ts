/**
 * Hauteurs de reference de la paroi au vent, EN 1991-1-4 §7.2.2(1),
 * figure 7.4.
 *
 * Unites : m.
 *
 * C'est la source d'erreur la plus frequente sur les batiments elances : le
 * decoupage est CALCULE, jamais laisse a l'utilisateur, et rendu bande par
 * bande.
 */

export interface Bande {
  z_bas: number;
  z_haut: number;
  z_e: number;
}

/**
 * Decoupage de la face au vent de hauteur h et de largeur b :
 *   h <= b       : une bande, z_e = h ;
 *   b < h <= 2b  : [0 ; b] a z_e = b, [b ; h] a z_e = h ;
 *   h > 2b       : [0 ; b] a z_e = b, [h - b ; h] a z_e = h, et la partie
 *                  intermediaire en bandes a z_e = cote de leur sommet.
 *
 * CHOIX DE MODELISATION : la norme laisse libre la hauteur des bandes
 * intermediaires ; elles sont prises egales et de hauteur au plus b, ce qui
 * reste du cote de la securite (z_e = sommet de chaque bande).
 */
export function bandesDeHauteur(h: number, b: number): Bande[] {
  if (!Number.isFinite(h) || h <= 0) throw new Error('La hauteur h doit etre un nombre strictement positif (m).');
  if (!Number.isFinite(b) || b <= 0) throw new Error('La largeur b doit etre un nombre strictement positif (m).');
  if (h <= b) return [{ z_bas: 0, z_haut: h, z_e: h }];
  if (h <= 2 * b) {
    return [
      { z_bas: 0, z_haut: b, z_e: b },
      { z_bas: b, z_haut: h, z_e: h },
    ];
  }
  const bandes: Bande[] = [{ z_bas: 0, z_haut: b, z_e: b }];
  const milieu = h - 2 * b;
  const n = Math.ceil(milieu / b - 1e-9);
  const pas = milieu / n;
  for (let i = 0; i < n; i++) {
    const z_bas = b + i * pas;
    const z_haut = i === n - 1 ? h - b : b + (i + 1) * pas;
    bandes.push({ z_bas, z_haut, z_e: z_haut });
  }
  bandes.push({ z_bas: h - b, z_haut: h, z_e: h });
  return bandes;
}
