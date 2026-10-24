/**
 * Mise en forme des nombres dans les chaines affichees du noyau.
 *
 * Le noyau n'importe pas `aedificium-ui` : ces quelques lignes recodent la
 * regle commune d'affichage (trois decimales au plus, sans zeros inutiles).
 */

/** Nombre a la francaise, virgule decimale, sans zeros de fin. */
export function nombreAffiche(valeur: number, decimalesMax = 3): string {
  if (!Number.isFinite(valeur)) return '—';
  const texte = valeur.toFixed(decimalesMax).replace('.', ',');
  const sansZeros = texte.includes(',') ? texte.replace(/,?0+$/, '') : texte;
  return sansZeros === '-0' ? '0' : sansZeros;
}
