/**
 * Les textes affiches, en francais et en anglais. PUR.
 *
 * Deux sources :
 * - les textes de l'app (`FR`, `EN`), types : une cle oubliee en anglais ne
 *   compile pas ;
 * - les phrases du noyau (`src/`), ecrites en francais, traduites a
 *   l'affichage par `phrase`.
 *
 * ⚠ Aucun texte ne se lit au chargement d'un module : toujours `textes()` ou
 * `phrase()` AU MOMENT DU RENDU, apres `definirLangue` (main.ts).
 */

import { langueCourante, traducteur } from 'aedificium-ui';

const FR = {
  origines: { profil: 'profil', saisi: 'saisie', 'defaut-recommande': 'défaut' } as Record<string, string>,
  originesCpi: { 'face-dominante': 'face dominante', 'enveloppe-positive': 'enveloppe positive', 'enveloppe-negative': 'enveloppe négative' } as Record<string, string>,
  topographies: { 'battue-par-les-vents': 'battue-par-les-vents', normale: 'normale', abritee: 'abritee' } as Record<string, string>,
  nonApplicable: 'non applicable',
  profil: (date: string): string => ` · données consultées le ${date}`,
  origine: {
    v_b: 'vitesse de référence',
    v_bSource: 'v_b,0 saisi, x c_dir x c_season',
    c_dir: 'coefficient de direction',
    c_season: 'coefficient de saison',
    rho: "masse volumique de l'air",
    k_I: 'coefficient de turbulence',
    c_o: "coefficient d'orographie",
    c_oSaisi: 'calcul extérieur (annexe A.3)',
    c_oNegligeable: 'orographie négligeable, §4.3.3',
    s_k: 'charge de neige au sol',
    s_kSource: "carte de l'annexe nationale, saisie",
    C_e: "coefficient d'exposition",
    C_eSource: 'tableau 5.1 via le profil',
    C_t: 'coefficient thermique',
    C_tSaisi: 'justification hors outil',
    aucune: 'Aucune grandeur de base exploitable : renseigner v_b,0 et s_k.',
    entetes: ['Grandeur', 'Libellé', 'Valeur', 'Origine', 'Source'],
  },
  cas: {
    faceProfondeur: 'face au vent x profondeur',
    e: 'min(b ; 2h), §7.2.2(2)',
    c_pi: (o: string): string => `pression intérieure (${o})`,
    correlation: 'correlation',
    correlationLibelle: "faces au vent et sous le vent, force d'ensemble seulement (§7.2.2(3))",
    bandes: (n: number, liste: string): string => `Face au vent découpée en ${n} bandes (§7.2.2(1)) : ${liste}.`,
    bande: (bas: string, haut: string, z: string): string => `[${bas} ; ${haut}] m à z_e = ${z} m`,
    entetes: ['Face', 'Zone', 'A (m2)', 'z_e (m)', 'q_p (kN/m2)', 'c_pe,10', 'c_pe,1', 'c_pe', 'w_e (kN/m2)', 'w_net (kN/m2)'],
  },
  neige: {
    troncon: (x0: string, x1: string, s0: string, s1: string): string => `x ${x0} → ${x1} m : s ${s0} → ${s1}`,
    s_k: 'charge au sol, saisie',
    expoTherm: 'exposition x thermique',
    entetes: ['Cas', 'Description', 'Intermédiaires', 'Répartition (kN/m2)'],
    debord: 'Débord',
    arret: 'Arrêt de neige',
  },
  blocs: {
    vent: 'Vent',
    ventBase: 'Vent, grandeurs de base',
    q_p: 'pression de pointe à la hauteur du bâtiment',
    neige: 'Neige',
    neigeBase: 'Neige, grandeurs de base',
    chargeSol: 'charge au sol',
    debord: 'Neige en débord (§6.3)',
    arret: 'Arrêt de neige (§6.4)',
    nonApplicable: (m: string): string => `Non applicable : ${m}`,
  },
  entrees: {
    plate: (a: string): string => `plate, acrotère ${a} m`,
    unVersant: (p: string): string => `un versant, ${p} degrés`,
    deuxVersants: (p1: string, p2: string): string => `deux versants, ${p1} / ${p2} degrés`,
    batiment: 'Bâtiment',
    dimensions: 'longueur x largeur x hauteur',
    toiture: 'toiture',
    typeToiture: 'type de toiture',
    c_pi: 'pression intérieure',
    enveloppe: 'enveloppe',
    faceDominante: (f: string, r: string): string => `face dominante ${f}, rapport ${r}`,
    site: 'Site',
    v_b0: 'vitesse de référence de base, saisie',
    nonRenseignee: 'non renseignée',
    terrain: 'terrain',
    categorie: 'catégorie de terrain',
    s_k: 'charge de neige au sol, saisie',
    altitude: 'altitude',
    altitudeSite: 'altitude du site',
    topographie: 'topographie',
    topographieNeige: 'topographie (neige)',
  },
  ventNonCalcule: (m: string): string => `Vent non calculé : ${m}`,
  neigeNonCalculee: (m: string): string => `Neige non calculée : ${m}`,
  dessins: {
    roles: { 'au-vent': 'au vent', 'sous-le-vent': 'sous le vent', laterale: 'latérale', toiture: 'toiture (plan)' } as Record<string, string>,
    toiturePlan: 'toiture · plan, rive au vent en bas',
    vent: 'vent',
    zone: (nom: string, cpe: string, w: string): string => `Zone ${nom} : c_pe = ${cpe}, w_net = ${w} kN/m2`,
    zonage: (cas: string): string => `Zonage du vent, ${cas}`,
    xRive: (l: string): string => `x de 0 (rive y-) à ${l} m`,
    xObstacle: (l: string): string => `x depuis le mur ou l'obstacle, jusqu'à ${l} m`,
    legendeNeige: (l: string): string => `s en kN/m2 de projection horizontale · ${l}`,
  },
  note: {
    hypotheses: [
      'Bâtiment à base rectangulaire ; méthode de la pression de pointe (EN 1991-1-4 §4.5).',
      'Hauteur de référence des parois latérales, sous le vent et de la toiture : z_e = h. Pression intérieure à z_i = h.',
      'Bandes intermédiaires de la face au vent de hauteur au plus b, à z_e = leur sommet.',
      'Zonage au vent des toitures inclinées non traité dans cette version.',
      'Neige : situations durables et transitoires ; neige exceptionnelle hors périmètre.',
      "Valeurs recommandées de l'Eurocode, sauf grandeurs de base saisies ; aucune annexe nationale codée.",
    ],
    avertissementProfil:
      "Les actions climatiques dépendent de l'annexe nationale en vigueur au lieu de construction : " +
      'vérifier que le profil actif correspond au texte applicable au projet.',
    batiment: (l: string, b: string, h: string): string => `Bâtiment ${l} x ${b} x ${h} m`,
    profil: (nom: string, date: string, perimetre: string): string => `Profil normatif : ${nom}, données consultées le ${date}. ${perimetre}`,
    provenance: 'Provenance des grandeurs de base',
  },
  saisie: {
    libelles: {
      longueur: 'Longueur (m)',
      largeur: 'Largeur (m)',
      hauteur: 'Hauteur h (m)',
      acrotere: 'Acrotère h_p (m)',
      pente: 'Pente (degrés)',
      pente1: 'Pente du versant y- (degrés)',
      pente2: 'Pente du versant y+ (degrés)',
      pi_rapport: 'Rapport des ouvertures (-)',
      pi_abscisse: 'Abscisse des ouvertures (m)',
      cs_valeur: 'c_s c_d (-)',
      v_b0: 'v_b,0 (m/s)',
      c_o: 'c_o (-)',
      aire: 'Aire chargée (m2)',
      s_k: 's_k (kN/m2)',
      altitude: 'Altitude (m)',
      C_t: 'C_t (-)',
      obs_hauteur: "Hauteur de l'obstacle (m)",
      adj_difference: 'Différence de hauteur h (m)',
      adj_largeur: 'Largeur b_1 de la toiture haute (m)',
      adj_pente: 'Pente de la toiture haute (degrés)',
    } as Record<string, string>,
    valeurInattendue: (nom: string, x: string): string => `Valeur inattendue pour ${nom} : « ${x} ».`,
    nombreAttendu: (nom: string): string => `${nom} : nombre attendu.`,
    nombreOuVide: (nom: string): string => `${nom} : nombre attendu, ou champ vide.`,
    obstacle: 'edicule',
  },
  messages: {
    elementAbsent: (s: string): string => `element absent de la page : ${s}`,
    rienAExporter: 'Aucun calcul à exporter : corriger la saisie, puis réessayer.',
    ceSchema: 'Ce schéma (SVG)',
    nouvelleVersion: 'Une nouvelle version est disponible. Recharger maintenant ?',
  },
};

type Textes = typeof FR;

const EN: Textes = {
  origines: { profil: 'profile', saisi: 'entered', 'defaut-recommande': 'default' },
  originesCpi: { 'face-dominante': 'dominant face', 'enveloppe-positive': 'positive envelope', 'enveloppe-negative': 'negative envelope' },
  topographies: { 'battue-par-les-vents': 'windswept', normale: 'normal', abritee: 'sheltered' },
  nonApplicable: 'not applicable',
  profil: (date) => ` · data checked on ${date}`,
  origine: {
    v_b: 'basic wind velocity',
    v_bSource: 'v_b,0 entered, x c_dir x c_season',
    c_dir: 'directional factor',
    c_season: 'season factor',
    rho: 'air density',
    k_I: 'turbulence factor',
    c_o: 'orography factor',
    c_oSaisi: 'external calculation (Annex A.3)',
    c_oNegligeable: 'orography negligible, 4.3.3',
    s_k: 'characteristic snow load on the ground',
    s_kSource: 'map of the National Annex, entered',
    C_e: 'exposure coefficient',
    C_eSource: 'Table 5.1 through the profile',
    C_t: 'thermal coefficient',
    C_tSaisi: 'justification outside the tool',
    aucune: 'No usable basic quantity: enter v_b,0 and s_k.',
    entetes: ['Quantity', 'Label', 'Value', 'Origin', 'Source'],
  },
  cas: {
    faceProfondeur: 'windward face x depth',
    e: 'min(b; 2h), 7.2.2(2)',
    c_pi: (o) => `internal pressure (${o})`,
    correlation: 'correlation',
    correlationLibelle: 'windward and leeward faces, overall force only (7.2.2(3))',
    bandes: (n, liste) => `Windward face divided into ${n} strips (7.2.2(1)): ${liste}.`,
    bande: (bas, haut, z) => `[${bas}; ${haut}] m at z_e = ${z} m`,
    entetes: ['Face', 'Zone', 'A (m2)', 'z_e (m)', 'q_p (kN/m2)', 'c_pe,10', 'c_pe,1', 'c_pe', 'w_e (kN/m2)', 'w_net (kN/m2)'],
  },
  neige: {
    troncon: (x0, x1, s0, s1) => `x ${x0} → ${x1} m: s ${s0} → ${s1}`,
    s_k: 'ground load, entered',
    expoTherm: 'exposure x thermal',
    entetes: ['Case', 'Description', 'Intermediate values', 'Distribution (kN/m2)'],
    debord: 'Overhang',
    arret: 'Snow guard',
  },
  blocs: {
    vent: 'Wind',
    ventBase: 'Wind, basic quantities',
    q_p: 'peak velocity pressure at the building height',
    neige: 'Snow',
    neigeBase: 'Snow, basic quantities',
    chargeSol: 'ground load',
    debord: 'Snow overhanging the edge (6.3)',
    arret: 'Snow guard (6.4)',
    nonApplicable: (m) => `Not applicable: ${m}`,
  },
  entrees: {
    plate: (a) => `flat, parapet ${a} m`,
    unVersant: (p) => `monopitch, ${p} degrees`,
    deuxVersants: (p1, p2) => `duopitch, ${p1} / ${p2} degrees`,
    batiment: 'Building',
    dimensions: 'length x width x height',
    toiture: 'roof',
    typeToiture: 'roof type',
    c_pi: 'internal pressure',
    enveloppe: 'envelope',
    faceDominante: (f, r) => `dominant face ${f}, ratio ${r}`,
    site: 'Site',
    v_b0: 'fundamental value of the basic wind velocity, entered',
    nonRenseignee: 'not entered',
    terrain: 'terrain',
    categorie: 'terrain category',
    s_k: 'characteristic snow load on the ground, entered',
    altitude: 'altitude',
    altitudeSite: 'altitude of the site',
    topographie: 'topography',
    topographieNeige: 'topography (snow)',
  },
  ventNonCalcule: (m) => `Wind not calculated: ${m}`,
  neigeNonCalculee: (m) => `Snow not calculated: ${m}`,
  dessins: {
    roles: { 'au-vent': 'windward', 'sous-le-vent': 'leeward', laterale: 'side', toiture: 'roof (plan)' },
    toiturePlan: 'roof · plan, windward edge at the bottom',
    vent: 'wind',
    zone: (nom, cpe, w) => `Zone ${nom}: c_pe = ${cpe}, w_net = ${w} kN/m2`,
    zonage: (cas) => `Wind zoning, ${cas}`,
    xRive: (l) => `x from 0 (edge y-) to ${l} m`,
    xObstacle: (l) => `x from the wall or the obstruction, up to ${l} m`,
    legendeNeige: (l) => `s in kN/m2 on plan · ${l}`,
  },
  note: {
    hypotheses: [
      'Building with a rectangular base; peak velocity pressure method (EN 1991-1-4 4.5).',
      'Reference height of the side walls, leeward wall and roof: z_e = h. Internal pressure at z_i = h.',
      'Intermediate strips of the windward face at most b high, at z_e = their top.',
      'Wind zoning of pitched roofs not covered in this version.',
      'Snow: persistent and transient situations; exceptional snow out of scope.',
      'Recommended values of the Eurocode, except the entered basic quantities; no National Annex coded.',
    ],
    avertissementProfil:
      'Climatic actions depend on the National Annex in force at the construction site: ' +
      'check that the active profile matches the text applicable to the project.',
    batiment: (l, b, h) => `Building ${l} x ${b} x ${h} m`,
    profil: (nom, date, perimetre) => `Code profile: ${nom}, data checked on ${date}. ${perimetre}`,
    provenance: 'Origin of the basic quantities',
  },
  saisie: {
    libelles: {
      longueur: 'Length (m)',
      largeur: 'Width (m)',
      hauteur: 'Height h (m)',
      acrotere: 'Parapet h_p (m)',
      pente: 'Pitch (degrees)',
      pente1: 'Pitch of slope y- (degrees)',
      pente2: 'Pitch of slope y+ (degrees)',
      pi_rapport: 'Ratio of openings (-)',
      pi_abscisse: 'Abscissa of the openings (m)',
      cs_valeur: 'c_s c_d (-)',
      v_b0: 'v_b,0 (m/s)',
      c_o: 'c_o (-)',
      aire: 'Loaded area (m2)',
      s_k: 's_k (kN/m2)',
      altitude: 'Altitude (m)',
      C_t: 'C_t (-)',
      obs_hauteur: 'Height of the obstruction (m)',
      adj_difference: 'Difference in height h (m)',
      adj_largeur: 'Width b_1 of the upper roof (m)',
      adj_pente: 'Pitch of the upper roof (degrees)',
    },
    valeurInattendue: (nom, x) => `Unexpected value for ${nom}: “${x}”.`,
    nombreAttendu: (nom) => `${nom}: number expected.`,
    nombreOuVide: (nom) => `${nom}: number expected, or empty field.`,
    obstacle: 'plant room',
  },
  messages: {
    elementAbsent: (s) => `element missing from the page: ${s}`,
    rienAExporter: 'Nothing to export: correct the input, then try again.',
    ceSchema: 'This diagram (SVG)',
    nouvelleVersion: 'A new version is available. Reload now?',
  },
};

export function textes(): Textes {
  return langueCourante() === 'en' ? EN : FR;
}

/** Nom d'une grandeur dans les messages d'erreur du noyau. */
const GRANDEURS: Record<string, string> = {
  'La différence de hauteur h avec la construction plus haute': 'The difference in height h with the higher construction work',
  'La largeur b_1 de la toiture haute': 'The width b_1 of the upper roof',
  'La largeur b_2 de la toiture basse': 'The width b_2 of the lower roof',
  'La charge de neige en toiture s': 'The snow load on the roof s',
  'Le poids volumique de la neige gamma': 'The weight density of snow gamma',
  'La distance horizontale b au faîtage': 'The horizontal distance b to the ridge',
  'Le coefficient thermique C_t': 'The thermal coefficient C_t',
  'La charge de neige au sol s_k': 'The characteristic snow load on the ground s_k',
  'La largeur du bâtiment': 'The width of the building',
  'La longueur du bâtiment': 'The length of the building',
  'Le coefficient structural c_s c_d': 'The structural factor c_s c_d',
  'La vitesse de référence de base v_b,0': 'The fundamental value of the basic wind velocity v_b,0',
  "La hauteur d'acrotère h_p": 'The parapet height h_p',
  'La hauteur h du bâtiment': 'The height h of the building',
  "L'aire chargée": 'The loaded area',
  "Le coefficient d'orographie c_o": 'The orography factor c_o',
};
const grandeur = (nom: string): string =>
  GRANDEURS[nom] ?? nom.replace(/^La hauteur de l'obstacle « (.*) »$/, (_t, o: string) => `The height of the obstruction “${o}”`);

/** Renvoi a la norme : sans « § », « tableau » -> « Table », etc. */
const renvoi = (t: string): string =>
  t
    .replace(/§/g, '')
    .replace(/\btableaux\b/g, 'Tables')
    .replace(/\btableau\b/g, 'Table')
    .replace(/\bfigure\b/g, 'Figure')
    .replace(/\bannexes\b/g, 'Annexes')
    .replace(/\bannexe\b/g, 'Annex')
    .replace(/ et /g, ' and ')
    .replace(/ à /g, ' to ');

/** « long pan y- », « pignon x+ ». */
const face = (t: string): string => t.replace(/long pan/g, 'long side').replace(/pignon/g, 'gable').replace(/^toiture$/, 'roof');

const EXACTES: Record<string, string> = {
  'Eurocode 1, valeurs recommandées': 'Eurocode 1, recommended values',
  "Valeurs recommandées de l'EN 1991-1-3 et de l'EN 1991-1-4, sans annexe nationale. Ni s_k ni v_b,0 : ces grandeurs se saisissent.":
    'Recommended values of EN 1991-1-3 and EN 1991-1-4, without National Annex. Neither s_k nor v_b,0: these quantities are entered.',
  "saisie de l'utilisateur, justification hors outil": 'entered by the user, justification outside the tool',
  'Le coefficient thermique C_t ne peut pas dépasser 1 (EN 1991-1-3 §5.2(8)).': 'The thermal coefficient C_t cannot exceed 1 (EN 1991-1-3 5.2(8)).',
  'La pente de toiture alpha doit être comprise entre 0 et 90 degrés exclus (degrés).': 'The roof pitch alpha must lie strictly between 0 and 90 degrees (degrees).',
  "La charge de neige au sol s_k n'est pas renseignée. Elle vient de la carte de l'annexe nationale au lieu de construction : sans elle, aucune charge de neige ne peut être calculée.":
    'The characteristic snow load on the ground s_k is not entered. It comes from the map of the National Annex at the construction site: without it, no snow load can be calculated.',
  "Le §5.3.6 vise une toiture basse de faible pente : la toiture étudiée étant inclinée, le cas d'accumulation est rendu mais son domaine d'emploi est à confirmer.":
    '5.3.6 covers a lower roof of low pitch: the roof studied being pitched, the drift case is given but its field of application is to be confirmed.',
  'Débord demandé (§6.3).': 'Overhang requested (6.3).',
  'Charge nulle en rive : aucun débord.': 'Zero load at the edge: no overhang.',
  'Non demandé. Le §6.3(1) recommande de le considérer pour les sites au-dessus de 800 m.': 'Not requested. 6.3(1) recommends considering it for sites above 800 m.',
  "Aucun dispositif d'arrêt de neige déclaré.": 'No snow guard declared.',
  'Toiture plate : aucun glissement, effort sur le dispositif sans objet (§6.4).': 'Flat roof: no sliding, force on the guard not applicable (6.4).',
  'Dispositif en égout, b = largeur en plan du versant.': 'Guard at the eaves, b = plan width of the slope.',
  'Pente nulle : aucun glissement, effort sans objet.': 'Zero pitch: no sliding, force not applicable.',
  'Dispositifs en égout de chaque versant, b = largeur en plan du versant.': 'Guards at the eaves of each slope, b = plan width of the slope.',
  'Le profil normatif doit porter un nom.': 'The code profile must have a name.',
  "Le profil normatif n'est pas un JSON valide.": 'The code profile is not valid JSON.',
  'Le profil normatif doit être un objet JSON.': 'The code profile must be a JSON object.',
  'Le profil normatif doit porter nom, date et périmètre.': 'The code profile must have a name, a date and a scope.',
  'Le profil normatif doit porter les familles vent et neige.': 'The code profile must have the wind and snow families.',
  "L'aire chargée A doit être un nombre strictement positif (m2).": 'The loaded area A must be a strictly positive number (m2).',
  'Le rapport h/d doit être un nombre strictement positif (-).': 'The ratio h/d must be a strictly positive number (-).',
  'Le rapport h_p/h doit être un nombre positif ou nul (-).': 'The ratio h_p/h must be a positive number or zero (-).',
  'Rapport h_p/h hors du tableau 7.2.': 'Ratio h_p/h outside Table 7.2.',
  "Le rapport des aires d'ouvertures doit valoir au moins 2 pour qu'une face soit dominante (EN 1991-1-4 §7.2.9(5)). En deçà, choisir l'enveloppe de pression intérieure.":
    'The ratio of the areas of openings must be at least 2 for a face to be dominant (EN 1991-1-4 7.2.9(5)). Below that, choose the internal pressure envelope.',
  "Valeur saisie, calculée hors de l'outil (§6.3 ou annexes B et C).": 'Entered value, calculated outside the tool (6.3 or Annexes B and C).',
  'Surfaces parallèles > 4 x surfaces perpendiculaires : frottement au-delà de min(2b ; 4h)': 'Parallel surfaces > 4 x perpendicular surfaces: friction beyond min(2b; 4h)',
  'La hauteur h doit être un nombre strictement positif (m).': 'The height h must be a strictly positive number (m).',
  'La largeur b doit être un nombre strictement positif (m).': 'The width b must be a strictly positive number (m).',
  'La hauteur z doit être un nombre strictement positif (m).': 'The height z must be a strictly positive number (m).',
  "La vitesse de référence de base v_b,0 n'est pas renseignée. Elle vient de la carte de l'annexe nationale au lieu de construction : sans elle, aucune action du vent ne peut être calculée.":
    'The fundamental value of the basic wind velocity v_b,0 is not entered. It comes from the map of the National Annex at the construction site: without it, no wind action can be calculated.',
  'Toiture plate : zones F, G, H, I du §7.2.3.': 'Flat roof: zones F, G, H, I of 7.2.3.',
  'Toitures inclinées (tableaux 7.3 et 7.4) : zonage non implémenté dans cette version. La toiture subit bien une action du vent, à déterminer par ailleurs.':
    'Pitched roofs (Tables 7.3 and 7.4): zoning not implemented in this version. The roof does carry a wind action, to be determined elsewhere.',
  "Toiture inclinée : seules les parois verticales sont traitées, dessinées jusqu'à la hauteur h (pignons comptés en rectangle, du côté de la sécurité).":
    'Pitched roof: only the vertical walls are treated, drawn up to the height h (gables taken as rectangles, on the safe side).',
  // Neige : cas, descriptions et intermediaires.
  'Cas (i)': 'Case (i)',
  'Cas (ii)': 'Case (ii)',
  'Cas (iii)': 'Case (iii)',
  'Toiture plate, charge uniforme': 'Flat roof, uniform load',
  'Deux versants, sans accumulation': 'Duopitch, undrifted',
  'Deux versants, versant y- à demi-charge': 'Duopitch, slope y- half loaded',
  'Deux versants, versant y+ à demi-charge': 'Duopitch, slope y+ half loaded',
  'Toiture basse, cas (i)': 'Lower roof, case (i)',
  'Toiture basse, cas (ii)': 'Lower roof, case (ii)',
  'Toiture basse accolée, sans accumulation': 'Abutting lower roof, undrifted',
  'Toiture basse accolée, accumulation au pied du mur': 'Abutting lower roof, drift at the foot of the wall',
  'valeur brute de mu_2': 'raw value of mu_2',
  "coefficient au pied de l'obstacle, borné": 'coefficient at the foot of the obstruction, bounded',
  'coefficient courant': 'undrifted coefficient',
  "longueur d'accumulation": 'drift length',
  'différence de hauteur': 'difference in height',
  'largeur de la toiture haute': 'width of the upper roof',
  'largeur de la toiture basse': 'width of the lower roof',
  'valeur brute de mu_w': 'raw value of mu_w',
  'plafond de mu_w': 'upper limit of mu_w',
  'coefficient dû au vent, borné': 'coefficient due to wind, bounded',
  'coefficient dû au glissement': 'coefficient due to sliding',
  'coefficient au pied du mur': 'coefficient at the foot of the wall',
  'coefficient de forme': 'shape coefficient',
  'coefficient de forme, versant y-': 'shape coefficient, slope y-',
  'coefficient de forme, versant y+': 'shape coefficient, slope y+',
  'largeur en plan du versant y-': 'plan width of slope y-',
  'largeur en plan du versant y+': 'plan width of slope y+',
  toiture: 'roof',
};

/**
 * Traduit une phrase du noyau (motifs, origines, avertissements, erreurs).
 * En francais, la phrase sort intacte.
 */
export const phrase = traducteur(EXACTES, [
  [/^(.+) doit être un nombre strictement positif \((.+)\)\.$/, (_t, nom: string, u: string) => `${grandeur(nom)} must be a strictly positive number (${u}).`],
  [/^(.+) doit être un nombre positif ou nul \((.+)\)\.$/, (_t, nom: string, u: string) => `${grandeur(nom)} must be a positive number or zero (${u}).`],
  [/^(EN 1991-1-[34])(?::(\d{4}), valeur recommandée)?(.*)$/, (_t, n: string, an: string | undefined, r: string) => `${n}${an ? `:${an}, recommended value` : ''}${renvoi(r)}`],
  [/^Accumulation : (.*)$/, 'Drift: $1'],
  [/^Accumulation contre l'obstacle « (.*) » \(h = (.+) m\)$/, 'Drift against the obstruction “$1” (h = $2 m)'],
  [/^Toiture à un versant, alpha = (.+) degrés$/, 'Monopitch roof, alpha = $1 degrees'],
  [/^Débord, rive (.+)$/, 'Overhang, edge $1'],
  [/^Arrêt de neige, versant (.+)$/, (_t, v: string) => `Snow guard, slope ${v === 'unique' ? 'single' : v}`],
  [/^s = (.+) kN\/m2, b = (.+) m, alpha = (.+) degrés$/, 's = $1 kN/m2, b = $2 m, alpha = $3 degrees'],
  [/^La date du profil « (.*) » doit être au format AAAA-MM-JJ\.$/, 'The date of the profile “$1” must be in the format YYYY-MM-DD.'],
  [/^Profil « (.*) » : (.+) n'a pas de valeur numérique\.$/, 'Profile “$1”: $2 has no numerical value.'],
  [/^Profil « (.*) » : (.+) n'a pas de source\. Une valeur de provenance inconnue bloque le calcul\.$/, 'Profile “$1”: $2 has no source. A value of unknown origin blocks the calculation.'],
  [/^La (.+) d'une toiture à deux versants doit être comprise entre 0 et 90 degrés exclus \(degrés\)\.$/, (_t, n: string) => `The ${n.replace(/^pente du versant/, 'pitch of slope')} of a duopitch roof must lie strictly between 0 and 90 degrees (degrees).`],
  [
    /^Site à (.+) m : au-dessus de (.+) m, le §6\.3\(1\) recommande de considérer la neige en débord de rive, qui n'a pas été demandée\.$/,
    'Site at $1 m: above $2 m, 6.3(1) recommends considering snow overhanging the edge, which was not requested.',
  ],
  [
    /^h\/d = (.+) > 5 : le tableau 7\.1 ne s'applique plus, la norme renvoie aux coefficients de force \(§7\.6 à §7\.8\), hors périmètre de cet outil\.$/,
    'h/d = $1 > 5: Table 7.1 no longer applies, the standard refers to force coefficients (7.6 to 7.8), outside the scope of this tool.',
  ],
  [
    /^h_p\/h = (.+) > 0,1 : valeurs du tableau 7\.2 pour h_p\/h = 0,1 retenues, du côté de la sécurité\.$/,
    'h_p/h = $1 > 0.1: values of Table 7.2 for h_p/h = 0.1 adopted, on the safe side.',
  ],
  [/^h = (.+) m, inférieur à (.+) m : c_s c_d = 1 \(§6\.2\(1\)a\)\.$/, 'h = $1 m, less than $2 m: c_s c_d = 1 (6.2(1)a).'],
  [
    /^Ossature avec murs de contreventement, h inférieur à (.+) m et h inférieur à 4d : c_s c_d = 1 \(§6\.2\(1\)c\)\.$/,
    'Frame with structural walls, h less than $1 m and h less than 4d: c_s c_d = 1 (6.2(1)c).',
  ],
  [
    /^Aucun critère de dispense du §6\.2\(1\) n'est rempli \(h = (.+) m, d = (.+) m\)\. Le calcul de c_s c_d \(§6\.3\) est hors périmètre : saisir une valeur calculée par ailleurs\.$/,
    'No criterion of exemption of 6.2(1) is met (h = $1 m, d = $2 m). The calculation of c_s c_d (6.3) is out of scope: enter a value calculated elsewhere.',
  ],
  [
    /^Surfaces parallèles (.+) m2, inférieures ou égales à 4 x surfaces perpendiculaires (.+) m2 : frottement négligeable \(§7\.5\(3\)\)\.$/,
    'Parallel surfaces $1 m2, less than or equal to 4 x perpendicular surfaces $2 m2: friction negligible (7.5(3)).',
  ],
  [
    /^Surfaces parallèles > 4 x surfaces perpendiculaires : frottement au-delà de min\(2b ; 4h\) = (.+) m \(§7\.5\)\.$/,
    'Parallel surfaces > 4 x perpendicular surfaces: friction beyond min(2b; 4h) = $1 m (7.5).',
  ],
  [/^La hauteur z = (.+) m dépasse z_max = (.+) m : hors du domaine du §4\.3\.2\.$/, 'The height z = $1 m exceeds z_max = $2 m: outside the scope of 4.3.2.'],
  [/^L'abscisse des ouvertures \((.+) m\) sort de la face (.+)\.$/, (_t, x: string, f: string) => `The abscissa of the openings (${x} m) lies outside face ${face(f)}.`],
  [/^Face dominante inconnue : (.+)\.$/, 'Unknown dominant face: $1.'],
  [/^Vent sur (.+), c_pi = (.+)$/, (_t, f: string, c: string) => `Wind on ${face(f)}, c_pi = ${c}`],
]);
