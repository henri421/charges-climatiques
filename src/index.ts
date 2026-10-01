/**
 * charges-climatiques — noyau de calcul.
 *
 * Neige (EN 1991-1-3) et vent (EN 1991-1-4) sur les batiments a base
 * rectangulaire, avec profil normatif parametrable.
 */

export * from './model/index';
export * from './domaines/resultat';
export { exporterActions, FORMAT_EXPORT, type ExportActions } from './domaines/exporter';

export {
  verifierProfil,
  profilDepuisJson,
  type ProfilNormatif,
  type ValeurSourcee,
  type Origine,
} from './norms/profil';
export { ec1Recommande } from './norms/ec1-recommande';

export { verifierNeige } from './neige/verifier-neige';
export { mu1 } from './neige/formes/mu';
export { largeursDesVersants } from './neige/formes/toitures';

export { verifierVent, type OptionsVent } from './vent/verifier-vent';
export { pressionDePointe, vitesseDeReference, type ParametresPression } from './vent/pression-de-pointe';
export { bandesDeHauteur } from './vent/hauteurs-de-reference';
export { cpeInterpole, cpeParoi, cpeToiturePlate } from './vent/coefficients/exterieur';
export { natureDecoupage, parametreE } from './vent/zones/geometrie';
