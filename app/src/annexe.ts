/**
 * Annexe nationale (lot E, audit R4) : profil de calcul selon l'annexe choisie et
 * les coefficients saisis. Module PUR.
 *
 * Le noyau ne connait aucune annexe : le profil luxembourgeois est construit ici a
 * partir du profil recommande et de `valeurLu` (aedificium-ui). Aucune valeur
 * nationale n'est codee ici : tant que l'annexe n'est pas lue, chaque valeur
 * luxembourgeoise est presumee egale a la valeur recommandee, et sa source le dit.
 * Chaque coefficient est prerempli par l'annexe et reste modifiable ; une valeur
 * changee est marquee imposee par l'utilisateur.
 */

import { nombreAffiche, valeurLu, type AnnexeNationale } from 'aedificium-ui';
import { ec1Recommande, type ProfilNormatif, type ValeurSourcee } from '../../src/index';
import { textes } from './textes';

/** Coefficients du profil vent (EN 1991-1-4). */
const VENT = ['c_dir', 'c_season', 'rho', 'k_I', 'c_pi_positif', 'c_pi_negatif'] as const;
/** Coefficients du profil neige (EN 1991-1-3). */
const NEIGE = [
  'C_e_battu',
  'C_e_normal',
  'C_e_abrite',
  'C_t',
  'gamma_accumulation',
  'gamma_debord',
  'mu_obstacle_min',
  'mu_obstacle_max',
  'mu_w_min',
  'mu_w_max',
  'l_s_min',
  'l_s_max',
] as const;

export const COEFS = [...VENT, ...NEIGE] as const;
export type CleCoef = (typeof COEFS)[number];
export type Coefs = Record<CleCoef, number>;

/** Symbole affiche de chaque coefficient, dans la note. */
export const SYMBOLES: Record<CleCoef, string> = {
  c_dir: 'c_dir',
  c_season: 'c_season',
  rho: 'rho',
  k_I: 'k_I',
  c_pi_positif: 'c_pi,+',
  c_pi_negatif: 'c_pi,-',
  C_e_battu: 'C_e,battu',
  C_e_normal: 'C_e,normal',
  C_e_abrite: 'C_e,abrite',
  C_t: 'C_t',
  gamma_accumulation: 'gamma_acc',
  gamma_debord: 'gamma_debord',
  mu_obstacle_min: 'mu_2,min',
  mu_obstacle_max: 'mu_2,max',
  mu_w_min: 'mu_w,min',
  mu_w_max: 'mu_w,max',
  l_s_min: 'l_s,min',
  l_s_max: 'l_s,max',
};

/** Partie d'Eurocode qui porte le coefficient. */
export function partieDe(cle: CleCoef): 'EN 1991-1-3' | 'EN 1991-1-4' {
  return (VENT as readonly string[]).includes(cle) ? 'EN 1991-1-4' : 'EN 1991-1-3';
}

/** Valeur sourcee d'un coefficient dans un profil. */
export function valeurDe(p: ProfilNormatif, cle: CleCoef): ValeurSourcee {
  return (VENT as readonly string[]).includes(cle)
    ? p.vent[cle as keyof ProfilNormatif['vent']]
    : p.neige[cle as keyof ProfilNormatif['neige']];
}

/** Profil dont chaque coefficient est remplace par `f(cle)` ; le reste est conserve. */
function avecValeurs(p: ProfilNormatif, f: (cle: CleCoef) => ValeurSourcee): ProfilNormatif {
  const choisir = (cles: readonly CleCoef[]): Record<string, ValeurSourcee> =>
    Object.fromEntries(cles.map((k) => [k, f(k)]));
  return {
    ...p,
    vent: choisir(VENT) as ProfilNormatif['vent'],
    neige: choisir(NEIGE) as ProfilNormatif['neige'],
  };
}

/**
 * Clause de l'Eurocode, extraite de la source recommandee : « tableau 5.1 »,
 * « 4.2(2) note 2 », « 5.3.6(1), 6.2(2) ». Les virgules remplacent « et » pour
 * que la clause se traduise sans reste de francais.
 */
export function clauseDeLaSource(source: string): string {
  const apres = source.replace(/^.*valeur recommandée,\s*/, '');
  return (apres === source ? source : apres).replace(/§/g, '').replace(/ et /g, ', ');
}

export const NOM_LU = 'Eurocode 1, Luxembourg (ILNAS AN-LU:2020, valeurs présumées)';
export const DATE_LU = '2026-11-18';
export const PERIMETRE_LU =
  'Annexe nationale luxembourgeoise AN-LU:2020 : valeurs recommandées présumées retenues, non vérifiées sur le texte de l’ILNAS. ' +
  'Ni s_k ni v_b,0 : ces grandeurs se saisissent.';

/** Profil luxembourgeois : chaque coefficient passe par `valeurLu` (presume recommande). */
export function ec1Lu(): ProfilNormatif {
  const rec = ec1Recommande();
  const p = avecValeurs(rec, (k) => {
    const recommandee = valeurDe(rec, k);
    return valeurLu(partieDe(k), k, recommandee, clauseDeLaSource(recommandee.source));
  });
  return { ...p, nom: NOM_LU, date: DATE_LU, perimetre: PERIMETRE_LU };
}

export function profilDeLAnnexe(a: AnnexeNationale): ProfilNormatif {
  return a === 'lu' ? ec1Lu() : ec1Recommande();
}

/** Valeurs des coefficients d'une annexe, pour preremplir les champs. */
export function coefsDeLAnnexe(a: AnnexeNationale): Coefs {
  const p = profilDeLAnnexe(a);
  return Object.fromEntries(COEFS.map((k) => [k, valeurDe(p, k).valeur])) as Coefs;
}

/**
 * Profil de calcul : celui de l'annexe, chaque coefficient change par l'utilisateur
 * est marque « valeur imposée par l’utilisateur ».
 */
export function profilDeCalcul(a: AnnexeNationale, coefs: Coefs): ProfilNormatif {
  const base = profilDeLAnnexe(a);
  return avecValeurs(base, (k) => {
    const b = valeurDe(base, k);
    const x = coefs[k];
    return x === b.valeur ? b : { valeur: x, source: textes().annexe.imposee(nombreAffiche(b.valeur, 4), b.source) };
  });
}
