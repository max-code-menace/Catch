# Catch

Catch fait sortir les gens de chez eux : on ouvre l'app, on voit les sessions de sport autour de soi (foot, badminton, escalade, spikeball…) et on en rejoint une en appuyant sur **Catch**. Pas de niveau à justifier, les débutants sont les bienvenus.

Lancement prévu en Brabant wallon / Bruxelles, d'abord avec un cercle d'amis, puis ville par ville.

## État du projet

Conception terminée (novembre 2026). Les étapes 0 à 4 du plan sont faites : squelette, barre de navigation flottante, design system, carte des sessions, liste avec filtres, détail d'une session, geste Catch (la balle attrapée dans le bouton), écran « Tu l'as catchée ! » et annulation de participation. Les sessions sont encore fictives (`src/donnees/sessions.ts`) et le Catch n'est pas enregistré : il disparaît quand on ferme l'app. Rien n'a encore été testé sur un vrai téléphone. Prochaine étape : la connexion au moment du Catch (étape 5).

## Lancer l'app

Dans un terminal ouvert dans le dossier du projet :

```
npm install
npx expo start
```

Puis scanner le QR code avec l'app **Expo Go** (iPhone : avec l'appareil photo ; Android : depuis Expo Go). Le téléphone et le PC doivent être sur le même Wi-Fi.

## Voir l'app sur son téléphone sans PC

L'app est publiée sur le compte Expo `max-code-menace` ([projet catch](https://expo.dev/accounts/max-code-menace/projects/catch)). Dans **Expo Go**, connecté à ce compte, elle apparaît dans la liste des projets, branche `preview`. Pour republier après un changement :

```
npx eas-cli@latest update --branch preview --environment preview --platform ios --message "Ce qui a changé"
```

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
| [design/canvas/](design/canvas/) | Sources du canvas de design et script qui les génère |
| [Canvas de design (claude.ai)](https://claude.ai/artifact/Qda1Ef9NTeL6fSq7kZj8z1) | Design v1 des écrans, modifiable |
| [Canvas wireframes (claude.ai)](https://claude.ai/artifact/Td5KvG3CNRkR7QxivRB6DG) | Plan des écrans, parcours et wireframes d'origine |
| [Audit UX writing (claude.ai)](https://claude.ai/artifact/PZ9qBxvU5qQ3sL4izGLaT4) | Audit complet des 47 textes |
| [Figma — pictos sports](https://www.figma.com/design/CCTgu8sW6XfmQciLAaEUNC) | Pictos d'origine générés avec Figma, en vecteurs |

Les liens claude.ai et Figma sont privés : il faut être connecté au compte de Maxime pour les ouvrir.

![Écrans de Catch](design/apercus/ecrans.png)
