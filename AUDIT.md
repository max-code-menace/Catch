# Audit de Catch — 19 novembre 2026

Audit en lecture seule : aucun fichier de code modifié. Vérifié dans le code, dans les 15 migrations SQL, dans l'historique Git (108 commits) et directement sur la base Supabase (droits réels, conseils de sécurité Supabase). Pas vérifié : l'app sur un vrai téléphone (je n'ai pas vu les écrans tourner).

## Corrections faites (19 novembre 2026)

- **S1, S2, S3** : migration `supabase/migrations/20261119080000_vie_privee_limites.sql`, testée sur la vraie base dans une transaction annulée, puis appliquée. Un compte ne voit plus que ses propres sessions, leurs inscrits et les prénoms des gens qu'il croise ; la date de création d'une session est imposée par le serveur ; 10 sessions à venir maximum par compte (message « Tu as déjà 10 sessions à venir » dans `src/lib/catch.ts`).
- **S6, B2, B3** : migration `20261119090000_organisateur_reste.sql` (appliquée, testée) ; « Je ne peux plus » relit la session sur le serveur avant d'agir (`src/lib/sessions.tsx`) ; lien d'invitation sans réseau → « Pas de réseau » + « Réessayer » (`src/app/session/[id].tsx`). Publié sur Expo et sur le site le 20 novembre.
- **S4** : âge minimum **18 ans** (décidé le 20 nov., au lieu de 16 : messages privés prévus, voir « Vision » dans `docs/produit.md`). Conditions et Confidentialité mises à jour (la partie « Si tu as 16 ou 17 ans » devient « Âge minimum : 18 ans » ; un compte signalé comme mineur est supprimé). Adresse Gmail perso gardée jusqu'à la publication sur les stores. Conditions et Confidentialité relues et validées par Maxime (19 nov.) : ajout de « Qui édite Catch » (Maxime Draux, à titre personnel, pas de numéro BCE), « Responsabilité », « Changements ». Reste avant les stores : adresse postale de l'éditeur et adresse de contact dédiée.
- **Publication** : corrections et nouveaux textes légaux (commit `198a41f`) publiés sur Expo (canal `main`) et sur le site le 20 novembre, depuis le PC de Maxime.
- **U1** (20 nov.) : chaque pastille de la carte (session, lieu, groupe de lieux, événement) a une zone de toucher invisible d'au moins 44 × 44 px, sans changer son dessin. VoiceOver lit « Foot, ce soir 19h, 3 places libres », « Nom du lieu, gratuit », « 12 salles et terrains » ou « Événement : … » (`descriptionPastille` dans `src/lib/formats.ts`, testée). Vérifié sur la version web (captures clair et sombre) ; pas encore vu sur iPhone avec VoiceOver.
- **S5** (20 nov.) : migration `20261120000000_avis_messages.sql` (testée sur la vraie base dans un bloc annulé, puis appliquée ; ne supprime rien). Dans une conversation, on est prévenu au premier message, puis plus rien tant qu'on n'a pas ouvert la conversation, ou au plus une fois toutes les 10 minutes (table `private.avis_messages`). Texte du réglage « Nouveaux messages » mis à jour.
- **B4** (20 nov.) : la conversation relit la liste sur le serveur à chaque ouverture (la liste en mémoire pouvait encore contenir une session quittée : fil vide). Trois écrans clairs : « Tu n’es plus dans cette session » (+ « Voir la session »), « Pas de réseau » (+ « Réessayer »), « Connecte-toi pour lire les messages ». `src/app/messages/[id].tsx`, `recharger` renvoie maintenant si la lecture a réussi (`src/lib/messages.tsx`). Vérifié en captures web clair et sombre.
- **B5** (20 nov.) : quand un message arrive en direct, la conversation ne lit plus que les messages postérieurs au dernier affiché (`lireMessages(id, apres)`), au lieu des 200 derniers ; fusion sans doublon dans `src/lib/fil-messages.ts`, testée (`tests/fil-messages.test.mjs`). Les 200 derniers ne sont lus qu'à l'ouverture.
- **S7** (20 nov.) : migration `20261120010000_droits_lieux_evenements.sql` (testée dans un bloc annulé, appliquée, vérifiée) : sur `lieux` et `evenements`, visiteurs et comptes n'ont plus que la lecture (droits TRUNCATE, REFERENCES, TRIGGER retirés), et ces droits ne sont plus donnés par défaut aux prochaines tables. Rien à voir dans l'app.
- **Regroupement des sessions sur la carte** (20 nov., décidé avec Maxime) : deux pastilles de sessions dont les zones de toucher se toucheraient (calcul de leur place à l'écran et de leur largeur selon le texte, marge de 4 points) fusionnent en une bulle : « Foot ×4 · dès 18h » (même sport), « 4 sessions » avec 2 ou 3 pictos (sports différents), rouge si une est en direct ; VoiceOver lit « 4 sessions de foot, à partir de 18h ». Toucher la bulle zoome jusqu'à séparer les sessions ; si elles sont au même endroit, une liste « 2 sessions ici » s'ouvre. Calcul dans `src/lib/regroupement-sessions.ts`, testé (`tests/regroupement-sessions.test.mjs` : 0 session, 50 sessions, même endroit, bord de l'écran). Vérifié en captures web clair et sombre ; pas vu sur iPhone. Pas encore fait (après le test de Maxime) : taille des pastilles selon le nombre de bulles visibles.
- **Pastilles plus grandes** (20 nov., demande de Maxime : lisibilité) : sessions 40 px de haut au lieu de 34 et texte en 14 au lieu de 12 ; lieux 34 px au lieu de 28 ; événements 40 px au lieu de 34 ; groupe « 12 lieux » 32 px, texte en 13.

## L'app en bref

- **À quoi elle sert** : voir les sessions de sport autour de soi (Bruxelles, 5 km) et en rejoindre une d'un appui sur « Catch ». Débutants bienvenus.
- **Comment elle est construite** : app Expo (React Native, TypeScript) pour iPhone, Android et web ; base de données, comptes et messagerie sur Supabase ; notifications envoyées par la base via le service push d'Expo.
- **Connexion** : par e-mail (code à 6 chiffres) ; Apple configuré mais pas testé ; Google pas fait. Pas besoin de compte pour regarder.
- **Parcours principaux** :
  1. Ouvrir l'app → carte (ou liste) des sessions, lieux et événements → toucher une session → détail.
  2. Catch → connexion si besoin (e-mail + prénom) → « Tu l'as catchée ! » → calendrier, rappel, conseils de sécurité.
  3. Créer une session en 4 choix (sport, quand, joueurs, où) → publiée sur la carte.
  4. Discuter avec le groupe dans Messages ; recevoir rappel 3h avant, changements, nouveaux messages.
  5. Inviter un ami par lien web ; signaler, bloquer, supprimer son compte.

## Tableau de tous les points

| # | Axe | Problème | Gravité | Fichier concerné | Effort |
|---|---|---|---|---|---|
| S1 ✅ corrigé | Sécurité | Tout compte connecté peut lire directement les tables : qui participe à quelle session (lieu, heure), et les prénoms complets. Même une personne bloquée peut suivre où va celui qui l'a bloquée. | Important | `supabase/migrations/20261115010000_sessions_participations.sql` (règles « Tout le monde voit… ») | M |
| S2 ✅ corrigé | Sécurité | La limite « 6 sessions par 24 h » se contourne : on peut écrire soi-même la date de création (`cree_le`) d'une session. | Important | `20261115010000_sessions_participations.sql` (`grant insert on sessions`), `20261116020000_garde_fous.sql` | S |
| S3 ✅ corrigé | Sécurité | Aucune limite sur les Catchs : un seul compte (ou quelques faux comptes) peut prendre une place dans toutes les sessions et les faire paraître complètes. | Important | `20261116010000_organisateur.sql` (fonction `catcher`) | S |
| S4 🟡 en partie | Sécurité / légal | Âge minimum : 18 ans (Maxime, 20 nov.). Textes relus et validés par Maxime (19 nov.). Reste : adresse postale de l'éditeur et adresse de contact dédiée (Gmail perso pour l'instant), avant les stores. Pour une app où on rencontre des inconnus, c'est à trancher avant d'ouvrir au public. | Important | `src/app/confidentialite.tsx`, `src/app/conditions.tsx`, `src/constants/liens.ts` | S |
| S5 ✅ corrigé | Sécurité | Notification « nouveau message » : jusqu'à 20 par minute et par personne. Quelqu'un de malveillant peut spammer tout le groupe. | Mineur | `20261116000000_moderation.sql` (`prevenir_message`) | S |
| S6 ✅ corrigé | Sécurité | L'organisateur peut quitter sa propre session en passant par la base (la règle ne l'empêche pas) : session sans organisateur. | Mineur | `20261115010000_sessions_participations.sql` (règle « On annule sa propre participation ») | S |
| S7 ✅ corrigé | Sécurité | Droit `TRUNCATE` (tout effacer) donné aux visiteurs sur `lieux` et `evenements`. Pas utilisable via l'app, mais inutile. | Mineur | `20261119010000_lieux.sql`, `20261119060000_evenements.sql` | S |
| S8 | Sécurité | Avertissement Supabase : l'extension `pg_net` est dans le schéma `public`. | Mineur | base Supabase | S |
| S9 | Sécurité | Réglages de connexion à vérifier sur le site Supabase (durée de validité du code, nombre d'essais). | Mineur | site Supabase > Authentication | S |
| S10 | Sécurité | Dépendances : 3 failles « modérées » dans un outil de build d'Expo (minimatch). Rien n'arrive sur le téléphone. | Mineur | `package.json` | — |
| ✅ | Sécurité | Pas de mot de passe ni de clé secrète dans le code ni dans l'historique Git. La clé dans `src/constants/supabase.ts` est la clé publique, faite pour ça. Les messages, réglages, blocages et signalements sont bien protégés. | OK | — | — |
| B1 🟡 Expo Go | Bugs | Testé par Maxime dans Expo Go (19 nov.) ; reste un vrai build (TestFlight) pour Apple, notifications hors Expo Go et Android. Avant :  Rien n'a été testé sur un vrai téléphone ni de bout en bout contre la vraie base (créer, Catch, messages, notifications). | Important | toute l'app | M |
| B2 ✅ corrigé | Bugs | « Je ne peux plus » depuis le rappel, app fermée : si c'est l'organisateur, le code peut le retirer de sa propre session au lieu de lui proposer de l'annuler (il lit une liste pas encore à jour). | Important | `src/lib/sessions.tsx` (`annulerParId`) | S |
| B3 ✅ corrigé | Bugs | Lien d'invitation ouvert sans réseau : l'écran dit « Cette session n'est plus disponible » au lieu de « Pas de réseau ». | Important | `src/app/session/[id].tsx`, `src/lib/sessions.tsx` (`chercher`) | S |
| B4 ✅ corrigé | Bugs | Conversation ouverte après avoir quitté la session (depuis une notification) : écran vide, sans explication. | Mineur | `src/app/messages/[id].tsx` | S |
| B5 ✅ corrigé | Bugs | Chaque nouveau message recharge les 200 derniers messages : lent sur mauvais réseau. | Mineur | `src/lib/messages.tsx`, `src/app/messages/[id].tsx` | S |
| B6 | Bugs | Les tests automatiques ne couvrent que les dates et le regroupement sur la carte, pas Catch / créer / annuler. | Mineur | `tests/` | M |
| B7 | Bugs | Pas de clé Google Maps pour Android : carte vide dans une vraie app Android. | Mineur | `app.json` | S |
| B8 | Bugs | Table vide `sessions_ancienne` qui traîne dans la base. | Mineur | base Supabase | S |
| U1 ✅ corrigé | Design / UX | Pastilles de la carte trop petites à toucher (26 à 34 px, le minimum conseillé est 44) et muettes pour les lecteurs d'écran. | Important | `src/components/pastille-session.tsx`, `pastille-lieu.tsx`, `pastille-evenement.tsx` | S |
| U2 | Design / UX | Lieux et liens « Réserver » pas vérifiés : un faux lieu ou un lien cassé gâche la première impression. | Important | `docs/lieux-a-verifier.md`, table `lieux` | S |
| U3 | Design / UX | Couleurs des avatars écrites en dur, contre la règle du design system (risque de mauvais contraste en sombre). | Mineur | `src/components/avatars.tsx` | S |
| U4 | Design / UX | App en français seulement, alors que Bruxelles est bilingue (déjà prévu « plus tard »). | Mineur | toute l'app | L |
| U5 | Design / UX | Pas de revue visuelle faite dans cet audit : il faudra passer les écrans en captures (clair et sombre) pour juger les espacements et la lisibilité. | Mineur | — | M |

## 5 idées de fonctionnalités

Toutes viennent de ta réserve d'idées (`docs/produit.md`) : rien n'est construit sans ton accord.

| Idée | Problème réglé | Effort | Impact |
|---|---|---|---|
| **Sessions qui se répètent** (« chaque jeudi 19h ») | La carte vide au lancement : quelques sessions régulières suffisent à la remplir sans tout recréer chaque semaine. | M | Élevé |
| **« Je viens avec 1 pote »** | Les débutants osent plus venir à deux ; aujourd'hui, l'ami doit avoir l'app et un compte. | S | Élevé |
| **« Rejouer avec eux »** après la session | Transformer une bonne session en habitude, en un appui. | M | Élevé |
| **Liste d'attente sur une session complète** | Aujourd'hui, session complète = impasse. ⚠️ Demande une 5ᵉ sorte de notification, ce que tu avais écarté : à trancher. | M | Moyen |
| **Réponses rapides dans le chat** (« J'arrive », « En retard ») | Prévenir le groupe en un appui, au bord du terrain. | S | Moyen |

## TOP 5 à faire en premier

1. **S1 — Cacher qui va où.** Aujourd'hui, n'importe quel compte peut suivre les sessions d'une personne précise : c'est le point le plus sensible pour une app où on rencontre des inconnus.
2. **S2 — Fermer la faille de la limite de sessions.** Une ligne de base de données suffit, et ça empêche de remplir la carte de fausses sessions.
3. **S3 — Limiter les Catchs** (par exemple 10 sessions à venir par compte). Sinon une seule personne peut bloquer toutes les sessions.
4. **S4 — Trancher l'âge minimum, relire les textes légaux, créer une adresse de contact dédiée.** Obligatoire avant les stores et avant d'ouvrir à des inconnus.
5. **B1 — Une vraie séance de test sur ton iPhone** contre la vraie base (créer, catcher, écrire, recevoir un rappel). Beaucoup de choses n'ont jamais tourné en vrai.

Juste après : B2 et B3 (petites corrections, gros gain de confiance), puis U1 et U2.

## Pourquoi chaque point compte (une phrase)

- **S1** : un ex ou un harceleur bloqué pourrait savoir où tu joues ce soir.
- **S2** : la limite anti-spam ne protège rien si on peut la contourner.
- **S3** : une seule personne mal intentionnée peut rendre l'app inutilisable pour tout le monde.
- **S4** : avec des mineurs qui rencontrent des adultes, les règles doivent être claires et assumées par toi.
- **S5** : des notifications en rafale, c'est la meilleure façon de faire désinstaller l'app.
- **S6** : une session sans organisateur ne peut plus être modifiée ni annulée.
- **S7** : moins de droits inutiles, moins de mauvaises surprises le jour où quelque chose change.
- **S8** : Supabase le signale ; c'est du rangement, sans danger aujourd'hui.
- **S9** : un code valable trop longtemps ou trop d'essais rend la connexion devinable.
- **S10** : rien à faire, ça se réglera à la prochaine mise à jour d'Expo.
- **B1** : un bug trouvé par toi coûte 5 minutes ; trouvé par tes premiers utilisateurs, il coûte leur confiance.
- **B2** : l'organisateur croit avoir dit « je ne peux plus » et les autres se retrouvent sans organisateur.
- **B3** : la personne invitée croit que la session est annulée et ne vient pas.
- **B4** : un écran vide sans explication donne l'impression que l'app est cassée.
- **B5** : dans un parc avec une barre de réseau, le chat rame.
- **B6** : sans tests sur le Catch, une correction peut casser le cœur de l'app sans qu'on le voie.
- **B7** : sans clé, les amis sur Android verront une carte grise.
- **B8** : du ménage pour ne pas se tromper de table plus tard.
- **U1** : sur une carte, rater la pastille au doigt, c'est frustrant ; et l'app doit être utilisable par les malvoyants.
- **U2** : se déplacer vers un terrain qui n'existe pas, c'est un utilisateur perdu.
- **U3** : un avatar illisible en mode sombre fait négligé.
- **U4** : une bonne partie de Bruxelles ne lira pas l'app en français.
- **U5** : cet audit lit le code ; l'œil sur les vrais écrans reste indispensable.
