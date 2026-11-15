# Catch — contexte pour Claude

App mobile (Expo + Supabase) pour faire du sport et rencontrer des gens près de chez soi. Lancement local : Brabant wallon / Bruxelles. Équipe d'une personne.

## À lire d'abord

- `docs/produit.md` : décisions produit, choix techniques, plan de construction
- `docs/design-system.md` : couleurs clair et sombre, typo, navigation, animations, vibrations
- `docs/ux-writing.md` : ton, règle du mot « catch », glossaire
- `docs/recherches.md` : résumé des recherches UX
- `mobile/AGENTS.md` : règles Expo (ne pas se fier à sa mémoire, lire la doc de la version installée)

## Où est quoi

| Dossier | Contenu |
| --- | --- |
| `mobile/` | **L'app** (Expo SDK 58, expo-router, TypeScript) |
| `docs/` | Décisions et règles |
| `design/` | **Design de référence** (direction « Chaleur ») : captures dans `apercus/`, pictos SVG dans `pictos/` |
| `design/laboratoire-ux/` | Analyse de patterns UX (sources dans `src/`). 10 corrections d'audit pas encore appliquées |
| `maquettes-liquid-glass/` | Ancienne piste (verre gris). **Ne pas suivre** |

Les fichiers `design/canvas/*.dc.html` sont générés par `design/canvas/generer_design.py` : modifier le script, pas les fichiers générés.

## Où en est l'app (mis à jour le 15 novembre 2026)

Plan complet dans `docs/produit.md`.

- [x] 0. Projet Expo créé dans `mobile/`
- [x] 1. Squelette, barre flottante à 4 onglets, thème clair et sombre, module de vibrations
- [x] 2. Carte des sessions (fond de carte, pastilles, aperçu au toucher, état « Rien à 5 km », erreur réseau)
- [ ] 3. Liste des sessions ← **prochaine étape** (ajouter le bouton Liste/Carte dans la barre du haut)
- [ ] 4. Détail et bouton Catch · 5. Connexion · 6. Créer · 7. Lien d'invitation
- [ ] 8. Notifications · 9. Messagerie interne · 10. Signalement, blocage, suppression de compte · 11. Tests

En attente d'une réponse de Maxime :
- L'étape 2 s'ouvre-t-elle bien dans Expo Go sur son iPhone (carte Apple Plans visible, point bleu) ? Pas encore confirmé, l'étape 1 non plus.

Volontairement pas encore dans la carte (prévu plus tard) : bouton Catch et avatars dans l'aperçu (étape 4), bouton Inviter (étape 7), changer de zone / « Choisir ma commune », « Me prévenir des sessions » (étape 8), point « En direct » qui pulse.

**Supabase** : projet `fwhewavlrbujnwfbgcdf` (« max-code-menace's Project », eu-central-1). Une seule table, `sessions`, lisible par tous, **vide** (personne ne peut encore écrire : ça vient avec les étapes 5 et 6). Le SQL est dans `supabase/migrations/`. Ne jamais y mettre de fausses sessions. L'app lit la table par l'API REST avec `fetch` (`src/lib/sessions.ts`) ; passer à `@supabase/supabase-js` à l'étape 5 pour la connexion.

Pas encore fait : icône et écran de démarrage (ceux d'Expo par défaut), aucun test sur vrai téléphone, clé Google Maps pour Android (nécessaire seulement pour un build hors Expo Go, étape 8).

## Structure de `mobile/`

- `src/app/_layout.tsx` : polices, thème, pile de navigation
- `src/app/(tabs)/` : les 4 onglets (`creer`, `index` = Carte, `messages`, `profil`). Carte et Profil ont du contenu
- `src/components/carte/` : `fond-carte.tsx` (react-native-maps : Apple Plans sur iPhone, Google Maps sur Android), `fond-carte.web.tsx` (fond uni, sert seulement aux vérifications dans un navigateur), `pastille`, `barre-haut`, `apercu-session`, `panneau`
- `src/components/picto-sport.tsx` + `src/theme/pictos.ts` (généré depuis `design/pictos/` par `node scripts/generer-pictos.mjs`)
- `src/lib/` : `config.ts` (Supabase, zone de départ Wavre, rayon 5 km), `sessions.ts` (chargement, statuts, textes), `position.ts` (localisation), `geo.ts` (distances)
- `src/components/tab-bar.tsx` : barre flottante sur mesure (`expo-router/ui`)
- `src/components/` : `ecran`, `texte`, `pressable-scale`
- `src/theme/tokens.ts` : couleurs, polices, rayons, ressorts. **Aucune couleur en dur dans un écran**
- `src/theme/theme-context.tsx` : `useTheme()` donne `c` (couleurs) et le réglage Auto / Clair / Sombre
- `src/lib/haptics.ts` : `vibrer()`, seul endroit qui déclenche une vibration

Règles de code : React Compiler est actif, donc avec Reanimated écrire `valeur.set()` / `valeur.get()` et pas `.value`. Installer un paquet avec `npx expo install`. Avant chaque commit : `npx tsc --noEmit` et `npx expo lint` dans `mobile/`.

## Tester et publier

- Compte Expo : `max-code-menace`, projet `catch` (ID `f78ef305-c7a4-4272-944a-be41255b2319`).
- Maxime teste sur **iPhone avec Expo Go**, sans PC. Après chaque étape, publier :
  `npx eas-cli@latest update --branch main --message "…" --platform ios --environment development --non-interactive` (dans `mobile/`)
- La version d'exécution doit rester `sdkVersion` dans `app.json` (nécessaire pour Expo Go).
- Vérifier soi-même avant de publier : `npx expo start --web` puis captures en clair et en sombre. Le bac à sable n'atteint pas Supabase : dans Playwright, simuler la réponse de `**/rest/v1/sessions**` (`page.route`) pour voir des pastilles, sans jamais rien écrire dans la vraie base.
- Accès Expo : l'environnement cloud « catch » contient le jeton (injecté vers `api.expo.dev`). Si la session tourne sur un autre environnement, basculer dessus (`switch_environment`), puis lancer les commandes EAS avec `EXPO_TOKEN=dummy` devant. La doc `docs.expo.dev` n'est pas joignable : lire les types dans `node_modules/`.
- Les notifications push ne marchent pas dans Expo Go sur Android : build de développement à partir de l'étape 8.
- Si la session n'est pas connectée à Expo, demander un accès à Maxime, ne jamais lui faire coller un jeton dans la conversation.

## Git

L'étape 2 est sur la branche `claude/quirky-brown-63j7wf` (pas encore fusionnée dans `main` ; les étapes 0 et 1 y sont déjà). Pousser après chaque étape (les sessions cloud sont effacées). Pas de pull request sans que Maxime le demande.

## Décisions à ne pas rediscuter

Détail dans `docs/produit.md`. En bref : pas de compte pour regarder · direction Chaleur · mode sombre dès la v1 · barre flottante sur mesure · création pré-remplie avec une première création en 3 choix · annulation libre jusqu'à 3 h avant puis confirmation factuelle · messagerie interne avant le lancement public · 4 types de notifications, pas de résumé quotidien · célébration du Catch après la réponse du serveur · pas de paiement dans l'app · pas de variantes expérimentales · pas de dark patterns · la v1 est un vrai produit fini, pas une démo.

## Code

Projet Expo à la racine (voir `AGENTS.md` pour les règles Expo). Écrans dans `src/app/` (onglets dans `src/app/(onglets)/`, détail et confirmation par-dessus), sessions et Catchs partagés dans `src/lib/sessions.tsx`, composants dans `src/components/`, jetons du design system dans `src/constants/theme.ts`, vibrations dans `src/lib/haptics.ts`. Noms de fichiers, composants et variables en français. Vérifier avec `npx tsc --noEmit` avant de pousser.

## Façon de travailler

Maxime dirige le produit et ne code pas. Claude code directement dans le repo, une fonctionnalité à la fois, teste, pousse, publie sur Expo, puis explique en une ou deux phrases ce qui a changé et ce qu'il faut regarder sur le téléphone. Réponses courtes, en français, ton décontracté, jargon expliqué. Maxime est sur Windows (souvent sans accès à son PC) et sur iPhone.

**Tenir ce fichier à jour** : cocher l'étape et mettre à jour « Où en est l'app » à la fin de chaque étape.
