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
- **Barre du haut (Carte et Liste)** : logo `catch`, zone (« Bruxelles · 5 km », ou « Autour de toi · 5 km » quand la position est connue), bouton Liste/Carte, bouton recentrer.

## Pictos des sports

10 pictos en style flat (couleurs pleines, sans contour, ombre douce) dans [design/pictos/](../design/pictos/) : foot, basket, volley, rugby, spikeball, tennis, badminton, escalade, padel, autre. Générés avec Figma puis harmonisés aux couleurs de Catch. Le picto est toujours accompagné du nom du sport.

Tailles d'usage : 20 px dans les pastilles de carte (dans un rond blanc), 36 px dans un carré arrondi beige `#F3EDE8` de 48 px en liste et messages, 34 px dans les tuiles de choix du sport.

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
- La balle est le seul élément qui rebondit.
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
