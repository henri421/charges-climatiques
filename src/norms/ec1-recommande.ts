/**
 * Profil par defaut : valeurs RECOMMANDEES de l'EN 1991-1-3 et de
 * l'EN 1991-1-4, premiere generation. Ce n'est le profil d'aucun pays.
 *
 * Les grandeurs de base du site — charge de neige au sol s_k et vitesse de
 * reference v_b,0 — n'y figurent PAS : elles relevent de la carte nationale
 * et sont toujours saisies.
 */

import type { ProfilNormatif } from './profil';

const EN_1991_1_3 = 'EN 1991-1-3:2003, valeur recommandee';
const EN_1991_1_4 = 'EN 1991-1-4:2005, valeur recommandee';

export function ec1Recommande(): ProfilNormatif {
  return {
    nom: 'Eurocode 1, valeurs recommandees',
    date: '2026-10-01',
    perimetre:
      'Valeurs recommandees de l EN 1991-1-3 et de l EN 1991-1-4, sans annexe nationale. ' +
      'Ni s_k ni v_b,0 : ces grandeurs se saisissent.',
    vent: {
      c_dir: { valeur: 1.0, source: `${EN_1991_1_4}, §4.2(2) note 2` },
      c_season: { valeur: 1.0, source: `${EN_1991_1_4}, §4.2(2) note 3` },
      rho: { valeur: 1.25, source: `${EN_1991_1_4}, §4.5(1) note 2` },
      k_I: { valeur: 1.0, source: `${EN_1991_1_4}, §4.4(1) note 2` },
      c_pi_positif: { valeur: 0.2, source: `${EN_1991_1_4}, §7.2.9(6) note 2` },
      c_pi_negatif: { valeur: -0.3, source: `${EN_1991_1_4}, §7.2.9(6) note 2` },
    },
    neige: {
      C_e_battu: { valeur: 0.8, source: `${EN_1991_1_3}, tableau 5.1` },
      C_e_normal: { valeur: 1.0, source: `${EN_1991_1_3}, tableau 5.1` },
      C_e_abrite: { valeur: 1.2, source: `${EN_1991_1_3}, tableau 5.1` },
      C_t: { valeur: 1.0, source: `${EN_1991_1_3}, §5.2(8)` },
      gamma_accumulation: { valeur: 2.0, source: `${EN_1991_1_3}, §5.3.6(1) et §6.2(2)` },
      gamma_debord: { valeur: 3.0, source: `${EN_1991_1_3}, §6.3(2)` },
      mu_obstacle_min: { valeur: 0.8, source: `${EN_1991_1_3}, §6.2(2)` },
      mu_obstacle_max: { valeur: 2.0, source: `${EN_1991_1_3}, §6.2(2)` },
      mu_w_min: { valeur: 0.8, source: `${EN_1991_1_3}, §5.3.6(1) note 1` },
      mu_w_max: { valeur: 4.0, source: `${EN_1991_1_3}, §5.3.6(1) note 1` },
      l_s_min: { valeur: 5, source: `${EN_1991_1_3}, §5.3.6(1) note 2 et §6.2(2)` },
      l_s_max: { valeur: 15, source: `${EN_1991_1_3}, §5.3.6(1) note 2 et §6.2(2)` },
    },
  };
}
