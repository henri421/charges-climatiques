/**
 * Mise en forme des resultats : tableaux HTML de la page, et blocs communs
 * aux sorties CSV et a la note de calcul.
 *
 * Module PUR. Unites affichees : m, m2, m/s, kN/m2, kN, kN/m.
 */

import { echapper, nombreFr, type BlocResultat, type LigneResultat } from 'aedificium-ui';
import type { CasDeVent, Origine, ProfilNormatif, ResultatNeige, ResultatVent } from '../../src/index';
import { texteCpe, texteWnet } from './dessin-vent';

const ORIGINES: Record<Origine, string> = {
  profil: 'profil',
  saisi: 'saisie',
  'defaut-recommande': 'defaut',
};

/** Message d'une erreur du noyau, pour la banniere. */
export function messageDErreur(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function ligne(symbole: string, libelle: string, valeur: string): LigneResultat {
  return { symbole, libelle, valeur };
}

/** Bandeau permanent du profil actif. */
export function bandeauProfil(profil: ProfilNormatif): string {
  return `<p class="profil-nom"><strong>${echapper(profil.nom)}</strong> · donnees consultees le ${echapper(
    profil.date
  )}</p><p class="profil-perimetre">${echapper(profil.perimetre)}</p>`;
}

/** Tableau des provenances : chaque grandeur de base et d'ou elle vient. */
export function tableauOrigines(profil: ProfilNormatif, vent: ResultatVent | null, neige: ResultatNeige | null): string {
  const lignes: string[] = [];
  const ajouter = (sym: string, lib: string, val: string, orig: string, source: string): void => {
    lignes.push(
      `<tr><th>${echapper(sym)}</th><td class="libelle">${echapper(lib)}</td><td class="valeur">${echapper(
        val
      )}</td><td class="origine origine-${echapper(orig)}">${echapper(orig)}</td><td class="source">${echapper(source)}</td></tr>`
    );
  };
  if (vent !== null) {
    ajouter('v_b', 'vitesse de reference', `${nombreFr(vent.v_b, 2)} m/s`, ORIGINES[vent.origines.v_b0], 'v_b,0 saisi, x c_dir x c_season');
    ajouter('c_dir', 'coefficient de direction', nombreFr(profil.vent.c_dir.valeur, 2), 'profil', profil.vent.c_dir.source);
    ajouter('c_season', 'coefficient de saison', nombreFr(profil.vent.c_season.valeur, 2), 'profil', profil.vent.c_season.source);
    ajouter('rho', 'masse volumique de l air', `${nombreFr(profil.vent.rho.valeur, 2)} kg/m3`, 'profil', profil.vent.rho.source);
    ajouter('k_I', 'coefficient de turbulence', nombreFr(profil.vent.k_I.valeur, 2), 'profil', profil.vent.k_I.source);
    ajouter(
      'c_o',
      'coefficient d orographie',
      nombreFr(vent.c_o, 2),
      ORIGINES[vent.origines.c_o],
      vent.origines.c_o === 'saisi' ? 'calcul exterieur (annexe A.3)' : 'orographie negligeable, §4.3.3'
    );
  }
  if (neige !== null) {
    ajouter('s_k', 'charge de neige au sol', `${nombreFr(neige.s_k, 2)} kN/m2`, ORIGINES[neige.origines.s_k], 'carte de l annexe nationale, saisie');
    ajouter('C_e', 'coefficient d exposition', nombreFr(neige.C_e, 2), ORIGINES[neige.origines.C_e], 'tableau 5.1 via le profil');
    ajouter(
      'C_t',
      'coefficient thermique',
      nombreFr(neige.C_t, 2),
      ORIGINES[neige.origines.C_t],
      neige.origines.C_t === 'saisi' ? 'justification hors outil' : profil.neige.C_t.source
    );
  }
  if (lignes.length === 0) return '<p class="note">Aucune grandeur de base exploitable : renseigner v_b,0 et s_k.</p>';
  return `<table class="grandeurs origines"><thead><tr><th>Grandeur</th><th class="libelle">Libelle</th><th class="valeur">Valeur</th><th>Origine</th><th>Source</th></tr></thead><tbody>${lignes.join(
    ''
  )}</tbody></table>`;
}

/** Libelle court d'un cas de vent pour le selecteur. */
export function libelleCas(cas: CasDeVent): string {
  return cas.libelle;
}

/** Lignes du tableau des zones d'un cas (une ligne par zone et par valeur). */
export function lignesZones(cas: CasDeVent): string[][] {
  const lignes: string[][] = [];
  for (const f of cas.faces) {
    for (const z of f.zones) {
      z.valeurs.forEach((v, i) => {
        lignes.push([
          f.nom,
          z.nom + (z.valeurs.length > 1 ? (i === 0 ? ' (+)' : ' (−)') : ''),
          nombreFr(z.aire, 2),
          nombreFr(z.z_e, 2),
          nombreFr(z.q_p, 3),
          nombreFr(v.c_pe_10, 2),
          nombreFr(v.c_pe_1, 2),
          nombreFr(v.c_pe, 2),
          nombreFr(v.w_e, 3),
          nombreFr(v.w_net, 3),
        ]);
      });
    }
  }
  return lignes;
}

const ENTETES_ZONES = ['Face', 'Zone', 'A (m2)', 'z_e (m)', 'q_p (kN/m2)', 'c_pe,10', 'c_pe,1', 'c_pe', 'w_e (kN/m2)', 'w_net (kN/m2)'];

/** Tableau HTML des zones d'un cas de vent, et ses grandeurs de cas. */
export function rendreCasDeVent(cas: CasDeVent): string {
  const corps = lignesZones(cas)
    .map((l) => `<tr>${l.map((c, i) => (i < 2 ? `<td>${echapper(c)}</td>` : `<td class="valeur">${echapper(c)}</td>`)).join('')}</tr>`)
    .join('');
  const bandes =
    cas.bandes.length > 1
      ? `<p class="note">Face au vent decoupee en ${cas.bandes.length} bandes (§7.2.2(1)) : ${cas.bandes
          .map((b) => `[${nombreFr(b.z_bas, 1)} ; ${nombreFr(b.z_haut, 1)}] m a z_e = ${nombreFr(b.z_e, 1)} m`)
          .join(', ')}.</p>`
      : '';
  const fr = cas.frottement;
  return `<table class="grandeurs cas-generaux"><tbody>
<tr><th>b x d</th><td class="libelle">face au vent x profondeur</td><td class="valeur">${nombreFr(cas.b, 2)} x ${nombreFr(cas.d, 2)} m</td></tr>
<tr><th>e</th><td class="libelle">min(b ; 2h), §7.2.2(2)</td><td class="valeur">${nombreFr(cas.e, 2)} m</td></tr>
<tr><th>c_pi</th><td class="libelle">pression interieure (${echapper(cas.origineCpi)})</td><td class="valeur">${nombreFr(cas.c_pi, 2)}</td></tr>
<tr><th>w_i</th><td class="libelle">q_p(h) x c_pi</td><td class="valeur">${nombreFr(cas.w_i, 3)} kN/m2</td></tr>
<tr><th>c_s c_d</th><td class="libelle">${echapper(cas.motifStructural)}</td><td class="valeur">${nombreFr(cas.c_s_c_d, 2)}</td></tr>
<tr><th>correlation</th><td class="libelle">faces au vent et sous le vent, force d ensemble seulement (§7.2.2(3))</td><td class="valeur">${nombreFr(cas.facteurCorrelation, 3)}</td></tr>
<tr><th>F_fr</th><td class="libelle">${echapper(fr.motif)}</td><td class="valeur">${fr.applicable && fr.F_fr !== undefined ? `${nombreFr(fr.F_fr, 2)} kN` : 'non applicable'}</td></tr>
</tbody></table>${bandes}
<div class="defilement"><table class="zones"><thead><tr>${ENTETES_ZONES.map((e) => `<th>${echapper(e)}</th>`).join('')}</tr></thead><tbody>${corps}</tbody></table></div>`;
}

/** Tableau HTML des cas de neige et des charges en rive. */
export function rendreNeige(r: ResultatNeige): string {
  const cas = r.cas
    .map((c) => {
      const troncons = c.troncons
        .map((t) => `x ${nombreFr(t.x0, 2)} → ${nombreFr(t.x1, 2)} m : s ${nombreFr(t.s0, 3)} → ${nombreFr(t.s1, 3)}`)
        .join(' ; ');
      const inter = c.intermediaires.map((i) => `${i.symbole} = ${nombreFr(i.valeur, 3)}${i.unite === '-' ? '' : ` ${i.unite}`}`).join(' · ');
      return `<tr><td>${echapper(c.nom)}</td><td class="libelle">${echapper(c.description)}<br><span class="clause">${echapper(
        c.clause
      )}</span></td><td class="libelle">${echapper(inter)}</td><td class="libelle">${echapper(troncons)}</td></tr>`;
    })
    .join('');
  const rives = (titre: string, bloc: ResultatNeige['debord']): string =>
    bloc.applicable
      ? bloc.charges
          .map(
            (c) =>
              `<tr><th>${echapper(c.nom)}</th><td class="libelle">${echapper(`${c.clause} · ${c.detail}`)}</td><td class="valeur">${nombreFr(c.valeur, 3)} kN/m</td></tr>`
          )
          .join('')
      : `<tr><th>${echapper(titre)}</th><td class="libelle">${echapper(bloc.motif)}</td><td class="valeur">non applicable</td></tr>`;
  return `<table class="grandeurs"><tbody>
<tr><th>s_k</th><td class="libelle">charge au sol, saisie</td><td class="valeur">${nombreFr(r.s_k, 2)} kN/m2</td></tr>
<tr><th>C_e x C_t</th><td class="libelle">exposition x thermique</td><td class="valeur">${nombreFr(r.C_e, 2)} x ${nombreFr(r.C_t, 2)}</td></tr>
</tbody></table>
<div class="defilement"><table class="zones"><thead><tr><th>Cas</th><th>Description</th><th>Intermediaires</th><th>Repartition (kN/m2)</th></tr></thead><tbody>${cas}</tbody></table></div>
<table class="grandeurs"><tbody>${rives('Debord', r.debord)}${rives('Arret de neige', r.arretDeNeige)}</tbody></table>`;
}

/** Avertissements, en blocs d'alerte. */
export function rendreAvertissements(avertissements: readonly string[]): string {
  return avertissements.map((a) => `<p class="alerte">${echapper(a)}</p>`).join('');
}

// --- Blocs des sorties --------------------------------------------------------

/** Blocs du vent : un bloc par cas, une ligne par zone et par valeur. */
export function blocsVent(r: ResultatVent | string): BlocResultat[] {
  if (typeof r === 'string') return [{ titre: 'Vent', lignes: [], note: r }];
  const blocs: BlocResultat[] = [
    {
      titre: 'Vent, grandeurs de base',
      lignes: [
        ligne('v_b', 'vitesse de reference', `${nombreFr(r.v_b, 2)} m/s`),
        ligne('c_o', 'coefficient d orographie', nombreFr(r.c_o, 2)),
        ligne('q_p(h)', 'pression de pointe a la hauteur du batiment', `${nombreFr(r.q_p_h, 3)} kN/m2`),
      ],
      note: r.toiture.applicable ? null : r.toiture.motif,
    },
  ];
  for (const c of r.cas) {
    const lignes: LigneResultat[] = [
      ligne('c_pi', `pression interieure (${c.origineCpi})`, nombreFr(c.c_pi, 2)),
      ligne('w_i', 'q_p(h) x c_pi', `${nombreFr(c.w_i, 3)} kN/m2`),
      ligne('c_s c_d', c.motifStructural, nombreFr(c.c_s_c_d, 2)),
      ligne('F_fr', c.frottement.motif, c.frottement.F_fr === undefined ? 'non applicable' : `${nombreFr(c.frottement.F_fr, 2)} kN`),
    ];
    for (const f of c.faces) {
      for (const z of f.zones) {
        lignes.push(
          ligne(
            `${f.nom} ${z.nom}`,
            `A = ${nombreFr(z.aire, 2)} m2, z_e = ${nombreFr(z.z_e, 2)} m, q_p = ${nombreFr(z.q_p, 3)} kN/m2, c_pe = ${texteCpe(z)}`,
            `w_net = ${texteWnet(z)} kN/m2`
          )
        );
      }
    }
    blocs.push({ titre: c.libelle, lignes, note: null });
  }
  return blocs;
}

/** Blocs de la neige : un bloc par cas, puis les charges en rive. */
export function blocsNeige(r: ResultatNeige | string): BlocResultat[] {
  if (typeof r === 'string') return [{ titre: 'Neige', lignes: [], note: r }];
  const blocs: BlocResultat[] = [
    {
      titre: 'Neige, grandeurs de base',
      lignes: [
        ligne('s_k', 'charge au sol', `${nombreFr(r.s_k, 2)} kN/m2`),
        ligne('C_e', 'coefficient d exposition', nombreFr(r.C_e, 2)),
        ligne('C_t', 'coefficient thermique', nombreFr(r.C_t, 2)),
      ],
      note: null,
    },
  ];
  for (const c of r.cas) {
    blocs.push({
      titre: `${c.nom} — ${c.description}`,
      lignes: [
        ...c.intermediaires.map((i) => ligne(i.symbole, i.libelle, `${nombreFr(i.valeur, 3)}${i.unite === '-' ? '' : ` ${i.unite}`}`)),
        ...c.troncons.map((t) =>
          ligne(`x ${nombreFr(t.x0, 2)}-${nombreFr(t.x1, 2)} m`, `mu ${nombreFr(t.mu0, 3)} -> ${nombreFr(t.mu1, 3)}`, `s ${nombreFr(t.s0, 3)} -> ${nombreFr(t.s1, 3)} kN/m2`)
        ),
      ],
      note: c.clause,
    });
  }
  for (const [titre, bloc] of [
    ['Neige en debord (§6.3)', r.debord],
    ['Arret de neige (§6.4)', r.arretDeNeige],
  ] as const) {
    blocs.push({
      titre,
      lignes: bloc.charges.map((c) => ligne(c.nom, c.detail, `${nombreFr(c.valeur, 3)} kN/m`)),
      note: bloc.applicable ? null : `Non applicable : ${bloc.motif}`,
    });
  }
  return blocs;
}
