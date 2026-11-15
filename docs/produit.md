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
- **Messagerie** : prévue dans le design, mais construite en dernier. Au début, l'onglet peut renvoyer vers le groupe WhatsApp de la session.
- **Lien d'invitation** : ouvre une page web lisible sans l'app, avec « Rejoindre la session ».
- **Confiance** : taux de présence visible sur les profils, rappel 3h avant, annulation libre jusqu'à 3h avant.
- **Obligations stores** : bouton signaler / bloquer et suppression de compte dès la v1.

## Fonctionnalités prévues plus tard (v2)

Badge « En direct » animé avancé, bouton « je cherche un joueur » avec notifications limitées, système anti-lapin complet, badge Organisateur, chat intégré.

## Choix techniques

- **Expo (React Native)** : un seul code pour iPhone et Android, test immédiat sur téléphone avec Expo Go.
- **Supabase** : base de données, comptes (Apple, Google, e-mail), notifications, recherche « autour de moi ».
- **Animations** : react-native-reanimated, react-native-gesture-handler, expo-haptics (voir le design system).
- **Tests avec les potes** : TestFlight sur iPhone (compte Apple Developer déjà disponible), lien d'installation sur Android.
- Environnement de Maxime : Windows. Les builds iPhone se feront dans le cloud (EAS Build).

## Plan de construction

Une fonctionnalité à la fois, testée avant de passer à la suivante.

0. Installer les outils (Node.js LTS, Git, VS Code) et créer le projet : `npx create-expo-app@latest catch`
1. Squelette, barre de navigation flottante et design system
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
