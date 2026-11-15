# Produit

## L'idée

Catch sert à sortir de chez soi : faire du sport et rencontrer du monde. L'angle est « sortir et rencontrer des gens », pas « organiser un match ». Le nom est un jeu de mots avec « attraper » : on **catche** une session comme on attrape une balle.

Concurrents existants (GAMUP, Wiinup, Sportmate…) : aucun ne s'est imposé en Belgique.

## Le vrai risque : la carte vide

Une app de rencontres sportives meurt si personne ne voit de session à la première ouverture. Le travail principal n'est pas le code, c'est de remplir la carte au départ :

- Lancer une seule zone à la fois (Brabant wallon / Bruxelles), puis ville par ville.
- Les potes de Maxime sont les premiers utilisateurs et créent 3 à 5 sessions par semaine, même celles qu'ils feraient de toute façon.
- Ne jamais afficher un écran vide : élargir le rayon, montrer les 7 prochains jours, proposer de créer la première session ou d'être prévenu.
- Ne jamais gonfler la carte avec de fausses sessions.

## Décisions prises

- **Pas de compte pour regarder.** La carte, la liste et le détail sont visibles sans compte. La connexion (Apple, Google ou e-mail) est demandée seulement au moment d'appuyer sur Catch, de créer une session ou d'écrire. Après connexion, retour automatique sur la session et Catch fait automatiquement.
- **Le bouton s'appelle « Catch ».** Après l'appui : « Tu l'as catchée ! ». Quitter = « Annuler ma participation ».
- **Navigation : barre flottante à 4 onglets** dans cet ordre : Créer · Carte (au milieu, écran principal) · Messages · Profil.
- **Carte en plein écran** avec les sessions en pastilles (« Foot · 6 jouent », « Volley · il manque 1 »), transformable en liste.
- **Créer en quelques secondes, sans taper** : tout est pré-rempli (dernier sport, prochain créneau, dernier lieu, nombre de joueurs habituel), choix par tuiles et pastilles, bouton « Relancer ta dernière session ».
- **Sessions « En direct »** : une session commencée qu'on peut encore rejoindre, avec badge rouge.
- **Messagerie interne avant le lancement public** : une conversation par session. Pas de pont WhatsApp durable (il montre le numéro de chacun à des inconnus). Pendant le test entre potes seulement, l'organisateur peut coller un lien WhatsApp facultatif.
- **Lien d'invitation** : ouvre une page web lisible sans l'app, avec « Rejoindre la session ».
- **Confiance** : taux de présence visible sur les profils, rappel 3h avant.
- **Annulation** : libre jusqu'à 3h avant, avec « Annuler » pendant 5 s (les autres ne sont prévenus qu'après ces 5 s). À moins de 3h : une confirmation factuelle, sans culpabiliser. Le seuil de 3h est une hypothèse à ajuster avec les tests.
- **Notifications** : 4 types, réglables un par un, demandés après le premier Catch : rappel 3h avant (« Je viens » / « Je ne peux plus »), changement sur ma session, nouveau message, nouvelle session de mon sport (sur accord explicite, 1 par jour maximum). Pas de résumé quotidien.
- **Catch** : la célébration « Tu l'as catchée ! » part après la réponse du serveur, pour ne jamais fêter une place déjà prise.
- **Direction visuelle** : Chaleur (rouge et orange), avec mode sombre dès la v1 (automatique selon le téléphone, réglage dans Profil).
- **Création** : la première fois, rien n'est pré-rempli : 3 choix seulement (sport, quand, où).
- **Paiement** : prix indicatif payé sur place, pas de paiement dans l'app.
- **Obligations stores** : bouton signaler / bloquer, contact visible et suppression de compte dès la v1, dans l'app et par un lien web (exigé par Google Play).
- **Niveau d'exigence** : la v1 est un vrai produit, fini et fiable sur ce qu'il fait. On n'ajoute pas de variantes expérimentales (phrase à trous, grille à peindre, balayage).

## Rendre Catch amusant

Le fun, c'est le terrain, pas l'écran. L'app donne envie d'y aller, fête le moment où on s'engage et fait revenir après. On récompense le fait de jouer, jamais le fait d'ouvrir l'app.

- **Le Catch est un vrai geste** : balle qui vole et qu'on attrape, rebond, vibration, « Tu l'as catchée ! ». C'est le moment signature, à soigner à fond (étape 4).
- **Une carte qui bouge** : pastilles « En direct » qui pulsent, « il manque 1 » qui ressort, avatars des inscrits visibles.
- **« Il manque 1 joueur » comme mission** : celui qui catche sauve la session. Notification dédiée (étape 8).
- **L'après-session** : écran « C'était bien ? » avec un tap pour remercier un joueur, bouton « Rejouer avec eux » qui recrée la session la semaine suivante, et les personnes avec qui on a joué visibles sur le profil.
- **Un profil qui raconte une histoire** : sessions jouées, sports essayés, personnes rencontrées, semaines d'affilée. Quelques badges liés à du vrai (premier Catch, premier sport nouveau, 5 sessions complétées, Organisateur).
- **Faire jouer les autres** : l'invitation est un défi avec la session en image, et l'organisateur est prévenu quand quelqu'un catche sa session.
- **Un ton qui joue** : humour dans les états vides, le chargement et les notifications, dans les règles de `ux-writing.md`.
- **À éviter** : classements entre joueurs (ça fait fuir les débutants), points et notifications de relance quotidiennes.

## Fonctionnalités prévues plus tard (v2)

Badge « En direct » animé avancé, bouton « je cherche un joueur » avec notifications limitées, système anti-lapin complet, badge Organisateur, paiement dans l'app.

## Choix techniques

- **Expo (React Native)** : un seul code pour iPhone et Android, test immédiat sur téléphone avec Expo Go. Exception : les notifications push ne marchent pas dans Expo Go sur Android, il faut un build de développement à partir de l'étape 8.
- **Supabase** : base de données, comptes (Apple, Google, e-mail), recherche « autour de moi », messagerie. Les notifications passent par une fonction serveur Supabase + le service push d'Expo, avec un envoi programmé pour le rappel.
- **Animations** : react-native-reanimated, react-native-gesture-handler, expo-haptics (voir le design system).
- **Tests avec les potes** : TestFlight sur iPhone (compte Apple Developer déjà disponible), lien d'installation sur Android.
- Environnement de Maxime : Windows. Les builds iPhone se feront dans le cloud (EAS Build).

## Plan de construction

Une fonctionnalité à la fois, testée avant de passer à la suivante. L'avancement à jour est dans `CLAUDE.md` (« Où en est l'app »).

0. Installer les outils (Node.js LTS, Git, VS Code) et créer le projet Expo (à la racine du dépôt)
1. Squelette, barre de navigation flottante et design system (couleurs clair et sombre dès le départ)
2. Carte des sessions
3. Liste des sessions
4. Détail d'une session et bouton Catch (avec l'animation signature du Catch)
5. Connexion (Apple, Google, e-mail) au moment du Catch
6. Créer une session (première création + pré-remplissage + « Relancer »)
7. Lien d'invitation et page web
8. Notifications (4 types, réglages par type, build de développement)
9. Messagerie interne
10. Signalement, blocage, suppression de compte (app + lien web)
11. Tests : 5 potes, puis 5 inconnus du Brabant wallon, puis re-test après corrections. Indicateur : part des nouveaux qui jouent une session dans les 7 jours.

## Comment Maxime veut travailler

Maxime dirige le produit et ne code pas lui-même. Avancer étape par étape, une fonctionnalité à la fois, avec du code complet prêt à copier, les commandes exactes, une explication en une ou deux phrases par partie, et corriger directement les erreurs qu'il colle. Réponses courtes, en français, ton décontracté.
