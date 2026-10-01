# charges-climatiques

Charges de neige (EN 1991-1-3) et actions du vent (EN 1991-1-4) sur les
bâtiments à base rectangulaire, rendues **zone par zone et cas par cas**, avec
profil normatif paramétrable.

Fait partie de la suite [Aedificium web](https://henri421.github.io/WebAedificium/).
Page publiée : <https://henri421.github.io/charges-climatiques/>.

> **Aide au calcul. Cet outil constate, il ne prescrit pas.** Les actions
> climatiques dépendent de l'annexe nationale en vigueur au lieu de
> construction. Le profil actif et la date de ses données sont affichés en
> permanence ; il appartient à l'utilisateur de vérifier qu'ils correspondent
> au texte applicable à son projet. Les grandeurs de base (`v_b,0`, `s_k`) se
> saisissent toujours : aucune carte n'est embarquée.

## Ce que l'outil rend

Pas « la charge de vent » : une façade porte simultanément plusieurs zones, et
chacune se combine aux deux signes de la pression intérieure, pour plusieurs
directions. Le noyau ne produit **aucun scalaire**.

**Vent** — pour chaque cas (direction × pression intérieure) :

- pression de pointe `q_p(z)` par la loi logarithmique, catégories de terrain 0 à IV ;
- découpage de la face au vent en **bandes de hauteur de référence** (§7.2.2(1)), calculé ;
- zones A à E des parois verticales (tableau 7.1), avec les **trois découpages** selon
  `e < d`, `d ≤ e < 5d` et `e ≥ 5d` ;
- zones F, G, H, I des toitures plates, rives à angle vif ou acrotères (tableau 7.2) ;
- **`c_pe,1` et `c_pe,10` toujours**, et `c_pe` interpolé pour l'aire chargée choisie ;
- pression intérieure : enveloppe +0,2 / −0,3 (les **deux** cas, sans choisir), ou face dominante ;
- coefficient structural par les critères de dispense du §6.2(1), ou saisi ;
- frottement (§7.5) : critère de dispense, ou force de frottement ;
- facteur de corrélation entre faces au vent et sous le vent (§7.2.2(3)), pour la force d'ensemble.

**Neige** :

- `s = μ_i C_e C_t s_k` ; `C_e` selon la topographie, `C_t` du profil ou saisi ;
- toiture plate, à un versant, et à deux versants avec ses **trois cas** de charge ;
- arrêt de neige ou acrotère en rive basse : `μ₁` maintenu à 0,8 (§5.3.3(4)) ;
- accumulations **exigées dès que la configuration existe** : obstacle (§6.2), toiture basse accolée à une construction plus haute (§5.3.6) ;
- neige en débord (§6.3) et effort sur les arrêts de neige (§6.4).

**Sorties** : plan de zonage dessiné par cas, tableau, CSV (une ligne par zone et par cas),
JSON structuré destiné à un futur module de combinaisons EN 1990, note de calcul HTML imprimable.

## Profil normatif

Aucune valeur nationale n'est codée dans le noyau. Le profil par défaut,
`ec1Recommande()`, porte les **valeurs recommandées** de l'Eurocode, chacune
avec sa source. Un profil national est un **fichier de données** (JSON lu par
`profilDepuisJson`), dont chaque valeur porte sa source ; une valeur sans
provenance **bloque le calcul**. Aucun profil national n'est fourni : il ne
sera ajouté qu'après lecture du texte en vigueur (voir `src/norms/profils/`).

## Hors périmètre

Un cas hors périmètre lève une erreur explicite, jamais une configuration voisine.

- Zonage au vent des **toitures inclinées** (tableaux 7.3 et 7.4) : lot suivant. Les parois
  verticales sont traitées, la toiture est déclarée **non applicable** avec son motif.
- Toitures à quatre versants, en sheds, en voûte, coupoles ; bâtiments non rectangulaires.
- Bâtiments élancés `h/d > 5` (coefficients de force, §7.6 à §7.8), ouvrages d'art, cheminées, treillis.
- Analyse dynamique, calcul de `c_s c_d` hors dispense (une valeur calculée par ailleurs se saisit).
- Coefficient d'orographie par l'annexe A.3 (une valeur calculée par ailleurs se saisit).
- Pression intérieure par le coefficient d'ouverture `μ` (figure 7.13).
- Neige exceptionnelle et accumulations exceptionnelles ; toitures multiples.

## Choix de modélisation déclarés

- Hauteur de référence des parois latérales, sous le vent et de la toiture : `z_e = h` ; pression intérieure à `z_i = h`.
- Bandes intermédiaires de la face au vent : égales, de hauteur au plus `b`, à `z_e` = leur sommet.
- Acrotère au-delà de `h_p/h = 0,10` : valeurs de 0,10, du côté de la sécurité, avec avertissement.
- Toiture à deux versants : faîtage placé pour des égouts à la même hauteur.
- Glissement depuis la toiture haute (§5.3.6) : 50 % de la charge du versant, répartis en triangle sur `l_s`.
- Débord : épaisseur de neige déduite de `s` et du poids volumique du §6.3(2).

## Développement

```bash
npm install
npm run typecheck
npm test
npm run dev
```

Noyau pur dans `src/` (unités : m, kN/m², kN, m/s), interface dans `app/`, primitives
communes tirées de [`aedificium-ui`](https://github.com/henri421/aedificium-ui).
Cas résolu à la main : [`docs/validation/halle-courante.md`](docs/validation/halle-courante.md).
Conventions de la suite : [`CONVENTIONS.md`](CONVENTIONS.md).

## Références

EN 1991-1-3:2003 et EN 1991-1-4:2005, et leurs annexes nationales.
EN 1990 pour les combinaisons, hors périmètre de ce dépôt.

## Licence

MIT — voir [LICENSE](LICENSE), sans garantie d'aucune sorte.
