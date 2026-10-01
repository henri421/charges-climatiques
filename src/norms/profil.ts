/**
 * Profil normatif : les parametres que l'annexe nationale peut fixer.
 *
 * AUCUNE valeur nationale n'est codee dans le noyau. Le noyau recoit un
 * profil, exactement comme `section-uls` recoit un `NormProfile`. Le profil
 * par defaut est celui des valeurs RECOMMANDEES de l'Eurocode
 * (`ec1Recommande`), pas celui d'un pays.
 *
 * Chaque valeur porte sa source : une valeur dont la provenance est inconnue
 * BLOQUE le calcul au lieu de le traverser (`verifierProfil`).
 *
 * Unites : masse volumique en kg/m3, poids volumique en kN/m3, le reste sans
 * dimension.
 */

/** Une grandeur et le texte d'ou elle vient. */
export interface ValeurSourcee {
  valeur: number;
  /** Reference precise : norme, clause, annexe nationale. Jamais vide. */
  source: string;
}

/** Provenance d'une grandeur employee dans un calcul. */
export type Origine = 'profil' | 'saisi' | 'defaut-recommande';

export interface ProfilNormatif {
  /** Nom affiche en permanence par l'interface. */
  nom: string;
  /** Date de consultation des sources, AAAA-MM-JJ. */
  date: string;
  /** Ce que le profil couvre, et ce qu'il ne couvre pas. */
  perimetre: string;
  vent: {
    /** Coefficient de direction c_dir, EN 1991-1-4 §4.2(2). */
    c_dir: ValeurSourcee;
    /** Coefficient de saison c_season, EN 1991-1-4 §4.2(2). */
    c_season: ValeurSourcee;
    /** Masse volumique de l'air rho (kg/m3), EN 1991-1-4 §4.5(1). */
    rho: ValeurSourcee;
    /** Coefficient de turbulence k_I, EN 1991-1-4 §4.4(1). */
    k_I: ValeurSourcee;
    /** Pression interieure, enveloppe positive, EN 1991-1-4 §7.2.9(6). */
    c_pi_positif: ValeurSourcee;
    /** Pression interieure, enveloppe negative, EN 1991-1-4 §7.2.9(6). */
    c_pi_negatif: ValeurSourcee;
  };
  neige: {
    /** C_e, site battu par les vents, EN 1991-1-3 tableau 5.1. */
    C_e_battu: ValeurSourcee;
    /** C_e, site normal, EN 1991-1-3 tableau 5.1. */
    C_e_normal: ValeurSourcee;
    /** C_e, site abrite, EN 1991-1-3 tableau 5.1. */
    C_e_abrite: ValeurSourcee;
    /** Coefficient thermique C_t, EN 1991-1-3 §5.2(8). */
    C_t: ValeurSourcee;
    /** Poids volumique de la neige pour les accumulations (kN/m3), §5.3.6(1) et §6.2(2). */
    gamma_accumulation: ValeurSourcee;
    /** Poids volumique de la neige pour le debord (kN/m3), §6.3(2). */
    gamma_debord: ValeurSourcee;
    /** Bornes de mu_2 contre un obstacle, §6.2(2). */
    mu_obstacle_min: ValeurSourcee;
    mu_obstacle_max: ValeurSourcee;
    /** Bornes de mu_w contre une construction plus haute, §5.3.6(1). */
    mu_w_min: ValeurSourcee;
    mu_w_max: ValeurSourcee;
    /** Bornes de la longueur d'accumulation l_s (m), §5.3.6(1) et §6.2(2). */
    l_s_min: ValeurSourcee;
    l_s_max: ValeurSourcee;
  };
}

/**
 * Leve si une valeur du profil est inexploitable : nombre non fini, ou
 * source absente. Une valeur sans provenance ne doit jamais atteindre un
 * resultat : c'est la regle n°1 de ce depot.
 */
export function verifierProfil(profil: ProfilNormatif): void {
  if (profil.nom.trim() === '') {
    throw new Error('Le profil normatif doit porter un nom.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(profil.date)) {
    throw new Error(`La date du profil « ${profil.nom} » doit etre au format AAAA-MM-JJ.`);
  }
  for (const [famille, valeurs] of Object.entries({ vent: profil.vent, neige: profil.neige })) {
    for (const [nom, v] of Object.entries(valeurs as Record<string, ValeurSourcee>)) {
      if (v === undefined || v === null || !Number.isFinite(v.valeur)) {
        throw new Error(`Profil « ${profil.nom} » : ${famille}.${nom} n a pas de valeur numerique.`);
      }
      if (typeof v.source !== 'string' || v.source.trim() === '') {
        throw new Error(
          `Profil « ${profil.nom} » : ${famille}.${nom} n a pas de source. ` +
            'Une valeur de provenance inconnue bloque le calcul.'
        );
      }
    }
  }
}

/**
 * Lecture d'un profil national depuis son JSON. Le fichier est une DONNEE,
 * pas du code : il est valide comme tel, puis controle par `verifierProfil`.
 */
export function profilDepuisJson(texte: string): ProfilNormatif {
  let brut: unknown;
  try {
    brut = JSON.parse(texte);
  } catch {
    throw new Error('Le profil normatif n est pas un JSON valide.');
  }
  if (typeof brut !== 'object' || brut === null) {
    throw new Error('Le profil normatif doit etre un objet JSON.');
  }
  const p = brut as ProfilNormatif;
  if (typeof p.nom !== 'string' || typeof p.date !== 'string' || typeof p.perimetre !== 'string') {
    throw new Error('Le profil normatif doit porter nom, date et perimetre.');
  }
  if (typeof p.vent !== 'object' || typeof p.neige !== 'object' || p.vent === null || p.neige === null) {
    throw new Error('Le profil normatif doit porter les familles vent et neige.');
  }
  verifierProfil(p);
  return p;
}

/** Valeur strictement positive et finie, sinon erreur nommant la grandeur. */
export function exigerPositif(valeur: number, nom: string, unite: string): number {
  if (!Number.isFinite(valeur) || valeur <= 0) {
    throw new Error(`${nom} doit etre un nombre strictement positif (${unite}).`);
  }
  return valeur;
}

/** Valeur positive ou nulle et finie, sinon erreur nommant la grandeur. */
export function exigerPositifOuNul(valeur: number, nom: string, unite: string): number {
  if (!Number.isFinite(valeur) || valeur < 0) {
    throw new Error(`${nom} doit etre un nombre positif ou nul (${unite}).`);
  }
  return valeur;
}
