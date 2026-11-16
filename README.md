# Catch

Catch fait sortir les gens de chez eux : on ouvre l'app, on voit les sessions de sport autour de soi (foot, badminton, escalade, spikeball…) et on en rejoint une en appuyant sur **Catch**. Pas de niveau à justifier, les débutants sont les bienvenus.

Lancement prévu en Brabant wallon / Bruxelles, d'abord avec un cercle d'amis, puis ville par ville.

## État du projet

Conception terminée (novembre 2026). Carte, liste, détail, geste Catch, connexion par e-mail et écran « Créer une session » sont faits, en clair et en sombre. On peut inviter quelqu'un avec un lien qui ouvre une page web ([catch-sport.expo.app](https://catch-sport.expo.app)). Les sessions viennent de Supabase : il n'y a aucune session d'exemple. L'avancement à jour est dans [CLAUDE.md](CLAUDE.md).

## Lancer l'app

Dans un terminal ouvert dans le dossier du projet :

```
npm install
npx expo start
```

Puis scanner le QR code avec l'app **Expo Go** (iPhone : avec l'appareil photo ; Android : depuis Expo Go). Le téléphone et le PC doivent être sur le même Wi-Fi.

## Voir l'app sur son téléphone sans PC

L'app est publiée sur l'organisation Expo `catch-sport-team` ([projet catch](https://expo.dev/accounts/catch-sport-team/projects/catch)). Pour la voir, il faut être **membre de l'organisation** (invitation depuis expo.dev, onglet Members) et connecté à ce compte dans **Expo Go** : elle apparaît dans la liste des projets, branche `main`. Pour republier après un changement :

```
npx eas-cli@latest update --branch main --environment development --platform ios --message "Ce qui a changé"
```

## Travailler à plusieurs

1. Chacun clone le dépôt, fait `npm install` puis `npx expo start`, et scanne le QR code avec Expo Go.
2. Chacun travaille sur **sa propre branche** (jamais directement sur `main`) et ouvre une **pull request**.
3. Sur chaque pull request, GitHub vérifie le code (`.github/workflows/verifier.yml` : types + lint) et publie une version de test sur un canal `pr-<numéro>` ; le lien à ouvrir dans Expo Go est posté en commentaire.
4. Quand la pull request est fusionnée dans `main`, la nouvelle version est publiée automatiquement sur le canal `main` (`.github/workflows/publier.yml`).

### Publication automatique : réglage unique (propriétaire du dépôt)

1. Sur expo.dev, dans l'organisation `catch-sport-team` : **Access tokens > Create token**, rôle Developer, copier le jeton.
2. Sur GitHub : dépôt > **Settings > Secrets and variables > Actions > New repository secret**. Nom : `EXPO_TOKEN`, valeur : le jeton.
3. Conseillé : **Settings > Rules > Rulesets** : exiger une pull request pour modifier `main`.

Ne jamais coller ce jeton dans une conversation ni dans le code.

## Où trouver quoi

| Dossier / lien | Contenu |
| --- | --- |
| [docs/produit.md](docs/produit.md) | Vision, décisions produit, choix techniques, plan de construction |
| [docs/design-system.md](docs/design-system.md) | Couleurs, typo, navigation, composants, animations, vibrations |
| [docs/ux-writing.md](docs/ux-writing.md) | Règles de rédaction, glossaire, textes manquants à écrire |
| [docs/recherches.md](docs/recherches.md) | Résumé des recherches UX et animation qui ont guidé le design |
| [src/](src/) | Le code de l'app : écrans dans `src/app/`, composants, design system dans `src/constants/theme.ts` |
| [design/apercus/](design/apercus/) | Captures des écrans, des pictos et du système |
| [design/pictos/](design/pictos/) | Les 10 pictos de sport en SVG, prêts pour l'app |
| [design/laboratoire-ux/](design/laboratoire-ux/) | Laboratoire UX : 40 patterns et leurs variantes jouables, avec une recommandation pour chacun |
| [design/canvas/](design/canvas/) | Sources du canvas de design et script qui les génère |
| [Canvas de design (claude.ai)](https://claude.ai/artifact/Qda1Ef9NTeL6fSq7kZj8z1) | Design v1 des écrans, modifiable |
| [Canvas wireframes (claude.ai)](https://claude.ai/artifact/Td5KvG3CNRkR7QxivRB6DG) | Plan des écrans, parcours et wireframes d'origine |
| [Audit UX writing (claude.ai)](https://claude.ai/artifact/PZ9qBxvU5qQ3sL4izGLaT4) | Audit complet des 47 textes |
| [Figma — pictos sports](https://www.figma.com/design/CCTgu8sW6XfmQciLAaEUNC) | Pictos d'origine générés avec Figma, en vecteurs |

Les liens claude.ai et Figma sont privés : il faut être connecté au compte de Maxime pour les ouvrir.

![Écrans de Catch](design/apercus/ecrans.png)
