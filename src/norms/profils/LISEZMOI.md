# Profils nationaux

Un profil national est un **fichier JSON**, pas du code, lu par
`profilDepuisJson` et contrôlé par `verifierProfil` : chaque valeur porte sa
source (texte, clause, date de consultation), et une valeur sans source bloque
le calcul.

**Aucun profil n'est fourni ici.** Le profil luxembourgeois ne sera ajouté
qu'après lecture de l'annexe nationale en vigueur. Toute valeur nationale qui
apparaîtrait dans un brouillon sans cette lecture doit être considérée comme
inventée et supprimée.

Format : celui de `ProfilNormatif` (`src/norms/profil.ts`), dont
`ec1Recommande()` donne un exemple complet.
