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
- **Texte et interface** : la police du téléphone (SF Pro sur iPhone, Roboto sur Android), 400–600. Inter retirée le 27 novembre (elle faisait « app générée »). Dans le code : `...Polices.texte`, `...Polices.texteMoyen`, `...Polices.texteDemi` (police + graisse).
- Tailles : titre d'écran 28, titre de session 24, texte 15–16, aides 13, pastilles 12–13.

## Mise en page

- Écran de référence : 390 × 844. Marges latérales 20 px.
- Cibles tactiles ≥ 44 px. Rayons : boutons 16, cartes 20, pastilles en pilule.
- **Barre de navigation flottante** : pilule blanche détachée (20 px des bords, 26 px du bas), 4 onglets icône + texte, onglet actif rempli en rouge : Créer · Carte · Messages · Profil.
- **Barre du haut (Carte et Liste)** (25 novembre, finition B2 choisie par Maxime) : une pastille « catch | Tous les sports ⌄ » (les pictos et noms des sports choisis quand la carte est filtrée) qui ouvre un menu de tuiles de sports avec le nombre de sessions de chacun (« Tous » et un toucher par sport, puis Sessions / Événements / Lieux, « Bruxelles · 5 km » en pied) ; à côté, un rond Liste / Carte en un toucher. Plus d'étoile ni de recentrer (« Près de moi » apparaît quand il sert).

## Pictos des sports

10 pictos en style flat (couleurs pleines, sans contour, ombre douce) dans [design/pictos/](../design/pictos/) : foot, basket, volley, rugby, spikeball, tennis, badminton, escalade, padel, autre. Générés avec Figma puis harmonisés aux couleurs de Catch. Le picto est toujours accompagné du nom du sport.

Tailles d'usage : 20 px dans les pastilles de carte (dans un rond blanc), 36 px dans un carré arrondi beige `#F3EDE8` de 48 px en liste et messages, 34 px dans les tuiles de choix du sport.

## Effets de marque : seulement deux (audit du 27 novembre)

Catch garde **deux** effets à lui : la **barre segmentée** des places et la **phrase de Créer**. Le reste a été retiré le 27 novembre parce que ça faisait « app générée » : surligneur, titres penchés, chiffre géant qui défile, curseur qui clignote, pastilles qui sortent de terre, session qui tombe sur la carte. Ne pas les remettre.

Historique (24 novembre, idées de Mathias)

Maquettes : [Les 4 idées de Mathias](https://claude.ai/artifact/EkHvny6qZnQV3vKcGdxRnW), version A de l'idée 3 choisie par Maxime.

- ~~Marqueur~~ et ~~Penché~~ : retirés le 27 novembre.
- **En-tête du détail** (depuis le 27 novembre) : « 3 places libres » en Bricolage 36, droit, le temps dans une pilule blanche dessous, le picto dans un rond à droite (`phraseEntete` dans `lib/formats.ts`). « Complet » si plus de place.
- **Barre segmentée** (finitions S2 + S3, `components/barre-places.tsx`) : une case foncée par joueur, rouge pour soi, claire par place libre, 12 au plus, « 7/10 » à droite ; à 1 ou 2 places, cases libres en orange et badge « Presque plein » / « Il manque 1 joueur ». Liste et fiche de la carte. VoiceOver lit « 7 sur 10, 3 places ».

## Carte : pastilles et fiche (25 novembre)

Maquettes : [finitions](https://claude.ai/artifact/WopYaEQW5861Vg2SdVLMt4), choix de Maxime P2, F3, A, B2.

- **Pastille d'une session (P2)** : anneau de 64 px, un trait par joueur (12 au plus, `lib/anneau-places.ts`), plein pour chaque inscrit ; picto au milieu ; étiquette posée sur le bas de l'anneau (« 19h », « Demain 18h », « 20h20 · 1 pl. », « En direct »). Encre normalement, **orange** s'il reste 1 ou 2 places, **rouge** en direct. Bulle de plusieurs sessions : disque à bord pointillé avec leur nombre, « dès 18h » dessous.
- **Fiche de la carte (F3)** : bandeau rouge avec le terrain en filigrane, une phrase (« Foot à 5 dans 3 h, à 3 km ») et un petit Catch blanc dedans ; dessous une ligne : lieu, barre des places. Inscrit : pastille « Tu y es » / « Ta session » à la place de Catch, avec « Inviter » et « Annuler… ».
- **Carte vide (A)** : une seule ligne fine au-dessus de « + Créer », « Rien à 5 km · Voir à 9 km › ». Rien du tout : « Personne ne joue encore ici ».

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
| Attente d'un écran | `BalleRebond` (parabole, écrasée au sol, ombre), sans texte (plus de phrases rigolotes depuis le 27 novembre) | `components/chargement.tsx` (`Chargement`) : détail, Profil. Pas sur la carte |
| Attente d'une liste | `CartesFantomes` : la forme des cartes avec les lignes d'un terrain, qui respire | Mes sessions, Messages |
| Arrivée des sessions | Rien : les pastilles sont là, tout simplement (pastilles qui sortent de terre retirées le 27 novembre) | Carte |
| Bouton rouge | Tranche foncée dessous (`rougeTranche`), le bouton s'y enfonce de 3 px | `Bouton` principal, `BoutonCatch` |
| Envoi au serveur | Une balle blanche roule dans le bouton (`attente` de `Bouton`) | Publier |
| Session publiée | Retour à la carte centrée sur la session, bandeau « Session publiée » avec « Inviter » (session qui tombe retirée le 27 novembre) | Carte |
| Catch | La balle arrive et le bouton l'attrape (existant), puis sur « Tu l'as catchée ! » ton rond « Toi » rejoint l'équipe avec une onde et des éclats (`components/rond-toi.tsx`) | Détail, fiche, « Tu l'as catchée ! » |
| Tuile choisie | Le picto se tasse et reprend sa taille (`PictoQuiSaute`) | Créer, Mes sports |
| Phrase de Créer | Chaque choix s'écrit en rouge (`rougeTexte`) ; la phrase s'arrête à la question en cours, en gris pâle. Plus de surligneur ni de curseur (27 novembre) (`components/phrase-creation.tsx`) | Créer |
| En direct | Un seul point qui pulse (halo qui s'élargit, 1,4 s), le même partout (`PointEnDirect`) ; fixe avec « Réduire les animations » | Pastille, badge, pilule du détail |
| Jeton | Réglage (Reanimated) | Usage |
| --- | --- | --- |
| `spring.snappy` | `{ duration: 250, dampingRatio: 1 }` | Boutons pressés, pastilles, sélections |
| `spring.standard` | `{ duration: 400, dampingRatio: 1 }` | Tout ce qui se déplace |
| `spring.gesture` | `{ duration: 300, dampingRatio: 0.8 }` + vitesse du geste | Feuilles et cartes glissées au doigt |
| `spring.bounce` | `{ duration: 450, dampingRatio: 0.55 }` | Réservé à la balle et aux célébrations |
| `duration.instant / fast / standard / emphasized` | 100 / 150 / 250 / 350 ms | Couleurs, toggles, fondus, entrées de feuilles |
| Bouton rouge pressé | descend de 3 px dans sa tranche | `Bouton` principal, `BoutonCatch` |
| Autre bouton pressé | scale 0,96 (0,98 pour les cartes) | Boutons secondaires |

**Tri du 25 novembre** (demande de Maxime : « vérifie toutes les animations, garde les utiles »). Retiré : le bandeau « 7 sessions près de toi » à chaque ouverture (il fêtait l'ouverture de l'app, contre la règle 3, et doublait les pastilles qui sortent de terre ; il cachait le haut de la carte 2,8 s). Harmonisé : le point « en direct » du détail battait autrement que celui des pastilles, c'est maintenant le même. Resserré : « Tu l'as catchée ! », ton rond rejoint l'équipe à 650 ms au lieu de 950 (juste après la balle). Nettoyé : les réglages d'animation du surligneur, plus utilisés. `BandeauCarte` ne sert plus qu'à « C'est en ligne ! ».

- Onglets : fondu 250 ms. Carte ↔ Liste : fondu croisé.
- Pas d'attente affichée sur la carte ; cartes fantômes tout de suite dans les listes.
- La balle est le seul élément qui rebondit vraiment. Les pictos et le rond « Toi » ont seulement un léger dépassement en arrivant.
- Catch et envoi de message en interface optimiste, avec retour en arrière propre en cas d'échec.
- « Réduire les animations » respecté : déplacements remplacés par des fondus, boucles arrêtées.
- Animer uniquement `transform` et `opacity`.
- Carte sur téléphone : un marqueur n'est redessiné que quand il est choisi (`tracksViewChanges`), sinon il est figé en image.

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
