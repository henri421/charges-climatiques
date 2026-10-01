# Validation à la main — halle courante

Cas complet résolu à la main, reproduit par les tests
(`tests/vent/verifier-vent.test.ts`, `tests/neige/verifier-neige.test.ts`).

> **Valeurs de base fictives.** `v_b,0 = 26 m/s` et `s_k = 0,7 kN/m²` ne
> viennent d'aucune carte nationale. Elles servent à rendre le calcul lisible,
> pas à représenter un site réel.

## Données

| Grandeur | Valeur |
| --- | --- |
| Plan | 30 m (x) × 12 m (y) |
| Hauteur h | 8 m, toiture plate, rives à angle vif |
| Terrain | catégorie II : z₀ = 0,05 m, z_min = 2 m |
| Orographie | négligeable, c_o = 1 |
| Profil | valeurs recommandées : c_dir = c_season = 1, ρ = 1,25 kg/m³, k_I = 1 |
| Pression intérieure | enveloppe +0,2 / −0,3 |
| Neige | site normal (C_e = 1), C_t = 1 |

## Vent

**Pression de pointe à z = h = 8 m** (§4.3 à §4.5)

- k_r = 0,19 × (0,05 / 0,05)^0,07 = 0,19
- c_r(8) = 0,19 × ln(8 / 0,05) = 0,19 × 5,0752 = 0,96428
- v_m = 0,96428 × 1 × 26 = 25,071 m/s
- I_v = 1 / (1 × ln 160) = 0,19704
- q_p = (1 + 7 × 0,19704) × 0,5 × 1,25 × 25,071² = 2,3793 × 392,86 = 934,7 N/m² = **0,9347 kN/m²**

**Direction 0 (vent sur le long pan y−)** : b = 30 m, d = 12 m

- e = min(30 ; 2 × 8) = 16 m ≥ d : parois latérales en zones A [0 ; 3,2] et B [3,2 ; 12], pas de zone C.
- h ≤ b : face au vent en une seule bande, z_e = 8 m.
- h/d = 0,667 ; tableau 7.1 interpolé entre 0,25 et 1 :
  - D : c_pe,10 = 0,7 + 0,1 × (0,667 − 0,25) / 0,75 = **0,7556** ; c_pe,1 = 1,0
  - E : c_pe,10 = −0,3 − 0,2 × 0,5556 = **−0,4111**
- Zone D (aire 240 m² > 10 m², c_pe = c_pe,10) : w_e = 0,9347 × 0,7556 = **0,7062 kN/m²**
- Avec c_pi = +0,2 : w_i = 0,1869 kN/m², w_net = 0,7062 − 0,1869 = **0,5193 kN/m²**

**Toiture (direction 0)** : F 4 × 1,6 m aux deux coins, G 22 × 1,6 m, H de 1,6 à 8 m, I de 8 à 12 m.
Zone I : c_pe = ±0,2, w_e = **±0,1869 kN/m²**, les deux valeurs étant rendues.

**Direction 90 (vent sur le pignon x+)** : b = 12 m, d = 30 m, e = 12 m < d : zones A, B et C.

**Frottement, direction 90** (§7.5)

- surfaces parallèles : 2 × 30 × 8 + 12 × 30 = 840 m² > 4 × (2 × 12 × 8) = 768 m² : frottement à prendre en compte
- au-delà de min(2b ; 4h) = 24 m : A_fr = 2 × 8 × 6 + 12 × 6 = 168 m²
- F_fr = 0,01 × 0,9347 × 168 = **1,570 kN**

En direction 0 : 552 m² ≤ 4 × 480 m², frottement **non applicable**.

**Coefficient structural** : h = 8 m < 15 m, c_s c_d = 1 (§6.2(1)a).

## Neige

- Toiture plate : μ₁ = 0,8 ; s = 0,8 × 1 × 1 × 0,7 = **0,56 kN/m²**
- Débord (s'il est demandé, §6.3) : d = 0,56 / 3 = 0,1867 m ; k = min(3 / 0,1867 ; 0,1867 × 3) = 0,56 ;
  s_e = 0,56 × 0,56² / 3 = **0,0585 kN/m**

**Toiture basse accolée** (§5.3.6) : h = 3 m, b₁ = 10 m, b₂ = 12 m, toiture haute à 10°

- μ_w = (10 + 12) / (2 × 3) = 3,667 ≤ γh / s_k = 2 × 3 / 0,7 = 8,57 ; dans [0,8 ; 4] : **μ_w = 3,667**
- toiture haute ≤ 15° : μ_s = 0
- l_s = 2 × 3 = 6 m, dans [5 ; 15] m
- s au pied du mur = 3,667 × 0,7 = **2,567 kN/m²**, décroissant jusqu'à 0,56 kN/m² à 6 m

**Toiture à deux versants 20° / 35°**, largeur 12 m

- μ₁(20°) = 0,8 ; μ₁(35°) = 0,8 × (60 − 35) / 30 = 0,6667
- faîtage à w₁ = 12 × tan 35° / (tan 20° + tan 35°) = 7,896 m de la rive y−
- cas (i) 0,8 / 0,667 ; cas (ii) 0,4 / 0,667 ; cas (iii) 0,8 / 0,333
