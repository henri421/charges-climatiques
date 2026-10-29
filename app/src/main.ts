/**
 * Cablage de l'interface des charges climatiques.
 *
 * Ce module ne calcule RIEN : il lit les champs, appelle le noyau, et confie
 * a `form`, `vue`, `dessin-vent`, `dessin-neige` et `export` — tous purs —
 * la lecture de la saisie et la mise en forme. Le vent et la neige sont
 * independants : l'echec de l'un (v_b,0 absente, cas hors perimetre)
 * n'empeche pas l'affichage de l'autre.
 */

import {
  blocsEnTexte,
  definirLangue,
  langueDuDocument,
  noteDeCalculHtml,
  notationHtml,
  notationTexte,
  ouvrirOuTelecharger,
  resultatsEnCsv,
  svgAutonome,
  telecharger,
} from 'aedificium-ui';
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
  blocsDEntree,
  blocsNeige,
  blocsVent,
  messageDErreur,
  rendreAvertissements,
  rendreCasDeVent,
  rendreNeige,
  tableauOrigines,
} from './vue';
import { phrase, textes } from './textes';
import { noteDuCalcul } from './note';
import { STYLES_TRACE } from './export';
import './style.css';

definirLangue(langueDuDocument(document));

/** Element attendu de la page ; son absence est une erreur de developpement. */
function exige<T extends Element>(selecteur: string): T {
  const trouve = document.querySelector(selecteur);
  if (trouve === null) throw new Error(textes().messages.elementAbsent(selecteur));
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
  el.innerHTML = message === null ? '' : notationHtml(message);
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
    .map((c, i) => `<option value="${i}"${i === casChoisi ? ' selected' : ''}>${notationTexte(phrase(c.libelle)).replace(/</g, '&lt;')}</option>`)
    .join('');
  const cas = vent.cas[casChoisi];
  // Le schema affiche porte son propre bouton d'export : `dessins()` range
  // les cas de vent en tete, l'indice du cas est donc celui du dessin.
  zones.ventSchema.innerHTML = dessinCasDeVent(cas) + boutonDessin(casChoisi);
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
  // Les cas de neige suivent, dans `dessins()`, tous les cas de vent.
  const decalage = etat !== null && typeof etat.vent !== 'string' ? etat.vent.cas.length : 0;
  zones.neigeSchemas.innerHTML = neige.cas
    .map((c, i) => dessinCasDeNeige(c, toiture, sMax) + boutonDessin(decalage + i))
    .join('');
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

const CLE_CARTOUCHE = 'charges-climatiques:cartouche';

/** Cartouche saisi (projet, element). Un stockage absent ou corrompu donne du vide. */
function lireCartouche(): { projet: string; element: string } {
  const champ = (v: unknown): string => (typeof v === 'string' ? v : '');
  try {
    const brut = localStorage.getItem(CLE_CARTOUCHE);
    const lu: unknown = brut === null ? null : JSON.parse(brut);
    if (lu === null || typeof lu !== 'object') return { projet: '', element: '' };
    const objet = lu as Record<string, unknown>;
    return { projet: champ(objet.projet), element: champ(objet.element) };
  } catch {
    return { projet: '', element: '' };
  }
}

const champsCartouche = {
  projet: exige<HTMLInputElement>('[data-role="projet"]'),
  element: exige<HTMLInputElement>('[data-role="element"]'),
};

/** Enregistre la saisie ; sans stockage disponible, elle vaut pour la session. */
function enregistrerCartouche(): void {
  try {
    localStorage.setItem(
      CLE_CARTOUCHE,
      JSON.stringify({ projet: champsCartouche.projet.value, element: champsCartouche.element.value })
    );
  } catch {
    // Rien a signaler : la note reste exportable avec la saisie courante.
  }
}

function sansCalcul(): void {
  montrer(zones.erreurSaisie, textes().messages.rienAExporter);
}

/**
 * Un bouton par schema. Exporter tous les schemas d'un clic lancait autant de
 * telechargements d'affilee, et les navigateurs bloquent tous ceux qui
 * suivent le premier : un seul fichier sortait.
 */
function boutonDessin(indice: number): string {
  return `<button type="button" class="exporter-dessin" data-action="exporter-dessin" data-dessin="${indice}">${textes().messages.ceSchema}</button>`;
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
  if (action === 'exporter-dessin') {
    const i = Number(cible.dataset.dessin);
    const svg = dessins(e)[i];
    if (svg !== undefined) {
      telecharger(`charges-climatiques-${String(i + 1).padStart(2, '0')}.svg`, svgAutonome(svg, STYLES_TRACE), 'image/svg+xml;charset=utf-8');
    }
  } else if (action === 'exporter-resultats') {
    telecharger(
      'charges-climatiques-resultats.csv',
      resultatsEnCsv(blocsEnTexte([...blocsDEntree(e.modele), ...blocsVent(e.vent), ...blocsNeige(e.neige)])),
      'text/csv;charset=utf-8'
    );
  } else if (action === 'exporter-json') {
    telecharger(
      'charges-climatiques-actions.json',
      JSON.stringify(exporterActions({ nom: PROFIL.nom, date: PROFIL.date }, e.neige, e.vent), null, 2),
      'application/json;charset=utf-8'
    );
  } else if (action === 'exporter-note') {
    const html = noteDeCalculHtml(
      noteDuCalcul(PROFIL, e.modele, e.vent, e.neige, {
        projet: champsCartouche.projet.value,
        element: champsCartouche.element.value,
        date: new Date().toISOString().slice(0, 10),
      }),
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
const cartouche = lireCartouche();
champsCartouche.projet.value = cartouche.projet;
champsCartouche.element.value = cartouche.element;
exige<HTMLElement>('#sorties').addEventListener('input', enregistrerCartouche);
formulaire.addEventListener('input', rafraichir);
formulaire.addEventListener('change', rafraichir);
rafraichir();

// Hors navigateur (tests), pas de service worker.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  void import('./pwa').then((m) => m.enregistrerServiceWorker());
}
