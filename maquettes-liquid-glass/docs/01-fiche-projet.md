# Catch — Fiche projet (étape A)

14 novembre 2026 · copie du document d'origine (écrit sous le nom de travail « Allez »), avec les décisions prises depuis.

## Résumé

Catch est une appli mobile avec une carte : tu vois les sessions de sport près de chez toi, tu en rejoins une en un geste, ou tu crées la tienne quand il te manque des joueurs.

Le but n'est pas la performance. C'est de faire sortir les gens de chez eux, de les faire bouger et de leur faire rencontrer du monde, sans être une appli de drague.

- **Nom :** Catch (à vérifier avant le lancement public : nom de domaine, App Store, marque)
- **Villes de départ :** Bruxelles, Louvain-la-Neuve, Strasbourg et Delft (Pays-Bas)
- **Méthode :** on avance de A à Z, une étape à la fois, et chaque étape est validée avant la suivante.

## Le problème et la promesse

Beaucoup de gens ont envie de bouger, mais il leur manque des personnes avec qui y aller.

- Un groupe de potes veut faire un foot, mais il manque 4 joueurs et le groupe WhatsApp ne répond pas.
- Quelqu'un vient d'arriver en ville et ne connaît personne.
- Un débutant a envie de s'y remettre, mais il a peur de ne pas avoir le niveau.
- Les applis qui existent sont surtout faites pour la compétition et la réservation de terrains (foot à 5, padel), et presque personne ne les connaît en Belgique.

**La promesse :** tu ouvres l'appli, tu trouves quelque chose à faire près de chez toi aujourd'hui, et tu y vas, même si tu ne connais personne.

## Le public

Au lancement, la cible principale, ce sont les 18-35 ans : les étudiants et les jeunes actifs.

| Profil | Sa situation | Ce qu'il cherche dans Catch |
| --- | --- | --- |
| Étudiant (Louvain-la-Neuve, Bruxelles, Strasbourg) | En kot, du temps le soir, envie de voir du monde | Des sessions faciles et gratuites, près de chez lui |
| Jeune actif nouveau en ville ou expat | Ne connaît presque personne | Rencontrer des gens, avec un rendez-vous régulier |
| Celui qui organise pour sa bande | Il manque toujours 1 ou 2 joueurs | Compléter son équipe vite |
| Débutant qui veut s'y remettre | Peur du niveau et du regard des autres | Des sessions « tous niveaux », sans pression |
| Club ou groupe partenaire (run crew, club de quartier) | Veut plus de monde à ses sorties | Se faire connaître gratuitement |

**18 ans minimum** au lancement, parce que l'appli fait se rencontrer des inconnus.

## Comment l'appli fonctionne

Il y a deux chemins vers le terrain : rejoindre une session qui existe, ou créer la sienne quand rien ne convient.

1. Ouvrir l'appli
2. Voir la carte (même sans compte)
3. Ça me plaît ? Oui : rejoindre (compte créé en 1 minute). Non : créer ma session, puis partager le lien.
4. Chat du groupe
5. Aller jouer
6. Dire qui est venu (note de fiabilité)

## Qui a accès à quoi

Tout le monde peut regarder, mais il faut un compte pour participer.

| Rôle | Qui | Ce qu'il peut faire | Ce qu'il ne peut pas faire |
| --- | --- | --- | --- |
| Visiteur | N'importe qui, sans compte | Voir la carte et les sessions, ouvrir un lien partagé | Rejoindre, voir les profils, lire le chat |
| Membre | Toute personne inscrite | Rejoindre ou créer une session, discuter dans le groupe, signaler ou bloquer | Voir où se trouvent les autres membres |
| Organisateur | Le membre qui a créé la session | Modifier ou annuler la session, choisir les places et le niveau, retirer un participant | Gérer les sessions des autres |
| Partenaire | Club, run crew, salle, association (compte vérifié) | Publier des événements réguliers avec un badge « Partenaire » | Voir les données des membres |
| Responsable de ville | Un par ville | Valider les partenaires, traiter les signalements, voir les chiffres de sa ville | Agir sur une autre ville |
| Admin | Math | Tout : réglages, toutes les villes, tous les comptes | — |

Règle importante : la carte montre les sessions, jamais la position des personnes.

**L'équipe :** Mathias s'occupe du marketing et de la vision, Math du code et de la vision, Loup des images, du style et du logo.

## Fonctions de la V1 et pour plus tard

**V1, le minimum pour lancer**

- La carte comme écran d'accueil, plus une vue en liste, avec des filtres par sport, par jour et par distance
- La fiche d'une session : sport, lieu, heure, places restantes (« il manque 2 »), niveau et qui vient déjà
- Rejoindre en un geste, avec une liste d'attente quand c'est complet
- Créer un team-up en trois touches
- Des sessions gratuites ou payantes : pour un terrain loué, le prix par personne est affiché. En V1, on paie l'organisateur en dehors de l'appli (Payconiq, virement) ; le paiement dans l'appli viendra plus tard (à valider)
- L'option « session réservée aux femmes »
- Un lien à partager sur WhatsApp, que l'on peut ouvrir sans avoir l'appli
- Un chat de groupe pour chaque session
- Des messages privés, avec des garde-fous
- Des notifications : quelqu'un a rejoint, rappel avant la session, session annulée, une place s'est libérée
- Un profil simple : prénom, photo, sports préférés, ville
- La fiabilité : après la session, l'organisateur indique qui est venu
- Signaler ou bloquer quelqu'un
- Les événements des partenaires, avec leur badge
- Trois langues : français, néerlandais et anglais

**Plus tard**

- Les sessions qui reviennent chaque semaine
- Les équipes et les amis (« rejouer avec »)
- Les alertes du genre « préviens-moi quand il y a du spikeball près de chez moi »
- Le paiement et la réservation du terrain directement dans l'appli
- Le prêt de matériel (un kit de spikeball, un ballon)
- Une page web publique par ville, pour être trouvé sur Google

## Confiance, sécurité et règles

- **Messages privés avec des garde-fous :** on peut écrire en privé seulement à quelqu'un avec qui on a déjà joué, ou qui a accepté la demande. Chacun peut couper ses messages privés.
- **Pas de swipe sur des personnes :** on swipe des parties, pas des profils. On choisit une activité, pas une personne.
- **Lieux publics uniquement :** parcs, terrains, salles. Pas d'adresses privées.
- **Position des membres jamais montrée :** seules les sessions apparaissent sur la carte.
- **18 ans minimum** au lancement.
- **Fiabilité :** après 3 absences sans prévenir, la personne reçoit un avertissement, puis une pause (à régler).
- **Signaler et bloquer** en deux gestes, dans le chat comme dans les messages privés. Le responsable de ville traite les signalements.
- **Sessions réservées aux femmes :** l'organisatrice peut réserver sa session aux femmes. À réfléchir : comment éviter les abus.
- **Vie privée (RGPD) :** données hébergées en Europe, localisation demandée seulement pendant l'utilisation, compte supprimable en un clic.

## Concurrence et ce qui nous rend différents

L'idée existe déjà ailleurs, mais aucune appli ne s'est imposée en Belgique. Movenco est la plus proche.

| Appli | Ce qu'elle fait | Ce qu'on en retient |
| --- | --- | --- |
| [Movenco](https://mwm.ai/apps/movenco/6760430310) | Carte de sessions créées par la communauté, sessions « flash » en temps réel | Concurrent direct : à étudier en détail |
| [Sportmate](https://lespepitestech.com/startup-de-la-french-tech/sportmate) | Fil d'annonces (« il manque 2 joueurs ») et recherche de partenaires par sport | Plutôt un réseau social qu'une carte |
| [Poteau](https://iphonesoft.fr/2026/10/16/poteau-app-trouver-match-foot-5-padel-adapte-niveau) | Foot à 5 et padel, niveau de chaque joueur, avis sur la ponctualité | Bonne idée de fiabilité, mais centré sur la compétition |
| [Pickup Play](https://apps.apple.com/us/app/id6741437411) (États-Unis) | Multi-sports, spikeball compris, partage dans WhatsApp même sans compte | Le modèle du lien partagé |
| [Foot 24-7](https://bx1.be/?p=342485) (Bruxelles) | Organiser du foot et du futsal, trouver des joueurs | Une appli locale ne suffit pas sans communauté |

**Ce qui nous rend différents**

1. Des sorties fun et ouvertes à tous les niveaux (spikeball, pétanque, frisbee, course), pas de la compétition.
2. Une carte jamais vide, grâce aux événements des partenaires dès le premier jour.
3. Un lancement ville par ville, avec une vraie personne responsable dans chaque ville.
4. On peut rejoindre depuis un lien WhatsApp, sans devoir télécharger d'abord.

## Lancement ville par ville

Chaque ville a sa personne responsable, et une ville ne s'ouvre que quand sa carte est déjà remplie. Bruxelles et Louvain-la-Neuve d'abord, puis Strasbourg et Delft.

| Ville | Langues | Premiers partenaires à contacter |
| --- | --- | --- |
| Bruxelles | Français, néerlandais, anglais | Run crews ([BXL Run Crew](https://sport.brussels/en/activities/running-met-brussels-run-crew-mon-thu), [Animo Running Club](https://www.elle.be/fr/?p=407212)), [Park'cours](https://www.brusselstimes.com/213716/at-your-own-pace-brussels-launches-its-own-park-runs), clubs de quartier |
| Louvain-la-Neuve | Français | Cercles étudiants, kots à projet, groupes sportifs de l'université (à lister) |
| Strasbourg | Français | Associations étudiantes, clubs de course (à lister) |
| Delft (Pays-Bas) | Néerlandais, anglais | À lister |

**La règle pour chaque responsable avant d'ouvrir sa ville**

- 10 à 15 événements réguliers de partenaires sur la carte, avec leur accord
- 2 ou 3 sessions par semaine organisées par le responsable lui-même
- Le deal avec les partenaires : « on affiche votre événement gratuitement et on vous amène du monde »

**Comment on fait connaître l'appli**

1. Bêta fermée entre potes : on vérifie que tout marche.
2. Ouverture de la ville, avec le partage de liens dans les groupes WhatsApp.
3. Vidéos sur TikTok et Instagram, filmées pendant les sessions (« on ne se connaissait pas il y a une heure »).
4. Ambassadeurs dans les cercles, les kots et les salles, et des QR codes près des terrains publics.
5. Un peu de budget pub seulement quand la ville tourne toute seule.

## Technique (propositions à valider)

| Morceau | Proposition | Pourquoi |
| --- | --- | --- |
| Appli mobile | Un seul code pour iPhone et Android (React Native avec Expo, ou Flutter) | On écrit l'appli une fois au lieu de deux |
| Serveur et base de données | Supabase, hébergé en Europe (ou un serveur en Rust comme Raven) | Comptes, chat en direct et recherche par distance déjà prévus |
| Carte | Mapbox, ou MapLibre avec OpenStreetMap | Le prix de la carte grimpe vite avec le nombre d'utilisateurs : à comparer |
| Notifications | Le service de notifications d'Expo ou de Firebase | Gratuit au début |
| Page d'un lien partagé | Une petite page web | Pour voir et rejoindre une session sans avoir l'appli |

Les prix exacts de chaque service sont à vérifier avant de choisir.

## Argent

Au début, Catch est gratuit et sans pub. Une règle ne changera jamais : rejoindre une session restera toujours gratuit.

Pistes pour plus tard :

- **Partenaires sponsorisés :** des marques de sport, ou un bar pour l'après-match, mis en avant sur la carte
- **Commission** sur la réservation de terrains payants (foot à 5, padel)
- **Petit abonnement** pour des options en plus (alertes, sessions privées qui reviennent chaque semaine)
- **Événements payants** organisés par Catch (tournoi de spikeball, grande journée sport)

## Décisions prises

| Question | Décision |
| --- | --- |
| Nom | Catch |
| Âge minimum | 18 ans |
| Ville aux Pays-Bas | Delft |
| Ordre de lancement | Bruxelles et Louvain-la-Neuve, puis Strasbourg et Delft |
| Messages privés en V1 | Oui, avec garde-fous |
| Sessions réservées aux femmes | Oui |
| Gratuit ou payant en V1 | Les deux |
| Couleur principale | Pas encore décidée (orange par défaut dans les maquettes) |
| Rôles | Mathias : marketing et vision · Math : code et vision · Loup : images, style, logo |

## Sources

- [Movenco — fiche de l'appli](https://mwm.ai/apps/movenco/6760430310)
- [Sportmate — Les Pépites Tech](https://lespepitestech.com/startup-de-la-french-tech/sportmate)
- [Poteau — iPhoneSoft](https://iphonesoft.fr/2026/10/16/poteau-app-trouver-match-foot-5-padel-adapte-niveau)
- [Pickup Play — App Store](https://apps.apple.com/us/app/id6741437411)
- [Foot 24-7 — BX1](https://bx1.be/?p=342485)
- [BXL Run Crew — sport.brussels](https://sport.brussels/en/activities/running-met-brussels-run-crew-mon-thu)
- [Clubs de course à Bruxelles — Elle Belgique](https://www.elle.be/fr/?p=407212)
- [Park'cours — Brussels Times](https://www.brusselstimes.com/213716/at-your-own-pace-brussels-launches-its-own-park-runs)
