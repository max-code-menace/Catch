# Répartition du travail à deux

Deux personnes (A et B) codent en même temps. Le but : ne jamais toucher aux mêmes fichiers au même moment, et ne pas faire deux fois la même chose.

## Deux pistes

### Piste A — « Compte et sécurité » (côté base et profil)

Tout ce qui touche à la confiance, au compte et à la vie d'une session.

1. **Étape 10** : signalement d'une session ou d'un joueur, blocage, suppression de compte (+ lien web de suppression). Écrans : `src/app/(onglets)/profil.tsx` (entrées), nouveaux écrans `signaler`, `compte`. Base : nouvelles tables et fonctions.
2. **Connexion Google** (reste de l'étape 5) : `src/app/connexion.tsx`, `src/lib/compte.tsx`.
3. **Modifier / annuler une session** par son organisateur, puis la notification « changement sur ma session » (reste de l'étape 8) : `session/[id].tsx` (partie organisateur), `lib/sessions.tsx`, `lib/notifications.ts`.
4. Nettoyage des jetons de téléphones morts (notifications).

### Piste B — « Écrans, finitions et mise en ligne » (côté app visible)

Tout ce qui se voit et tout ce qui sort de l'app.

1. **Icône et écran de démarrage** (`assets/`, `app.json`).
2. **Build installable** : EAS Build, TestFlight, clé Google Maps Android (`app.json`, `eas.json`), puis « Ouvrir dans l'app » et liens qui ouvrent l'app directement (étape 7).
3. **Vérifier la première création en 3 choix** (étape 6) : `creer.tsx`, `choix-lieu`, `roulette`.
4. **Retouches du laboratoire UX** : les 10 corrections d'audit, états vides, chargement, animations (`design/laboratoire-ux/`, composants).
5. **Étape 11** : préparer les tests (5 potes, puis 5 inconnus), suivi de l'indicateur.

### Pas pour l'instant (accord de Maxime d'abord)

Les idées « fun » de `docs/produit.md` (après-session, badges, défis, sessions qui se répètent…). Quand elles seront décidées, elles se répartissent selon la même règle : base et logique → A, écrans → B.

## Zones de fichiers

| Zone | Propriétaire | L'autre doit… |
| --- | --- | --- |
| `supabase/migrations/` | A (B demande à A, ou crée la sienne avec un horodatage unique) | ne jamais modifier une migration existante, seulement en ajouter |
| `src/lib/sessions.tsx`, `lib/compte.tsx`, `lib/notifications.ts`, `lib/messages.tsx` | A | demander avant de toucher |
| `src/app/connexion.tsx`, `notifications.tsx`, `profil.tsx` | A | idem |
| `src/app/(onglets)/creer.tsx`, `index.tsx`, composants d'affichage (`carte-sessions`, `fiche-session`, `liste-sessions`, `pastille-session`…) | B | idem |
| `app.json`, `eas.json`, `assets/`, `design/`, `emails/` | B | idem |
| `src/constants/theme.ts`, `src/app/_layout.tsx`, `package.json`, `CLAUDE.md`, `docs/` | **partagé** | petits commits, tirer `main` juste avant, prévenir l'autre |

`session/[id].tsx` est partagé : A y touche la partie organisateur, B la partie affichage. Se prévenir avant d'y toucher.

## Règles de Git

1. **Une branche par fonctionnalité**, courte, partie de `main` à jour : `a/signalement`, `b/icone`… Jamais de travail direct sur `main`.
2. **Petites pull requests** (une fonctionnalité), mergées dès qu'elles sont prêtes : plus c'est petit, moins il y a de conflits. Avant de pousser : `git pull --rebase origin main`, puis `npx tsc --noEmit` et `npx expo lint`.
3. Avant de commencer une tâche, la **cocher « en cours » dans la liste ci-dessous** (commit direct, 1 ligne) : c'est ce qui évite les doublons.
4. Une migration SQL = un nouveau fichier `AAAAMMJJHHMMSS_nom.sql`, sans jamais supprimer de données (voir `CLAUDE.md`). Une seule personne applique la migration à Supabase, celle qui l'a écrite, et le dit à l'autre.
5. Les mises à jour Expo (`eas update` sur le canal `main`) et le déploiement du site : seulement depuis `main`, jamais depuis une branche de travail, sinon l'un écrase la publication de l'autre.
6. Les sessions Claude de chacun : une session = une tâche = une branche. Ne pas laisser deux sessions sur la même zone.

## Suivi (à tenir à jour)

| Tâche | Piste | État |
| --- | --- | --- |
| Étape 10 : signalement, blocage, suppression de compte | A | fait (16 novembre) |
| Connexion Google | A | à faire |
| Modifier / annuler une session + notification « changement » | A | fait (16 novembre), à tester sur téléphone |
| Audit du 16 novembre : zone Bruxelles, mes sessions, création, confidentialité, garde-fous | A + B | fait (16 novembre), à tester sur téléphone |
| Nettoyage des jetons push morts | A | à faire |
| Icône et écran de démarrage | B | à faire |
| Build EAS + TestFlight + clé Google Maps Android | B | à faire |
| Liens qui ouvrent l'app / « Ouvrir dans l'app » | B | à faire |
| Vérifier la première création en 3 choix | B | fait (19 novembre) |
| 10 corrections d'audit du laboratoire UX | B | liste jamais notée dans le dépôt (perdue) |
| Étape 11 : tests | B | après les autres |
