/**
 * Mise en forme des resultats : tableaux HTML de la page, et blocs communs
 * aux sorties CSV et a la note de calcul.
 *
 * Module PUR. Unites affichees : m, m2, m/s, kN/m2, kN, kN/m.
 */

import { echapper, nombreAffiche, notationHtml, type BlocResultat, type LigneResultat } from 'aedificium-ui';
import type { CasDeVent, ProfilNormatif, ResultatNeige, ResultatVent } from '../../src/index';
import type { ModeleSaisie } from './form';
import { phrase, textes } from './textes';

/** Message d'une erreur du noyau, pour la banniere. */
export function messageDErreur(e: unknown): string {
  return phrase(e instanceof Error ? e.message : String(e));
}

/** Nombre affiche : trois decimales au plus, sans zeros inutiles. */
function aff(valeur: number, decimales = 3): string {
  return nombreAffiche(valeur, Math.min(decimales, 3));
}

function ligne(symbole: string, libelle: string, valeur: string): LigneResultat {
  return { symbole, libelle, valeur };
}

/** Bandeau permanent du profil actif. */
export function bandeauProfil(profil: ProfilNormatif): string {
  return `<p class="profil-nom"><strong>${notationHtml(phrase(profil.nom))}</strong>${notationHtml(textes().profil(profil.date))}</p><p class="profil-perimetre">${notationHtml(
    phrase(profil.perimetre)
  )}</p>`;
}

/** Lignes des provenances : grandeur, libelle, valeur, origine, source. */
export function lignesOrigines(profil: ProfilNormatif, vent: ResultatVent | null, neige: ResultatNeige | null): string[][] {
  const t = textes();
  const o = t.origine;
  const ORIGINES = t.origines;
  const lignes: string[][] = [];
  const ajouter = (sym: string, lib: string, val: string, orig: string, source: string): void => {
    lignes.push([sym, lib, val, orig, phrase(source)]);
  };
  if (vent !== null) {
    ajouter('v_b', o.v_b, `${aff(vent.v_b, 2)} m/s`, ORIGINES[vent.origines.v_b0], o.v_bSource);
    ajouter('c_dir', o.c_dir, aff(profil.vent.c_dir.valeur, 2), ORIGINES.profil, profil.vent.c_dir.source);
    ajouter('c_season', o.c_season, aff(profil.vent.c_season.valeur, 2), ORIGINES.profil, profil.vent.c_season.source);
    ajouter('rho', o.rho, `${aff(profil.vent.rho.valeur, 2)} kg/m3`, ORIGINES.profil, profil.vent.rho.source);
    ajouter('k_I', o.k_I, aff(profil.vent.k_I.valeur, 2), ORIGINES.profil, profil.vent.k_I.source);
    ajouter(
      'c_o',
      o.c_o,
      aff(vent.c_o, 2),
      ORIGINES[vent.origines.c_o],
      vent.origines.c_o === 'saisi' ? o.c_oSaisi : o.c_oNegligeable
    );
  }
  if (neige !== null) {
    ajouter('s_k', o.s_k, `${aff(neige.s_k, 2)} kN/m2`, ORIGINES[neige.origines.s_k], o.s_kSource);
    ajouter('C_e', o.C_e, aff(neige.C_e, 2), ORIGINES[neige.origines.C_e], o.C_eSource);
    ajouter(
      'C_t',
      o.C_t,
      aff(neige.C_t, 2),
      ORIGINES[neige.origines.C_t],
      neige.origines.C_t === 'saisi' ? o.C_tSaisi : profil.neige.C_t.source
    );
  }
  return lignes;
}

/** Tableau des provenances : chaque grandeur de base et d'ou elle vient. */
export function tableauOrigines(profil: ProfilNormatif, vent: ResultatVent | null, neige: ResultatNeige | null): string {
  const t = textes();
  // La classe CSS suit la provenance, pas son libelle traduit.
  const CLASSES: Record<string, string> = { profil: 'profil', saisi: 'saisie', 'defaut-recommande': 'défaut' };
  const classe = (orig: string): string => CLASSES[Object.keys(t.origines).find((k) => t.origines[k] === orig) ?? ''] ?? orig;
  const lignes = lignesOrigines(profil, vent, neige).map(
    ([sym, lib, val, orig, source]) =>
      `<tr><th>${notationHtml(sym)}</th><td class="libelle">${notationHtml(lib)}</td><td class="valeur">${notationHtml(
        val
      )}</td><td class="origine origine-${echapper(classe(orig))}">${notationHtml(orig)}</td><td class="source">${notationHtml(source)}</td></tr>`
  );
  if (lignes.length === 0) return `<p class="note">${notationHtml(t.origine.aucune)}</p>`;
  return `<div class="defilement"><table class="grandeurs origines"><thead><tr>${t.origine.entetes.map((e, i) => `<th${i === 1 ? ' class="libelle"' : i === 2 ? ' class="valeur"' : ''}>${notationHtml(e)}</th>`).join('')}</tr></thead><tbody>${lignes.join(
    ''
  )}</tbody></table></div>`;
}

/** Libelle court d'un cas de vent pour le selecteur. */
export function libelleCas(cas: CasDeVent): string {
  return phrase(cas.libelle);
}

/** Lignes du tableau des zones d'un cas (une ligne par zone et par valeur). */
export function lignesZones(cas: CasDeVent): string[][] {
  const lignes: string[][] = [];
  for (const f of cas.faces) {
    for (const z of f.zones) {
      z.valeurs.forEach((v, i) => {
        lignes.push([
          phrase(f.nom),
          z.nom + (z.valeurs.length > 1 ? (i === 0 ? ' (+)' : ' (−)') : ''),
          aff(z.aire, 2),
          aff(z.z_e, 2),
          aff(z.q_p, 3),
          aff(v.c_pe_10, 2),
          aff(v.c_pe_1, 2),
          aff(v.c_pe, 2),
          aff(v.w_e, 3),
          aff(v.w_net, 3),
        ]);
      });
    }
  }
  return lignes;
}

/** Decoupage de la face au vent en bandes, s'il y en a plusieurs. */
function texteBandes(cas: CasDeVent): string {
  const x = textes().cas;
  return x.bandes(cas.bandes.length, cas.bandes.map((b) => x.bande(aff(b.z_bas, 1), aff(b.z_haut, 1), aff(b.z_e, 1))).join(', '));
}

/** Tableau HTML des zones d'un cas de vent, et ses grandeurs de cas. */
export function rendreCasDeVent(cas: CasDeVent): string {
  const corps = lignesZones(cas)
    .map((l) => `<tr>${l.map((c, i) => (i < 2 ? `<td>${notationHtml(c)}</td>` : `<td class="valeur">${notationHtml(c)}</td>`)).join('')}</tr>`)
    .join('');
  const t = textes();
  const x = t.cas;
  const bandes = cas.bandes.length > 1 ? `<p class="note">${notationHtml(texteBandes(cas))}</p>` : '';
  const fr = cas.frottement;
  return `<table class="grandeurs cas-generaux"><tbody>
<tr><th>b x d</th><td class="libelle">${notationHtml(x.faceProfondeur)}</td><td class="valeur">${aff(cas.b, 2)} x ${aff(cas.d, 2)} m</td></tr>
<tr><th>e</th><td class="libelle">${notationHtml(x.e)}</td><td class="valeur">${aff(cas.e, 2)} m</td></tr>
<tr><th>${notationHtml('c_pi')}</th><td class="libelle">${notationHtml(x.c_pi(t.originesCpi[cas.origineCpi]))}</td><td class="valeur">${aff(cas.c_pi, 2)}</td></tr>
<tr><th>${notationHtml('w_i')}</th><td class="libelle">${notationHtml('q_p(h) x c_pi')}</td><td class="valeur">${aff(cas.w_i, 3)} kN/m2</td></tr>
<tr><th>${notationHtml('c_s c_d')}</th><td class="libelle">${notationHtml(phrase(cas.motifStructural))}</td><td class="valeur">${aff(cas.c_s_c_d, 2)}</td></tr>
<tr><th>${x.correlation}</th><td class="libelle">${notationHtml(x.correlationLibelle)}</td><td class="valeur">${aff(cas.facteurCorrelation, 3)}</td></tr>
<tr><th>${notationHtml('F_fr')}</th><td class="libelle">${notationHtml(phrase(fr.motif))}</td><td class="valeur">${fr.applicable && fr.F_fr !== undefined ? `${aff(fr.F_fr, 2)} kN` : t.nonApplicable}</td></tr>
</tbody></table>${bandes}
<div class="defilement"><table class="zones"><thead><tr>${x.entetes.map((e) => `<th>${notationHtml(e)}</th>`).join('')}</tr></thead><tbody>${corps}</tbody></table></div>`;
}

/** Tableau HTML des cas de neige et des charges en rive. */
export function rendreNeige(r: ResultatNeige): string {
  const t = textes();
  const x = t.neige;
  const cas = r.cas
    .map((c) => {
      const troncons = c.troncons
        .map((u) => x.troncon(aff(u.x0, 2), aff(u.x1, 2), aff(u.s0, 3), aff(u.s1, 3)))
        .join(' ; ');
      const inter = c.intermediaires.map((i) => `${i.symbole} = ${aff(i.valeur, 3)}${i.unite === '-' ? '' : ` ${i.unite}`}`).join(' · ');
      return `<tr><td>${notationHtml(phrase(c.nom))}</td><td class="libelle">${notationHtml(phrase(c.description))}<br><span class="clause">${notationHtml(
        phrase(c.clause)
      )}</span></td><td class="libelle">${notationHtml(inter)}</td><td class="libelle">${notationHtml(troncons)}</td></tr>`;
    })
    .join('');
  const rives = (titre: string, bloc: ResultatNeige['debord']): string =>
    bloc.applicable
      ? bloc.charges
          .map(
            (c) =>
              `<tr><th>${notationHtml(phrase(c.nom))}</th><td class="libelle">${notationHtml(`${phrase(c.clause)} · ${phrase(c.detail)}`)}</td><td class="valeur">${aff(c.valeur, 3)} kN/m</td></tr>`
          )
          .join('')
      : `<tr><th>${notationHtml(titre)}</th><td class="libelle">${notationHtml(phrase(bloc.motif))}</td><td class="valeur">${t.nonApplicable}</td></tr>`;
  return `<table class="grandeurs"><tbody>
<tr><th>${notationHtml('s_k')}</th><td class="libelle">${notationHtml(x.s_k)}</td><td class="valeur">${aff(r.s_k, 2)} kN/m2</td></tr>
<tr><th>${notationHtml('C_e x C_t')}</th><td class="libelle">${notationHtml(x.expoTherm)}</td><td class="valeur">${aff(r.C_e, 2)} x ${aff(r.C_t, 2)}</td></tr>
</tbody></table>
<div class="defilement"><table class="zones"><thead><tr>${x.entetes.map((e) => `<th>${notationHtml(e)}</th>`).join('')}</tr></thead><tbody>${cas}</tbody></table></div>
<table class="grandeurs"><tbody>${rives(x.debord, r.debord)}${rives(x.arret, r.arretDeNeige)}</tbody></table>`;
}

/** Avertissements, en blocs d'alerte. */
export function rendreAvertissements(avertissements: readonly string[]): string {
  return avertissements.map((a) => `<p class="alerte">${notationHtml(phrase(a))}</p>`).join('');
}

// --- Blocs des sorties --------------------------------------------------------

/** Blocs du vent : un bloc par cas, une ligne par zone et par valeur. */
export function blocsVent(r: ResultatVent | string): BlocResultat[] {
  const t = textes();
  if (typeof r === 'string') return [{ titre: t.blocs.vent, lignes: [], note: phrase(r) }];
  const blocs: BlocResultat[] = [
    {
      titre: t.blocs.ventBase,
      lignes: [
        ligne('v_b', t.origine.v_b, `${aff(r.v_b, 2)} m/s`),
        ligne('c_o', t.origine.c_o, aff(r.c_o, 2)),
        ligne('q_p(h)', t.blocs.q_p, `${aff(r.q_p_h, 3)} kN/m2`),
      ],
      note: r.toiture.applicable ? null : phrase(r.toiture.motif),
    },
  ];
  // Chaque cas reprend EXACTEMENT ce que montre l'ecran (`rendreCasDeVent`) :
  // grandeurs du cas, puis une ligne par zone et par valeur, issue de
  // `lignesZones`, la meme fonction que le tableau a l'ecran.
  for (const c of r.cas) {
    const fr = c.frottement;
    const lignes: LigneResultat[] = [
      ligne('b x d', t.cas.faceProfondeur, `${aff(c.b, 2)} x ${aff(c.d, 2)} m`),
      ligne('e', t.cas.e, `${aff(c.e, 2)} m`),
      ligne('c_pi', t.cas.c_pi(t.originesCpi[c.origineCpi]), aff(c.c_pi, 2)),
      ligne('w_i', 'q_p(h) x c_pi', `${aff(c.w_i, 3)} kN/m2`),
      ligne('c_s c_d', phrase(c.motifStructural), aff(c.c_s_c_d, 2)),
      ligne(t.cas.correlation, t.cas.correlationLibelle, aff(c.facteurCorrelation, 3)),
      ligne('F_fr', phrase(fr.motif), fr.applicable && fr.F_fr !== undefined ? `${aff(fr.F_fr, 2)} kN` : t.nonApplicable),
    ];
    for (const [face, zone, A, z_e, q_p, c_pe_10, c_pe_1, c_pe, w_e, w_net] of lignesZones(c)) {
      lignes.push(
        ligne(
          `${face} ${zone}`,
          `A = ${A} m2, z_e = ${z_e} m, q_p = ${q_p} kN/m2, c_pe,10 = ${c_pe_10}, c_pe,1 = ${c_pe_1}, ` +
            `c_pe = ${c_pe}, w_e = ${w_e} kN/m2`,
          `w_net = ${w_net} kN/m2`
        )
      );
    }
    blocs.push({ titre: phrase(c.libelle), lignes, note: c.bandes.length > 1 ? texteBandes(c) : null });
  }
  return blocs;
}

/** Blocs de la neige : un bloc par cas, puis les charges en rive. */
export function blocsNeige(r: ResultatNeige | string): BlocResultat[] {
  const t = textes();
  if (typeof r === 'string') return [{ titre: t.blocs.neige, lignes: [], note: phrase(r) }];
  const blocs: BlocResultat[] = [
    {
      titre: t.blocs.neigeBase,
      lignes: [
        ligne('s_k', t.blocs.chargeSol, `${aff(r.s_k, 2)} kN/m2`),
        ligne('C_e', t.origine.C_e, aff(r.C_e, 2)),
        ligne('C_t', t.origine.C_t, aff(r.C_t, 2)),
      ],
      note: null,
    },
  ];
  for (const c of r.cas) {
    blocs.push({
      titre: `${phrase(c.nom)} — ${phrase(c.description)}`,
      lignes: [
        ...c.intermediaires.map((i) => ligne(i.symbole, phrase(i.libelle), `${aff(i.valeur, 3)}${i.unite === '-' ? '' : ` ${i.unite}`}`)),
        ...c.troncons.map((t) =>
          ligne(`x ${aff(t.x0, 2)}-${aff(t.x1, 2)} m`, `mu ${aff(t.mu0, 3)} -> ${aff(t.mu1, 3)}`, `s ${aff(t.s0, 3)} -> ${aff(t.s1, 3)} kN/m2`)
        ),
      ],
      note: phrase(c.clause),
    });
  }
  for (const [titre, bloc] of [
    [t.blocs.debord, r.debord],
    [t.blocs.arret, r.arretDeNeige],
  ] as const) {
    blocs.push({
      titre,
      lignes: bloc.charges.map((c) => ligne(phrase(c.nom), phrase(c.detail), `${aff(c.valeur, 3)} kN/m`)),
      note: bloc.applicable ? null : t.blocs.nonApplicable(phrase(bloc.motif)),
    });
  }
  return blocs;
}

/** Blocs des donnees saisies, pour la note et le CSV. */
export function blocsDEntree(m: ModeleSaisie): BlocResultat[] {
  const t = textes();
  const x = t.entrees;
  const toiture =
    m.toiture === 'plate' ? x.plate(aff(m.acrotere, 2)) : m.toiture === 'un-versant' ? x.unVersant(aff(m.pente)) : x.deuxVersants(aff(m.pente1), aff(m.pente2));
  return [
    {
      titre: x.batiment,
      lignes: [
        ligne(
          'L x l x h',
          x.dimensions,
          `${aff(m.longueur, 2)} x ${aff(m.largeur, 2)} x ${aff(m.hauteur, 2)} m`
        ),
        ligne(x.toiture, x.typeToiture, toiture),
        ligne(
          'c_pi',
          x.c_pi,
          m.piMode === 'enveloppe' ? x.enveloppe : x.faceDominante(m.piFace, aff(m.piRapport, 3))
        ),
      ],
      note: null,
    },
    {
      titre: x.site,
      lignes: [
        ligne(
          'v_b,0',
          x.v_b0,
          m.v_b0 === null ? x.nonRenseignee : `${aff(m.v_b0, 2)} m/s`
        ),
        ligne(x.terrain, x.categorie, m.categorie),
        ligne(
          's_k',
          x.s_k,
          m.s_k === null ? x.nonRenseignee : `${aff(m.s_k, 2)} kN/m2`
        ),
        ligne(x.altitude, x.altitudeSite, `${aff(m.altitude, 2)} m`),
        ligne(x.topographie, x.topographieNeige, t.topographies[m.topographie]),
      ],
      note: null,
    },
  ];
}

/** Avertissements portes par la note : le motif d'un calcul absent en tete. */
export function avertissementsDeLaNote(vent: ResultatVent | string, neige: ResultatNeige | string): string[] {
  return [
    ...(typeof vent === 'string' ? [textes().ventNonCalcule(phrase(vent))] : vent.avertissements.map(phrase)),
    ...(typeof neige === 'string' ? [textes().neigeNonCalculee(phrase(neige))] : neige.avertissements.map(phrase)),
  ];
}
