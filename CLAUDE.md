# Catch — contexte pour Claude

App mobile (Expo + Supabase) pour faire du sport et rencontrer des gens près de chez soi. Lancement local : Brabant wallon / Bruxelles. Équipe d'une personne.

## À lire d'abord

- `docs/produit.md` : décisions produit, choix techniques, plan de construction
- `docs/design-system.md` : couleurs clair et sombre, typo, navigation, animations, vibrations
- `docs/ux-writing.md` : ton, règle du mot « catch », glossaire
- `docs/recherches.md` : résumé des recherches UX et de l'audit concurrents
- `design/laboratoire-ux/` : avant de construire ou de retoucher un écran, regarder le pattern correspondant et sa variante recommandée (page Synthèse dans `src/app.js`, fiches dans `src/mod1.js` à `mod7.js`)
- `AGENTS.md` : règles Expo (ne pas se fier à sa mémoire, lire la doc de la version installée)

## Où est quoi

| Dossier | Contenu |
| --- | --- |
| racine (`src/`, `app.json`, `package.json`…) | **L'app** (Expo SDK 58, expo-router, TypeScript). Il n'y a qu'une seule app : l'ancien dossier `mobile/` a été supprimé |
| `docs/` | Décisions et règles |
| `design/` | **Design de référence** (direction « Chaleur ») : captures dans `apercus/`, pictos SVG dans `pictos/` |
| `design/laboratoire-ux/` | **Laboratoire UX, à garder et à consulter** : 40 patterns, une centaine de variantes jouables, une recommandation par pattern et une page Synthèse. C'est la réserve d'idées pour rendre l'app plus agréable. Sources dans `src/`, version publiée : https://claude.ai/artifact/XnGqqCVsjx5U1CSBRzKAHR. 10 corrections d'audit pas encore appliquées |
| `emails/` | Modèles d'e-mails de connexion (code à 6 chiffres, bienvenue) |
| `supabase/migrations/` | SQL appliqué à la base |

Les fichiers `design/canvas/*.dc.html` sont générés par `design/canvas/generer_design.py` : modifier le script, pas les fichiers générés.

## Où en est l'app (mis à jour le 15 novembre 2026)

Plan complet dans `docs/produit.md`.

- [x] 0. Projet Expo
- [x] 1. Squelette, barre flottante à 4 onglets, thème clair et sombre (réglage Auto / Clair / Sombre et Vibrations dans Profil)
- [x] 2. Carte des sessions · 3. Liste avec filtres · 4. Détail, geste Catch, « Tu l'as catchée ! », annulation
- [~] 5. Connexion : e-mail (code à 6 chiffres puis prénom) fait et branché sur Supabase. Apple configuré mais à tester dans un build EAS (bouton masqué dans Expo Go). Google à faire
- [x] 6. Créer une session : écran fait (tuiles, roulettes, lieu sur la carte), la session est publiée sur Supabase. Reste « première création en 3 choix » à vérifier
- [x] Vraies données : plus aucune session d'exemple. Sessions, création, Catch et annulation passent par Supabase ; la carte affiche « Rien à 5 km pour l'instant » quand il n'y a rien, « Pas de réseau » si la lecture échoue. Le Catch n'est fêté qu'après la réponse du serveur. Une session que son dernier inscrit quitte disparaît tout de suite et éclate sur la carte (`PastilleQuiEclate`), idée de Maxime
- [x] 7. Lien d'invitation : bouton « Inviter » (fiche de la carte, détail, « Tu l'as catchée ! ») et page web https://catch-sport.expo.app/session/<id> avec « Rejoindre la session ». La page web est la version web de l'app : l'écran `session/[id]` s'y présente comme une invitation. Pas encore : vraie carte sur le web, « Ouvrir dans l'app » et liens qui ouvrent l'app directement (attendre un vrai build installable)
- [~] 8. Notifications : faites pour 3 types sur 4. **Rappel 3h avant** (« Je viens » / « Je ne peux plus », envoyé par la base toutes les 5 min) et **nouvelle session d'un sport suivi** (sur accord, sports au choix, 1 par jour max). Demandées seulement après un Catch (« Activer le rappel ») ou dans Profil > Notifications. **Jamais testé sur un vrai téléphone : attendre le retour de Maxime.** « Nouveau message » est fait (étape 9). Reste : « changement sur ma session » (à faire quand on pourra modifier ou annuler une session). Pas fait non plus : nettoyage des jetons de téléphones qui n'existent plus
- [x] 9. Messagerie interne : une conversation par session, réservée à ses inscrits. Onglet Messages (liste, non lus, pastille sur l'onglet), écran `messages/[id]` (bulles, envoi optimiste, arrivée en direct), « Écrire au groupe » depuis le détail et « Tu l'as catchée ! », notification « nouveau message » réglable. **Jamais testé sur un vrai téléphone ni contre la vraie base.** Pas fait : recherche dans les messages, « Groupes par sport » du design
- [~] 10. Signalement, blocage, suppression de compte : code fait (16 novembre). Signaler une session (détail) ou un message (appui long dans la conversation, avec « Bloquer » en plus), Profil > « Personnes bloquées » (débloquer), Profil > « Supprimer mon compte » et page web `/supprimer-compte` (exigée par Google Play). Le blocage masque la personne : ses sessions, ses messages, ses notifications ; elle ne peut plus rejoindre les sessions de celui qui l'a bloquée. Les signalements se lisent dans la table `signalements` sur le site Supabase. **La migration `20261116000000_moderation.sql` n'est PAS encore appliquée à la base** (Supabase demande une confirmation à cause du `delete` de la fonction `supprimer_mon_compte` : à confirmer sur le site Supabase ou à appliquer avec le CLI). Reste : appliquer la migration, renseigner `EMAIL_CONTACT` dans `src/constants/liens.ts` (ligne « Nous contacter » masquée tant qu'il est vide), tester sur téléphone, republier le site web · 11. Tests

**Supabase** : projet `fwhewavlrbujnwfbgcdf` (eu-central-1). Notifications : tables `appareils` (jetons push, accès par les fonctions `enregistrer_appareil` / `oublier_appareil`) et `reglages_notifications` ; l'envoi part de la base vers le service push d'Expo (`private.pousser`, extension pg_net) ; le rappel tourne toutes les 5 min (pg_cron, tâche `catch-rappels`) ; un déclencheur sur `sessions` prévient ceux qui suivent le sport. Messagerie : tables `messages` et `lectures`, vue `conversations` (celles du compte connecté, avec dernier message et non lus), messages diffusés en direct (publication `supabase_realtime`), déclencheur `prevenir_message`. Tables `profils` (prénom, recopié automatiquement depuis le compte), `sessions`, `participations` (un Catch = une ligne) ; vue `sessions_visibles` lue par l'app ; fonction `catcher(p_session)` qui vérifie la place (renvoie `ok`, `complete`, `terminee`, `introuvable`). Lecture ouverte à tous, écriture réservée aux comptes connectés. SQL dans `supabase/migrations/`. La table `sessions_ancienne` (vide) est un reste inutilisé, à supprimer depuis le site Supabase. Les outils Supabase demandent une confirmation à Maxime pour tout SQL qui supprime (DROP, DELETE) et l'app iPhone ne l'affiche pas : écrire des migrations qui ne suppriment rien. Créer, catcher et annuler n'ont pas encore été testés contre la vraie base.

Le 15 novembre, une session avait reconstruit l'app de zéro dans `mobile/` sans voir cette version plus avancée. Tout a été regroupé ici ; de `mobile/` on a repris le mode sombre et les réglages du Profil. Si un jour `main` semble en retard sur ce que Maxime décrit, **regarder les autres branches avant de coder**.

**Un seul plan** : celui de `docs/produit.md` (direction Chaleur). L'ancienne piste « liquid glass » (verre gris, étapes A à Z, équipe de trois) a été retirée du dépôt le 15 novembre à la demande de Maxime ; elle reste dans l'historique Git, ne pas la ressortir. Le laboratoire UX (`design/laboratoire-ux/`) n'est **pas** un ancien plan : il fait partie du plan Chaleur et ne doit pas être supprimé. Les idées « fun » et celles de l'audit concurrents sont rangées dans « Idées pas encore décidées » de `docs/produit.md` : ne pas les construire sans son accord.

Pas encore fait : icône et écran de démarrage (ceux d'Expo par défaut), clé Google Maps pour Android (nécessaire pour un build hors Expo Go).

## À faire par Maxime (à lui rappeler de temps en temps)

Noté le 15 novembre à sa demande, pour ne pas oublier. Claude ne peut pas le faire à sa place (suppressions bloquées dans les sessions cloud).

- [ ] Supprimer les vieilles branches sur GitHub (page « Branches » du dépôt) : `ccr-0c4ac0e0-q6kyl6`, `ccr-30ebed49-o1vbis`, `claude/affectionate-fermi-9ydvvu`, `claude/parallel-work-mobile-bshf1m`, `docs/conception-v1`, `maquettes/liquid-glass`. Tout leur contenu est dans `main`.
- [ ] Supprimer la table vide `sessions_ancienne` sur le site Supabase (Table Editor).

## Structure de `src/`

- `app/_layout.tsx` : polices, thème, pile de navigation. `app/(onglets)/` : `creer`, `index` (Carte + Liste), `messages`, `profil`. Par-dessus : `session/[id]` (détail), `connexion`, `catchee/[id]`, `messages/[id]` (conversation), `notifications` (réglages)
- `components/` : `carte-sessions` (react-native-maps : Apple Plans sur iPhone, Google Maps sur Android), `pastille-session`, `fiche-session`, `liste-sessions`, `bouton-catch`, `choix-lieu`, `roulette`, `barre-haut`, `barre-navigation`… Les fichiers `.web.tsx` remplacent les cartes par un fond uni, pour vérifier dans un navigateur
- `constants/theme.ts` : palettes `clair` et `sombre`, polices, rayons, ressorts. `constants/carte.ts` : thème du fond de carte
- `lib/theme.tsx` : `useCouleurs()`, `useTheme()`, `useStyles(creerStyles)`. `lib/sessions.tsx` : sessions et Catchs partagés. `lib/compte.tsx` + `lib/supabase.ts` : connexion. `lib/messages.tsx` : conversations, non lus, lecture, envoi et écoute en direct. `lib/notifications.ts` + `components/gestion-notifications.tsx` : permission, jeton, réglages, réaction quand on touche une notification. `lib/haptics.ts` : seul endroit qui déclenche une vibration
- `donnees/` : pictos (générés par `scripts/generer_pictos.py`), sports, forme d'une session

Règles de code :
- Noms de fichiers, composants et variables en français.
- **Aucune couleur en dur dans un écran.** Chaque fichier déclare `const creerStyles = (c: Palette) => StyleSheet.create({…})` et chaque composant fait `const styles = useStyles(creerStyles)` ; pour une couleur hors styles, `const c = useCouleurs()`. Sur du rouge on écrit en `c.surRouge`, sur un fond encre en `c.surEncre` (jamais `c.carte` comme couleur de texte).
- React Compiler est actif : avec Reanimated écrire `valeur.set()` / `valeur.get()`, pas `.value`.
- Installer un paquet avec `npx expo install`. Avant chaque commit : `npx tsc --noEmit` et `npx expo lint`.

## Tester et publier

- Compte Expo : organisation `catch-sport-team` (le projet a été transféré le 16 novembre depuis le compte personnel `max-code-menace`, pour pouvoir inviter les amis de Maxime), projet `catch` (ID `f78ef305-c7a4-4272-944a-be41255b2319`). Le projet est privé : pour l'ouvrir dans Expo Go il faut être membre de l'organisation. Les amis qui codent peuvent aussi simplement cloner le dépôt et lancer `npx expo start`.
- Maxime teste sur **iPhone avec Expo Go**, sans PC. Après chaque étape, publier sur le canal `main` :
  `npx eas-cli@latest update --branch main --message "…" --platform ios --environment development --non-interactive`
  (le canal `preview` contient d'anciennes publications, ne plus l'utiliser)
- **Site web (page d'invitation)** : après tout changement qui touche l'écran d'une session, la connexion ou le Catch, remettre le site en ligne : `npx expo export -p web` puis `npx eas-cli@latest deploy --prod --non-interactive`. Adresse dans `src/constants/liens.ts`. Le découpage du code par écran est désactivé sur le web (`asyncRoutes: false` dans `app.json`), sinon la page d'une session reste blanche. L'environnement cloud « catch » autorise `eas.expo.app` (envoi) et `catch-sport.expo.app` (vérification).
- La version d'exécution doit rester `sdkVersion` dans `app.json` (nécessaire pour Expo Go).
- Vérifier soi-même avant de publier : `npx expo start --web` puis captures de chaque écran en clair et en sombre (Playwright, `colorScheme`). Le bac à sable n'atteint pas Supabase : dans Playwright, simuler la réponse de `**/rest/v1/sessions_visibles**` (`page.route`) pour voir des sessions, sans jamais rien écrire dans la vraie base.
- Accès Expo : l'environnement cloud « catch » contient le jeton (injecté vers `api.expo.dev`). Si la session tourne sur un autre environnement, basculer dessus (`switch_environment`), puis lancer les commandes EAS avec `EXPO_TOKEN=dummy` devant. Ne jamais faire coller un jeton dans la conversation. La doc `docs.expo.dev` n'est pas joignable : lire les types dans `node_modules/`.
- Notifications push : elles marchent dans Expo Go sur iPhone (c'est ce que Maxime utilise), pas dans Expo Go sur Android (il faudra un build de développement pour tester Android).

## Git

Tout le travail doit finir dans `main` (les sessions cloud repartent de `main` et sont effacées). Pousser après chaque étape. Pas de pull request sans que Maxime le demande.

## Décisions à ne pas rediscuter

Détail dans `docs/produit.md`. En bref : pas de compte pour regarder · direction Chaleur · mode sombre dès la v1 · barre flottante sur mesure · création pré-remplie avec une première création en 3 choix · annulation libre jusqu'à 3 h avant puis confirmation factuelle · messagerie interne avant le lancement public · 4 types de notifications, pas de résumé quotidien · célébration du Catch après la réponse du serveur · pas de paiement dans l'app · pas de variantes expérimentales · pas de dark patterns · pas de fausses sessions · la v1 est un vrai produit fini, pas une démo.

## Façon de travailler

Maxime dirige le produit et ne code pas. Claude code directement dans le repo, une fonctionnalité à la fois, teste, pousse, publie sur Expo, puis explique en une ou deux phrases ce qui a changé et ce qu'il faut regarder sur le téléphone. Réponses courtes, en français, ton décontracté, jargon expliqué. Maxime est sur Windows (souvent sans accès à son PC) et sur iPhone.

**Tenir ce fichier à jour** : cocher l'étape et mettre à jour « Où en est l'app » à la fin de chaque étape.
