/**
 * Contenu de la note de calcul commune (`noteDeCalculHtml` d'aedificium-ui).
 *
 * Module PUR. Les actions climatiques ne verifient rien : la note n'a pas de
 * conclusions, seulement les actions caracteristiques et leur provenance.
 */

import { nombreAffiche, type ElementNote, type NoteDeCalcul } from 'aedificium-ui';
import type { ProfilNormatif, ResultatNeige, ResultatVent } from '../../src/index';
import { batimentDepuisModele, type ModeleSaisie } from './form';
import { dessinCasDeVent } from './dessin-vent';
import { chargeMaximale, dessinCasDeNeige } from './dessin-neige';
import { avertissementsDeLaNote, blocsDEntree, blocsNeige, blocsVent, lignesOrigines } from './vue';

/** Hypotheses et limites rappelees dans la note de calcul. */
export const HYPOTHESES: string[] = [
  'Bâtiment à base rectangulaire ; méthode de la pression de pointe (EN 1991-1-4 §4.5).',
  'Hauteur de référence des parois latérales, sous le vent et de la toiture : z_e = h. Pression intérieure à z_i = h.',
  'Bandes intermédiaires de la face au vent de hauteur au plus b, à z_e = leur sommet.',
  'Zonage au vent des toitures inclinées non traité dans cette version.',
  'Neige : situations durables et transitoires ; neige exceptionnelle hors périmètre.',
  "Valeurs recommandées de l'Eurocode, sauf grandeurs de base saisies ; aucune annexe nationale codée.",
];

export const AVERTISSEMENT_PROFIL =
  "Les actions climatiques dépendent de l'annexe nationale en vigueur au lieu de construction : " +
  'vérifier que le profil actif correspond au texte applicable au projet.';

const ENTETES_ORIGINES = ['Grandeur', 'Libellé', 'Valeur', 'Origine', 'Source'];

/** Nom du batiment quand l'element n'est pas renseigne. */
export function nomDuBatiment(m: ModeleSaisie): string {
  return `Bâtiment ${nombreAffiche(m.longueur, 2)} x ${nombreAffiche(m.largeur, 2)} x ${nombreAffiche(m.hauteur, 2)} m`;
}

/**
 * Note du calcul courant. Vent et neige sont independants : un calcul
 * impossible (chaine) laisse son motif a sa place, l'autre est complet.
 */
export function noteDuCalcul(
  profil: ProfilNormatif,
  m: ModeleSaisie,
  vent: ResultatVent | string,
  neige: ResultatNeige | string,
  cartouche: { projet: string; element: string; date: string }
): NoteDeCalcul {
  const [batiment, site] = blocsDEntree(m);
  const calculs: ElementNote[] = [];

  // Chaque cas suit son schema : le dessin illustre le bloc qui le suit.
  const bv = blocsVent(vent);
  calculs.push({ type: 'bloc', bloc: bv[0] });
  if (typeof vent !== 'string') {
    vent.cas.forEach((c, i) => {
      calculs.push({ type: 'figure', svg: dessinCasDeVent(c), legende: c.libelle });
      calculs.push({ type: 'bloc', bloc: bv[i + 1] });
    });
  }

  const bn = blocsNeige(neige);
  calculs.push({ type: 'bloc', bloc: bn[0] });
  if (typeof neige !== 'string') {
    const sMax = chargeMaximale(neige.cas);
    const toiture = batimentDepuisModele(m).toiture;
    neige.cas.forEach((c, i) => {
      calculs.push({ type: 'figure', svg: dessinCasDeNeige(c, toiture, sMax), legende: `${c.nom} — ${c.description}` });
      calculs.push({ type: 'bloc', bloc: bn[i + 1] });
    });
    // Debord et arret de neige.
    for (const b of bn.slice(neige.cas.length + 1)) calculs.push({ type: 'bloc', bloc: b });
  }

  const origines = lignesOrigines(
    profil,
    typeof vent === 'string' ? null : vent,
    typeof neige === 'string' ? null : neige
  );

  return {
    cartouche: {
      projet: cartouche.projet,
      element: cartouche.element.trim() === '' ? nomDuBatiment(m) : cartouche.element,
      date: cartouche.date,
      norme: 'EN 1991-1-3, EN 1991-1-4',
      outil: 'charges-climatiques',
    },
    sections: {
      geometrie: [{ type: 'bloc', bloc: batiment }],
      hypotheses: [
        { type: 'texte', texte: `Profil normatif : ${profil.nom}, données consultées le ${profil.date}. ${profil.perimetre}` },
        { type: 'liste', items: HYPOTHESES },
        { type: 'texte', texte: AVERTISSEMENT_PROFIL },
      ],
      charges: [
        { type: 'bloc', bloc: site },
        ...(origines.length === 0
          ? []
          : [{ type: 'tableau' as const, titre: 'Provenance des grandeurs de base', entetes: ENTETES_ORIGINES, lignes: origines }]),
      ],
      calculs,
    },
    verifications: [],
    avertissements: avertissementsDeLaNote(vent, neige),
  };
}
