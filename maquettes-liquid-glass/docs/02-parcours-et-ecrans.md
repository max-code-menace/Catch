# Catch — Parcours et écrans

15 novembre 2026 · version à jour. Le document d'origine de l'étape B (5 onglets) a été simplifié depuis : 3 onglets, profil en haut à droite, « Créer un team-up ».

## La navigation

- **3 onglets** en bas, dans une barre en verre fumé : Carte, Swipe, Messages.
- Au-dessus, un bouton à part : **« + Créer un team-up »**.
- Le **profil** est une bulle avec l'initiale, en haut à droite.

## Le parcours complet

1. **Bienvenue** : deux questions (« Tu joues à quoi ? », « Plutôt quand ? »), la ville trouvée grâce à la position. Pas de compte pour regarder la carte.
2. **Carte** : les parties près de toi, maintenant.
3. **Alerte** : « Il manque 1 joueur pour le foot à 400 m » (à dessiner).
4. **Swipe** : une partie à la fois, oui ou non.
5. **Catch** : tu rejoins (« Je suis partant »), ou tu crées un team-up en trois touches.
6. **Partie** : le chat du groupe, avec les réponses rapides (« J'arrive », « 5 min de retard », « J'ai le matériel »).
7. **Après** : un GG aux joueurs, ta série de semaines, « On remet ça ? ».
8. **Messages** : tes parties, les gens rencontrés, les messages privés.
9. **Profil** : en haut à droite.

Le compte n'est demandé qu'au moment de rejoindre ou de créer (écran Inscription : Apple, Google, ou prénom, e-mail, date de naissance, genre).

## Créer un team-up en trois touches

1. Tu touches le sport. La phrase s'écrit toute seule avec le bon nombre par défaut : « Il nous manque 2 personnes pour le spikeball » (3 pour le foot, 1 pour le basket…).
2. Si besoin, tu ajustes avec − / + et tu choisis le moment : Maintenant, Dans 30 min, Ce soir.
3. Tu appuies sur **Catch**. C'est publié sur la carte, et le lien à partager arrive juste après.

Le lieu (« Près de toi ») et le nom de l'organisateur sont remplis automatiquement.

## Ce qu'on a pris aux plus grands

| Idée | Inspirée de | Dans Catch |
| --- | --- | --- |
| Accueil en 2 questions | Duolingo, Spotify | Bienvenue |
| Ce qui se passe maintenant, autour de toi | Snap Map, Uber | Carte |
| Swipe | Tinder, Bumble BFF | Swipe de parties, pas de personnes |
| Invitation par lien, même sans l'appli | Partiful | Lien WhatsApp du team-up |
| Kudos après l'effort | Strava | Le « GG » après la partie |
| Série | Duolingo | Série en semaines, pas en jours |
| Rejouer avec les mêmes | Playtomic | « On remet ça ? » |

**La boucle :** une alerte → Catch en une touche → la partie → les GG et de nouvelles rencontres → ta série et « on remet ça ». Addictif mais sain : série en semaines, pas de fil infini.

## Les écrans actuels

| # | Écran | Fichier | Ce qu'on y fait |
| --- | --- | --- | --- |
| 1 | Inscription | `maquettes/GlassInscription.dc.html` | Créer son compte (Apple, Google ou e-mail) |
| 2 | Bienvenue | `maquettes/GlassBienvenue.dc.html` | Choisir ses sports et ses moments |
| 3 | Carte | `maquettes/GlassCarte.dc.html` | Voir les parties, rejoindre |
| 4 | Swipe | `maquettes/GlassSwipe.dc.html` | Oui ou non, une partie à la fois |
| 5 | Créer un team-up | `maquettes/GlassCreer.dc.html` | Sport, nombre, moment, puis Catch |
| 6 | Partie et chat | `maquettes/GlassPartie.dc.html` | Discuter, inviter, réponses rapides |
| 7 | Après la partie | `maquettes/GlassApres.dc.html` | GG, série, rejouer |
| 8 | Messages et rencontres | `maquettes/GlassMessages.dc.html` | Parties, rencontres, messages privés |
| 9 | Profil | `maquettes/GlassProfil.dc.html` | Stats, série, sports, dispos, inviter |

## À dessiner ensuite

- L'alerte « il manque 1 joueur »
- La fiche d'une partie partenaire (badge « Partenaire »)
- La page web d'un lien partagé
- L'espace partenaire et le tableau du responsable de ville
- Signaler ou bloquer, réglages
