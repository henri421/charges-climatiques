/**
 * Cablage de l'interface des charges climatiques.
 *
 * Ce module ne calcule RIEN : il lit les champs, appelle le noyau, et confie
 * a `form`, `vue`, `dessin-vent`, `dessin-neige` et `export` — tous purs —
 * la lecture de la saisie et la mise en forme. Le vent et la neige sont
 * independants : l'echec de l'un (v_b,0 absente, cas hors perimetre)
 * n'empeche pas l'affichage de l'autre.
 */

import { ouvrirOuTelecharger, resultatsEnCsv, svgAutonome, telecharger, type BlocResultat } from 'aedificium-ui';
import {
  ec1Recommande,
  exporterActions,
  verifierNeige,
  verifierVent,
  type ResultatNeige,
  type ResultatVent,
} from '../../src/index';
import {
  aireChargeeDepuisModele,
  batimentDepuisModele,
  champsDepuisModele,
  modeleDepuisChamps,
  modeleParDefaut,
  siteDepuisModele,
  type ModeleSaisie,
} from './form';
import { dessinCasDeVent } from './dessin-vent';
import { chargeMaximale, dessinCasDeNeige } from './dessin-neige';
import {
  bandeauProfil,
  blocsNeige,
  blocsVent,
  messageDErreur,
  rendreAvertissements,
  rendreCasDeVent,
  rendreNeige,
  tableauOrigines,
} from './vue';
import { STYLES_TRACE, noteDeCalculHtml } from './export';
import './style.css';

/** Element attendu de la page ; son absence est une erreur de developpement. */
function exige<T extends Element>(selecteur: string): T {
  const trouve = document.querySelector(selecteur);
  if (trouve === null) throw new Error(`element absent de la page : ${selecteur}`);
  return trouve as T;
}

const PROFIL = ec1Recommande();

const formulaire = exige<HTMLFormElement>('#formulaire');
const selecteurCas = exige<HTMLSelectElement>('[data-role="cas-vent"]');
const zones = {
  profil: exige<HTMLElement>('[data-role="profil-corps"]'),
  origines: exige<HTMLElement>('[data-role="origines-corps"]'),
  erreurSaisie: exige<HTMLElement>('[data-role="erreur-saisie"]'),
  erreurVent: exige<HTMLElement>('[data-role="erreur-vent"]'),
  erreurNeige: exige<HTMLElement>('[data-role="erreur-neige"]'),
  ventAvert: exige<HTMLElement>('[data-role="vent-avertissements"]'),
  ventSchema: exige<HTMLElement>('[data-role="vent-schema"]'),
  ventCorps: exige<HTMLElement>('[data-role="vent-corps"]'),
  neigeAvert: exige<HTMLElement>('[data-role="neige-avertissements"]'),
  neigeSchemas: exige<HTMLElement>('[data-role="neige-schemas"]'),
  neigeCorps: exige<HTMLElement>('[data-role="neige-corps"]'),
};

function champs(): (HTMLInputElement | HTMLSelectElement)[] {
  return Array.from(formulaire.querySelectorAll('[data-champ]'));
}

function valeursDesChamps(): Record<string, string> {
  const valeurs: Record<string, string> = {};
  for (const el of champs()) {
    const nom = el.getAttribute('data-champ');
    if (nom === null) continue;
    valeurs[nom] = el instanceof HTMLInputElement && el.type === 'checkbox' ? (el.checked ? 'oui' : 'non') : el.value;
  }
  return valeurs;
}

function ecrireModele(modele: ModeleSaisie): void {
  const valeurs = champsDepuisModele(modele);
  for (const el of champs()) {
    const nom = el.getAttribute('data-champ');
    if (nom === null || valeurs[nom] === undefined) continue;
    if (el instanceof HTMLInputElement && el.type === 'checkbox') el.checked = valeurs[nom] === 'oui';
    else el.value = valeurs[nom];
  }
}

function ajusterLesGroupes(m: ModeleSaisie): void {
  const visibilites: Record<string, boolean> = {
    plate: m.toiture === 'plate',
    'un-versant': m.toiture === 'un-versant',
    'deux-versants': m.toiture === 'deux-versants',
    oro: m.oroMode === 'saisi',
    'face-dominante': m.piMode === 'face-dominante',
    'cs-dispense': m.csMode === 'dispense',
    'cs-saisi': m.csMode === 'saisi',
    aire: m.aireMode === 'saisie',
    ct: m.ctSaisi,
    obstacle: m.obstacle,
    adjacente: m.adjacente,
  };
  for (const [groupe, visible] of Object.entries(visibilites)) {
    exige<HTMLElement>(`[data-groupe="${groupe}"]`).hidden = !visible;
  }
}

function montrer(el: HTMLElement, message: string | null): void {
  el.textContent = message ?? '';
  el.hidden = message === null;
}

// --- Etat ---------------------------------------------------------------------

interface Etat {
  modele: ModeleSaisie;
  vent: ResultatVent | string;
  neige: ResultatNeige | string;
}

let etat: Etat | null = null;
let casChoisi = 0;

function peindreVent(vent: ResultatVent | string): void {
  if (typeof vent === 'string') {
    montrer(zones.erreurVent, vent);
    zones.ventAvert.innerHTML = '';
    zones.ventSchema.innerHTML = '';
    zones.ventCorps.innerHTML = '';
    selecteurCas.innerHTML = '';
    return;
  }
  montrer(zones.erreurVent, null);
  const avert = [...vent.avertissements];
  if (!vent.toiture.applicable) avert.unshift(vent.toiture.motif);
  zones.ventAvert.innerHTML = rendreAvertissements(avert);
  if (casChoisi >= vent.cas.length) casChoisi = 0;
  selecteurCas.innerHTML = vent.cas
    .map((c, i) => `<option value="${i}"${i === casChoisi ? ' selected' : ''}>${c.libelle.replace(/</g, '&lt;')}</option>`)
    .join('');
  const cas = vent.cas[casChoisi];
  zones.ventSchema.innerHTML = dessinCasDeVent(cas);
  zones.ventCorps.innerHTML = rendreCasDeVent(cas);
}

function peindreNeige(neige: ResultatNeige | string, modele: ModeleSaisie): void {
  if (typeof neige === 'string') {
    montrer(zones.erreurNeige, neige);
    zones.neigeAvert.innerHTML = '';
    zones.neigeSchemas.innerHTML = '';
    zones.neigeCorps.innerHTML = '';
    return;
  }
  montrer(zones.erreurNeige, null);
  zones.neigeAvert.innerHTML = rendreAvertissements(neige.avertissements);
  const sMax = chargeMaximale(neige.cas);
  const toiture = batimentDepuisModele(modele).toiture;
  zones.neigeSchemas.innerHTML = neige.cas.map((c) => dessinCasDeNeige(c, toiture, sMax)).join('');
  zones.neigeCorps.innerHTML = rendreNeige(neige);
}

/**
 * Recalcule et repeint. Une saisie illisible laisse en place le dernier
 * resultat valide, sous une erreur bien visible : effacer la page a chaque
 * frappe intermediaire rendrait la saisie illisible.
 */
function rafraichir(): void {
  const lecture = modeleDepuisChamps(valeursDesChamps());
  if (!lecture.ok) {
    montrer(zones.erreurSaisie, lecture.message);
    return;
  }
  montrer(zones.erreurSaisie, null);
  const modele = lecture.modele;
  ajusterLesGroupes(modele);
  const batiment = batimentDepuisModele(modele);
  const site = siteDepuisModele(modele);

  let vent: ResultatVent | string;
  try {
    vent = verifierVent(PROFIL, batiment, site, { aireChargee: aireChargeeDepuisModele(modele) });
  } catch (e) {
    vent = messageDErreur(e);
  }
  let neige: ResultatNeige | string;
  try {
    neige = verifierNeige(PROFIL, batiment, site);
  } catch (e) {
    neige = messageDErreur(e);
  }

  etat = { modele, vent, neige };
  zones.origines.innerHTML = tableauOrigines(
    PROFIL,
    typeof vent === 'string' ? null : vent,
    typeof neige === 'string' ? null : neige
  );
  peindreVent(vent);
  peindreNeige(neige, modele);
}

// --- Sorties --------------------------------------------------------------------

function blocsDEntree(m: ModeleSaisie): BlocResultat[] {
  const toiture =
    m.toiture === 'plate'
      ? `plate, acrotere ${m.acrotere} m`
      : m.toiture === 'un-versant'
        ? `un versant, ${m.pente} degres`
        : `deux versants, ${m.pente1} / ${m.pente2} degres`;
  return [
    {
      titre: 'Batiment',
      lignes: [
        { symbole: 'L x l x h', libelle: 'longueur x largeur x hauteur', valeur: `${m.longueur} x ${m.largeur} x ${m.hauteur} m` },
        { symbole: 'toiture', libelle: 'type de toiture', valeur: toiture },
        { symbole: 'c_pi', libelle: 'pression interieure', valeur: m.piMode === 'enveloppe' ? 'enveloppe' : `face dominante ${m.piFace}, rapport ${m.piRapport}` },
      ],
      note: null,
    },
    {
      titre: 'Site',
      lignes: [
        { symbole: 'v_b,0', libelle: 'vitesse de reference de base, saisie', valeur: m.v_b0 === null ? 'non renseignee' : `${m.v_b0} m/s` },
        { symbole: 'terrain', libelle: 'categorie de terrain', valeur: m.categorie },
        { symbole: 's_k', libelle: 'charge de neige au sol, saisie', valeur: m.s_k === null ? 'non renseignee' : `${m.s_k} kN/m2` },
        { symbole: 'altitude', libelle: 'altitude du site', valeur: `${m.altitude} m` },
        { symbole: 'topographie', libelle: 'topographie (neige)', valeur: m.topographie },
      ],
      note: null,
    },
  ];
}

const HYPOTHESES = [
  'Batiment a base rectangulaire ; methode de la pression de pointe (EN 1991-1-4 §4.5).',
  'Hauteur de reference des parois laterales, sous le vent et de la toiture : z_e = h. Pression interieure a z_i = h.',
  'Bandes intermediaires de la face au vent de hauteur au plus b, a z_e = leur sommet.',
  'Zonage au vent des toitures inclinees non traite dans cette version.',
  'Neige : situations durables et transitoires ; neige exceptionnelle hors perimetre.',
  'Valeurs recommandees de l Eurocode, sauf grandeurs de base saisies ; aucune annexe nationale codee.',
];

function sansCalcul(): void {
  montrer(zones.erreurSaisie, 'Aucun calcul a exporter : corriger la saisie, puis reessayer.');
}

function dessins(e: Etat): string[] {
  const liste: string[] = [];
  if (typeof e.vent !== 'string') liste.push(...e.vent.cas.map((c) => dessinCasDeVent(c)));
  if (typeof e.neige !== 'string') {
    const sMax = chargeMaximale(e.neige.cas);
    const toiture = batimentDepuisModele(e.modele).toiture;
    liste.push(...e.neige.cas.map((c) => dessinCasDeNeige(c, toiture, sMax)));
  }
  return liste;
}

document.addEventListener('click', (evenement) => {
  const cible = evenement.target;
  if (!(cible instanceof HTMLElement)) return;
  const action = cible.dataset.action;
  if (action === undefined || !action.startsWith('exporter-')) return;
  if (etat === null) {
    sansCalcul();
    return;
  }
  const e = etat;
  if (action === 'exporter-dessins') {
    dessins(e).forEach((svg, i) =>
      telecharger(`charges-climatiques-${String(i + 1).padStart(2, '0')}.svg`, svgAutonome(svg, STYLES_TRACE), 'image/svg+xml;charset=utf-8')
    );
  } else if (action === 'exporter-resultats') {
    telecharger(
      'charges-climatiques-resultats.csv',
      resultatsEnCsv([...blocsDEntree(e.modele), ...blocsVent(e.vent), ...blocsNeige(e.neige)]),
      'text/csv;charset=utf-8'
    );
  } else if (action === 'exporter-json') {
    telecharger(
      'charges-climatiques-actions.json',
      JSON.stringify(exporterActions({ nom: PROFIL.nom, date: PROFIL.date }, e.neige, e.vent), null, 2),
      'application/json;charset=utf-8'
    );
  } else if (action === 'exporter-note') {
    const avert = [
      ...(typeof e.vent === 'string' ? [`Vent non calcule : ${e.vent}`] : e.vent.avertissements),
      ...(typeof e.neige === 'string' ? [`Neige non calculee : ${e.neige}`] : e.neige.avertissements),
    ];
    const html = noteDeCalculHtml(
      {
        titre: `Batiment ${e.modele.longueur} x ${e.modele.largeur} x ${e.modele.hauteur} m`,
        date: new Date().toISOString().slice(0, 10),
        profil: `${PROFIL.nom} (${PROFIL.date})`,
        entrees: blocsDEntree(e.modele),
        dessins: dessins(e),
        resultats: [...blocsVent(e.vent), ...blocsNeige(e.neige)],
        avertissements: avert,
        hypotheses: HYPOTHESES,
      },
      STYLES_TRACE
    );
    ouvrirOuTelecharger('charges-climatiques-note.html', html);
  }
});

selecteurCas.addEventListener('change', () => {
  casChoisi = Number(selecteurCas.value) || 0;
  if (etat !== null) peindreVent(etat.vent);
});

zones.profil.innerHTML = bandeauProfil(PROFIL);
ecrireModele(modeleParDefaut());
formulaire.addEventListener('input', rafraichir);
formulaire.addEventListener('change', rafraichir);
rafraichir();

// Hors navigateur (tests), pas de service worker.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  void import('./pwa').then((m) => m.enregistrerServiceWorker());
}
