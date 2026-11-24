# Design system

Sobre, chaleureux, rouge et orange. Aperçu : [design/apercus/systeme.png](../design/apercus/systeme.png).

## Couleurs

| Nom | Valeur | Usage |
| --- | --- | --- |
| Rouge Catch | `#C8361C` | Actions principales (bouton Catch, Publier), onglet actif, « En direct » |
| Rouge texte | `#A12A14` | Texte rouge sur fond rouge doux |
| Rouge doux | `#FCE6E0` | Fonds de badges et d'icônes |
| Orange balle | `#E35A0C` | Décor uniquement (balle, « Il manque un joueur ») |
| Orange texte | `#863404` | Texte sur fond orange doux |
| Orange doux | `#FDE6D2` | Badge « Il manque un joueur » |
| Encre | `#1C1412` | Texte principal |
| Texte secondaire | `#6E625C` | Sous-titres, aides |
| Fond chaud | `#FBF8F5` | Fond des écrans |
| Carte | `#FFFFFF` | Cartes, barres |
| Trait | `#E8DFD7` | Bordures |

### Mode sombre

Automatique selon le téléphone, avec un réglage dans Profil (Auto · Clair · Sombre). Aucune couleur écrite en dur dans un écran : tout passe par les jetons.

| Nom | Clair | Sombre |
| --- | --- | --- |
| Rouge Catch | `#C8361C` | `#E8553A` |
| Texte sur le rouge | `#FFFFFF` | `#1C1412` |
| Rouge texte | `#A12A14` | `#FFB4A3` |
| Rouge doux | `#FCE6E0` | `#3A1D16` |
| Orange balle | `#E35A0C` | `#FF8A3D` |
| Orange texte | `#863404` | `#FFC08F` |
| Orange doux | `#FDE6D2` | `#3B2410` |
| Encre | `#1C1412` | `#F5EEE9` |
| Texte secondaire | `#6E625C` | `#A99C94` |
| Fond | `#FBF8F5` | `#14100E` |
| Carte | `#FFFFFF` | `#211B18` |
| Trait | `#E8DFD7` | `#3A312C` |
| Carré des pictos | `#F3EDE8` | `#2A2320` |

En sombre, le texte du bouton Catch est foncé (le blanc ne passe pas le contraste sur ce rouge).

**Erreurs** : pas de deuxième rouge. Une erreur = une icône + un mot, en encre sur fond neutre.

Une seule couleur d'action par écran : le rouge. Un statut n'est jamais porté par la couleur seule (toujours un mot ou une icône). Contraste texte ≥ 4,5:1.

## Typographie

- **Titres** : Bricolage Grotesque, 600–700 (Google Fonts).
- **Texte et interface** : Inter, 400–600.
- Tailles : titre d'écran 28, titre de session 24, texte 15–16, aides 13, pastilles 12–13.

## Mise en page

- Écran de référence : 390 × 844. Marges latérales 20 px.
- Cibles tactiles ≥ 44 px. Rayons : boutons 16, cartes 20, pastilles en pilule.
- **Barre de navigation flottante** : pilule blanche détachée (20 px des bords, 26 px du bas), 4 onglets icône + texte, onglet actif rempli en rouge : Créer · Carte · Messages · Profil.
- **Barre du haut (Carte et Liste)** : logo `catch`, zone (« Bruxelles · 5 km », ou « Près de toi · 5 km » quand la position est connue), bouton Liste/Carte, bouton recentrer.

## Pictos des sports

10 pictos en style flat (couleurs pleines, sans contour, ombre douce) dans [design/pictos/](../design/pictos/) : foot, basket, volley, rugby, spikeball, tennis, badminton, escalade, padel, autre. Générés avec Figma puis harmonisés aux couleurs de Catch. Le picto est toujours accompagné du nom du sport.

Tailles d'usage : 20 px dans les pastilles de carte (dans un rond blanc), 36 px dans un carré arrondi beige `#F3EDE8` de 48 px en liste et messages, 34 px dans les tuiles de choix du sport.

## Marqueur, titres penchés, ligne de points (24 novembre, idées de Mathias)

Maquettes : [Les 4 idées de Mathias](https://claude.ai/artifact/EkHvny6qZnQV3vKcGdxRnW), version A de l'idée 3 choisie par Maxime.

- **Marqueur** (`components/marqueur.tsx`, couleurs `marqueur` et `marqueurSurRouge`) : un trait de surligneur sous la moitié basse du texte. **Seulement 3 endroits** : la phrase de Créer, les places dans l'en-tête rouge du détail, « Tu l'as catchée ! ». Ailleurs il perdrait son effet.
- **Penché** (`INCLINAISON`, -8°) : l'en-tête du détail et « Tu l'as catchée ! ». Jamais pour du texte courant.
- **En-tête du détail** (finition C1) : le nombre de places en énorme à gauche, « places à prendre » penché et surligné, le temps dans une pilule blanche (`phraseEntete` dans `lib/formats.ts`).
- **Barre segmentée** (finitions S2 + S3, `components/barre-places.tsx`) : une case foncée par joueur, rouge pour soi, claire par place libre, 12 au plus, « 7/10 » à droite ; à 1 ou 2 places, cases libres en orange et badge « Presque plein » / « Il manque 1 joueur ». Liste et fiche de la carte. VoiceOver lit « 7 sur 10, 3 places ».

## Animations

Règle : chaque animation explique quelque chose, répond en moins de 100 ms, dure 100 à 400 ms et peut être interrompue par le doigt. **Exception : les grands moments** (le Catch, une session publiée, une présence confirmée) peuvent durer jusqu'à environ 1 s (décidé avec Maxime le 22 novembre).

### L'ambiance Catch (22 novembre)

Maquettes jouables : [Catch · Ambiance et animations](https://claude.ai/artifact/7zWKz5CrjJkx2fm3hPX9Fs).

1. La balle orange est la mascotte : elle attend avec toi, elle file quand tu catches.
2. Chaque geste répond tout de suite au doigt (enfoncement + vibration), avant même le serveur.
3. On fête les vrais moments (Catch, session publiée, présence), jamais le fait d'ouvrir l'app.
4. Une attente montre ce qui arrive (lignes du terrain, pastilles qui s'allument), jamais un rond qui tourne ni un texte « Chargement… ».
5. Tout reste court et se coupe si l'iPhone demande moins d'animations.

| Moment | Ce qui se passe | Où |
| --- | --- | --- |
| Attente d'un écran | `BalleRebond` (parabole, écrasée au sol, ombre) + phrases qui défilent (« On gonfle les ballons… ») | `components/chargement.tsx` (`Chargement`) : carte, détail, Profil |
| Attente d'une liste | `CartesFantomes` : la forme des cartes avec les lignes d'un terrain, qui respire | Mes sessions, Messages |
| Arrivée des sessions | Chaque pastille sort de terre, de haut en bas, 70 ms d'écart (`lib/apparitions.ts`, `Apparition`), une seule fois par session | Carte (téléphone et web) |
| Premier chargement réussi | Bandeau « 7 sessions près de toi » sous la barre, 2,8 s (`components/bandeau-carte.tsx`) | Carte |
| Bouton rouge | Tranche foncée dessous (`rougeTranche`), le bouton s'y enfonce de 3 px | `Bouton` principal, `BoutonCatch` |
| Envoi au serveur | Une balle blanche roule dans le bouton (`attente` de `Bouton`) | Publier |
| Session publiée | Retour à la carte : la session tombe au centre, s'écrase un peu, deux ondes, puis « C'est en ligne ! » avec « Inviter » (`components/session-qui-tombe.tsx`) | Carte |
| Catch | La balle arrive et le bouton l'attrape (existant), puis sur « Tu l'as catchée ! » ton rond « Toi » rejoint l'équipe avec une onde et des éclats (`components/rond-toi.tsx`) | Détail, fiche, « Tu l'as catchée ! » |
| Tuile choisie | Le picto se tasse et reprend sa taille (`PictoQuiSaute`) | Créer, Mes sports |
| Phrase de Créer | Chaque choix devient un mot surligné ; le trait se tire de gauche à droite (350 ms, 70 ms d'écart par mot) quand il change. Ce qui manque est un trou en pointillés orange avec trois points qui respirent (`components/phrase-creation.tsx`) | Créer |
| Places qui changent | Le nombre de places défile comme un compteur (550 ms) quand quelqu'un catche ou se désiste pendant qu'on regarde ; jamais en boucle (`components/chiffre-qui-defile.tsx`) | En-tête du détail |

| Jeton | Réglage (Reanimated) | Usage |
| --- | --- | --- |
| `spring.snappy` | `{ duration: 250, dampingRatio: 1 }` | Boutons pressés, pastilles, sélections |
| `spring.standard` | `{ duration: 400, dampingRatio: 1 }` | Tout ce qui se déplace |
| `spring.gesture` | `{ duration: 300, dampingRatio: 0.8 }` + vitesse du geste | Feuilles et cartes glissées au doigt |
| `spring.bounce` | `{ duration: 450, dampingRatio: 0.55 }` | Réservé à la balle et aux célébrations |
| `duration.instant / fast / standard / emphasized` | 100 / 150 / 250 / 350 ms | Couleurs, toggles, fondus, entrées de feuilles |
| Bouton rouge pressé | descend de 3 px dans sa tranche | `Bouton` principal, `BoutonCatch` |
| Autre bouton pressé | scale 0,96 (0,98 pour les cartes) | Boutons secondaires |

- Onglets : fondu 250 ms. Carte ↔ Liste : fondu croisé.
- Balle d'attente après 400 ms (la carte), cartes fantômes tout de suite.
- La balle est le seul élément qui rebondit vraiment. Les pastilles, pictos et le rond « Toi » ont seulement un léger dépassement en arrivant ; la session publiée s'écrase un peu en touchant la carte.
- Catch et envoi de message en interface optimiste, avec retour en arrière propre en cas d'échec.
- « Réduire les animations » respecté : déplacements remplacés par des fondus, boucles arrêtées.
- Animer uniquement `transform` et `opacity`.
- Carte sur téléphone : un marqueur n'est redessiné que pendant son animation (`tracksViewChanges`), puis il est figé en image.

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
