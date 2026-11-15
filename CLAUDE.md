# Catch — contexte pour Claude

App mobile (Expo + Supabase) pour faire du sport et rencontrer des gens près de chez soi. Lire d'abord :

- `docs/produit.md` : décisions produit, choix techniques et plan de construction (avec l'étape en cours)
- `docs/design-system.md` : couleurs, typo, navigation, pictos, animations, vibrations
- `docs/ux-writing.md` : ton, règle du mot « catch », glossaire

Le design de référence est dans `design/` (captures dans `design/apercus/`, pictos SVG dans `design/pictos/`). Les fichiers `design/canvas/*.dc.html` sont générés par `design/canvas/generer_design.py` : modifier le script, pas les fichiers générés.

## Code

Projet Expo à la racine (voir `AGENTS.md` pour les règles Expo). Écrans dans `src/app/` (onglets dans `src/app/(onglets)/`, détail et confirmation par-dessus), sessions et Catchs partagés dans `src/lib/sessions.tsx`, composants dans `src/components/`, jetons du design system dans `src/constants/theme.ts`, vibrations dans `src/lib/haptics.ts`. Noms de fichiers, composants et variables en français. Vérifier avec `npx tsc --noEmit` avant de pousser.

## Façon de travailler

Maxime dirige le produit et ne code pas. Avancer une fonctionnalité à la fois, code complet prêt à copier avec les commandes exactes, une explication en une ou deux phrases par partie, corriger directement les erreurs qu'il colle. Réponses courtes, en français, ton décontracté. Maxime est sur Windows.
