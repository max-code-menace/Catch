# Design system

Liquid glass gris : une matière de verre translucide qui prend la couleur de la carte, une seule couleur vive (le rouge Catch) pour l'action. Aperçu : [design/apercus/systeme.png](../design/apercus/systeme.png). Version 2, fusion de la v1 (rouge et orange, fond chaud) et des maquettes liquid glass de `maquettes-liquid-glass/`.

## Couleurs

| Nom | Valeur | Usage |
| --- | --- | --- |
| Rouge Catch | `#C8361C` | Seule couleur d'action : Catch, Publier la session, Rejoindre, Inviter. Texte blanc dessus |
| Rouge appuyé | `#A92C16` | Bouton rouge pressé |
| Encre | `#1C1C1E` | Texte principal, et tout ce qui est sélectionné (onglet, filtre, sport, toggle, pastille en direct) |
| Texte secondaire | `#4A4A50` | Sous-titres, aides |
| Verre clair | `rgba(242,242,247,0.62–0.86)` | Panneaux, boutons, cartes. Flou 24–30 px, saturation 180 %, liseré blanc `rgba(255,255,255,0.6)` |
| Verre fumé | `rgba(44,44,48,0.66)` | Barre de navigation uniquement. Flou 24 px, saturation 180 % |
| Fond d'icône | `rgba(255,255,255,0.55)` | Pastilles et tuiles posées sur le verre |
| Sol de carte | `#DDE3E6` | Parcs `#B9D3A8`, eau `#9CC6E0`, rues blanches |

Règles :

1. Un seul aplat de couleur par écran : le geste attendu (Catch, Publier la session, Rejoindre). « Créer une session » est donc en verre clair, jamais en rouge.
2. Le reste est en gris, noir ou blanc. Ce qui est sélectionné passe en noir, jamais en rouge.
3. Un statut n'est jamais porté par la couleur seule : toujours un mot ou une icône. « En direct » = pastille noire avec point blanc qui pulse ; « Il manque X joueurs » = pastille en verre cerclée de noir avec loupe ; places libres = ronds vides.
4. Seul ce qui flotte sur la carte a une ombre. Ailleurs, tout est à plat.
5. Contraste texte ≥ 4,5:1. Pas d'emoji.
6. Les pictos des sports restent en couleur : ce sont des illustrations, pas des actions.
7. « Réduire la transparence » (réglage du téléphone) respecté : le verre devient un aplat gris clair ou gris foncé, sans flou.

## Typographie

- **Tout en Inter** (400, 500, 600, 700), chiffres alignés. Titres en 700 avec un interlettrage serré (−0,03 em). Bricolage Grotesque est abandonné.
- Tailles : titre d'écran 32, titre de session 34 (détail) ou 24 (carte), texte 15–16, aides 13, pastilles 12–14.
- Capitales seulement pour les petits intitulés espacés (« TES SESSIONS »).

## Mise en page

- Écran de référence : 390 × 844. Marges latérales 16–20 px, 54 px en haut pour la barre d'état.
- Cibles tactiles ≥ 44 px (pastilles de la carte : 40 px, avec zone de toucher agrandie).
- Rayons : pilules et boutons ronds 20–28, panneaux 24–34, boutons rouges 16, feuilles 34 en haut.
- **Barre de navigation** : 3 onglets (Carte · Swipe · Messages) dans une barre en verre fumé flottante (16 px des bords, 26 px du bas, 64 px de haut). Onglet actif : pilule blanche, texte noir.
- **« + Créer une session »** : bouton en verre clair pleine largeur, juste au-dessus de la barre, sur les trois onglets.
- **Profil** : bulle avec l'initiale en haut à droite de Carte, Liste et Messages. Le profil s'ouvre en écran à part (retour en haut à gauche).
- **Haut de la Carte et de la Liste** : zone avec chevron (« Wavre · 5 km ») à gauche, bulle du profil à droite. Dessous : bouton Carte/Liste en verre à gauche, bouton recentrer à droite (carte seulement).
- **Feuilles en verre** (Créer, Connexion, Tes sports, Catch confirmé, Détail) : verre clair opaque à 82–86 %, coins hauts à 34, poignée grise, la carte reste visible au-dessus.
- Swipe : l'onglet est dans la barre, l'écran arrive en v2 (voir `produit.md`).

## Pictos des sports

10 pictos en style flat (couleurs pleines, sans contour, ombre douce) dans [design/pictos/](../design/pictos/) : foot, basket, volley, rugby, spikeball, tennis, badminton, escalade, padel, autre. Générés avec Figma puis harmonisés (rouge Catch dans le volley et le badminton). Le picto est toujours accompagné du nom du sport.

Tailles d'usage : 22 px dans les pastilles de carte (dans un rond blanc), 36 px dans un carré de verre de 48–52 px en liste et messages, 34–36 px dans les tuiles de choix du sport (sélectionnée : tuile noire, picto dans un rond blanc).

## Animations

Règle : chaque animation explique quelque chose, répond en moins de 100 ms, dure 100 à 400 ms et peut être interrompue par le doigt.

| Jeton | Réglage (Reanimated) | Usage |
| --- | --- | --- |
| `spring.snappy` | `{ duration: 250, dampingRatio: 1 }` | Boutons pressés, pastilles, sélections |
| `spring.standard` | `{ duration: 400, dampingRatio: 1 }` | Tout ce qui se déplace |
| `spring.gesture` | `{ duration: 300, dampingRatio: 0.8 }` + vitesse du geste | Feuilles et cartes glissées au doigt |
| `spring.bounce` | `{ duration: 450, dampingRatio: 0.55 }` | Réservé à la balle et aux célébrations |
| `duration.instant / fast / standard / emphasized` | 100 / 150 / 250 / 350 ms | Couleurs, toggles, fondus, entrées de feuilles |
| Bouton pressé | scale 0,96 (0,98 pour les cartes) | Tous les boutons |

- Onglets : fondu 250 ms. Carte ↔ Liste : fondu croisé.
- Skeletons après 300 ms d'attente, balle qui rebondit après 400 ms.
- La balle (noire en v2) est le seul élément qui rebondit.
- Catch et envoi de message en interface optimiste, avec retour en arrière propre en cas d'échec.
- « Réduire les animations » respecté : déplacements remplacés par des fondus, boucles arrêtées.
- Animer uniquement `transform` et `opacity`.

## Vibrations

| Action | iOS (`expo-haptics`) | Android (`performAndroidHapticsAsync`) |
| --- | --- | --- |
| Sélection (pastille, filtre, stepper) | `selectionAsync` | `Segment_Tick` |
| Appui sur Catch | impact Medium | `Virtual_Key` |
| Catch confirmé, session publiée | notification Success | `Confirm` |
| Session complète, butée | notification Warning | `Reject` |
| Erreur | notification Error | `Reject` |
| Jamais | scroll, onglets, frappe, messages reçus, animations automatiques | idem |

Tout passe par un seul module `haptics.ts` qui respecte le réglage « Vibrations » du profil.
