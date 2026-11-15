# Laboratoire UX Catch

Bibliothèque interactive de patterns UX/UI (40 patterns, une centaine de variantes jouables, analyse critique, sources, design system, synthèse).

- Version publiée : https://claude.ai/artifact/XnGqqCVsjx5U1CSBRzKAHR
- `index.html` : fichier final, autonome (s'ouvre dans un navigateur). Généré, ne pas modifier à la main.
- `src/` : les sources. `head.html` (style), `tail.css` (compléments), `core.js` (outils, téléphone, fiche d'un pattern), `refs.js` (sources vérifiées), `mod1.js` à `mod7.js` (modules A à N, motion, design system, références), `app.js` (accueil, synthèse, navigation).
- `construire.py` : recompose `index.html` à partir de `src/` et de `../pictos/`. Commande : `python construire.py`.

## Limites à garder en tête
- Les notes sur 10 critères sont un jugement, pas une mesure sur des utilisateurs.
- Les fiches d'applications (Strava, Airbnb, Duolingo, Playtomic…) n'ont pas été vérifiées sur captures.
- Mobbin, Page Flows, Behance, Dribbble et Pinterest sont des pistes à explorer, pas des sources analysées.
- Noms, lieux et chiffres des maquettes sont fictifs.
