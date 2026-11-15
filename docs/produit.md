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
- **Look : liquid glass gris**, rouge Catch `#C8361C` comme seule couleur d'action (voir le design system). Fusion de la v1 et des maquettes liquid glass.
- **Navigation : barre en verre fumé à 3 onglets** : Carte (écran principal) · Swipe · Messages. Au-dessus, un bouton « + Créer une session ». Le profil est une bulle avec l'initiale en haut à droite. La carte a un bouton Carte/Liste.
- **Swipe : l'onglet est dessiné, l'écran est en v2.** En v1, la barre n'affiche que Carte et Messages ; l'onglet apparaît quand le swipe est construit.
- **Pas d'écran Bienvenue.** On arrive directement sur la carte. Les sports sont demandés au premier Catch (écran « Tu joues à quoi ? » juste après la connexion, avec « Passer »).
- **Carte en plein écran** avec les sessions en pastilles (« Foot · 6 jouent », « Volley · il manque 1 »), transformable en liste.
- **Créer en quelques secondes, sans taper** : tout est pré-rempli (dernier sport, créneau, dernier lieu), choix par tuiles et pastilles, bouton « Relancer ta dernière session ». La phrase « Il nous manque 2 joueurs pour le spikeball » s'écrit toute seule avec un nombre par défaut selon le sport (réglable avec − / +) ; on publie avec « Publier la session ».
- **Sessions « En direct »** : une session commencée qu'on peut encore rejoindre, avec badge rouge.
- **Messagerie** : prévue dans le design, mais construite en dernier. Au début, l'onglet peut renvoyer vers le groupe WhatsApp de la session.
- **Lien d'invitation** : ouvre une page web lisible sans l'app, avec « Rejoindre la session ».
- **Confiance** : taux de présence visible sur les profils, rappel 3h avant, annulation libre jusqu'à 3h avant.
- **Obligations stores** : bouton signaler / bloquer et suppression de compte dès la v1.

## Fonctionnalités prévues plus tard (v2)

Swipe (une session à la fois, oui ou non), après-partie (GG aux joueurs, série de semaines, « On remet ça ? »), rencontres (gens croisés, messages privés), alerte « Il manque 1 joueur à 400 m », badge « En direct » animé avancé, bouton « je cherche un joueur » avec notifications limitées, système anti-lapin complet, badge Organisateur, chat intégré.

## Points à trancher

- Dans Créer, « Il nous manque X joueurs » : on garde X comme nombre de places à prendre (le total est donc l'organisateur + X). À confirmer avant l'étape 6.
- Le flou du verre coûte du GPU sur les vieux Android : à tester dès l'étape 1, avec un repli en aplat si besoin.

## Choix techniques

- **Expo (React Native)** : un seul code pour iPhone et Android, test immédiat sur téléphone avec Expo Go.
- **Supabase** : base de données, comptes (Apple, Google, e-mail), notifications, recherche « autour de moi ».
- **Animations** : react-native-reanimated, react-native-gesture-handler, expo-haptics (voir le design system).
- **Tests avec les potes** : TestFlight sur iPhone (compte Apple Developer déjà disponible), lien d'installation sur Android.
- Environnement de Maxime : Windows. Les builds iPhone se feront dans le cloud (EAS Build).

## Plan de construction

Une fonctionnalité à la fois, testée avant de passer à la suivante.

0. Installer les outils (Node.js LTS, Git, VS Code) et créer le projet : `npx create-expo-app@latest catch`
1. Squelette, barre de navigation en verre fumé et design system
2. Carte des sessions
3. Liste des sessions
4. Détail d'une session et bouton Catch
5. Connexion (Apple, Google, e-mail) au moment du Catch
6. Créer une session
7. Lien d'invitation et page web
8. Notifications (rappel avant la session)
9. Messagerie
10. Signalement, blocage, suppression de compte, puis envoi en test aux potes

## Comment Maxime veut travailler

Maxime dirige le produit et ne code pas lui-même. Avancer étape par étape, une fonctionnalité à la fois, avec du code complet prêt à copier, les commandes exactes, une explication en une ou deux phrases par partie, et corriger directement les erreurs qu'il colle. Réponses courtes, en français, ton décontracté.
