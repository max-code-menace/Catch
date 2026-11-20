# Produit

## L'idée

Catch sert à sortir de chez soi : faire du sport et rencontrer du monde. L'angle est « sortir et rencontrer des gens », pas « organiser un match ». Le nom est un jeu de mots avec « attraper » : on **catche** une session comme on attrape une balle.

Concurrents existants (GAMUP, Wiinup, Sportmate…) : aucun ne s'est imposé en Belgique.

## Le vrai risque : la carte vide

Une app de rencontres sportives meurt si personne ne voit de session à la première ouverture. Le travail principal n'est pas le code, c'est de remplir la carte au départ :

- Lancer une seule zone à la fois : Bruxelles d'abord (décidé le 16 novembre 2026), puis ville par ville.
- Les potes de Maxime sont les premiers utilisateurs et créent 3 à 5 sessions par semaine, même celles qu'ils feraient de toute façon.
- Ne jamais afficher un écran vide : élargir le rayon, montrer les 7 prochains jours, proposer de créer la première session ou d'être prévenu.
- Ne jamais gonfler la carte avec de fausses sessions.
- Montrer ce qu'on peut faire même quand personne ne joue : les lieux et les événements (ci-dessous).

## Lieux et événements (décidé le 19 novembre 2026)

But : une carte jamais vide, sans fausses sessions. Règle de tri : chaque élément doit rapprocher la personne d'une partie en un appui ; sinon on ne le met pas. Une app utile même quand on la quitte (on file vers le site d'une salle) est une app qu'on rouvre.

**Deux familles de sports**
- **Sports à terrain** (foot, mini-foot, basket, tennis, pétanque, ping-pong, beach-volley, padel…) : ils se jouent à un endroit précis, on montre ces endroits.
- **Sports libres** (brésilienne, spikeball, frisbee, course, yoga…) : partout, dans un parc, une placette, la rue. Pas de lieu à afficher, on pose le point où on veut, comme aujourd'hui.

**À mettre**
- **Terrains publics sur la carte** : petite pastille discrète avec le picto du sport, toujours sous les sessions (les sessions restent les plus visibles). Dézoomé, ils se regroupent (« 12 terrains »). Toucher un terrain : le sport, « gratuit », les sessions prévues là, et « Lancer un foot ici » qui ouvre Créer avec sport et lieu remplis.
- **Salles payantes** (escalade, crossfit, padel…) : même pastille, marquée « payant », avec une petite fiche : nom, sports, adresse, lien vers leur site, sessions prévues là, « Lancer une session ici ».
- **Créer** : avec un sport à terrain, l'étape « Où » met en avant les lieux de ce sport et on en touche un. On peut toujours poser son point ailleurs (un terrain peut manquer). On suggère, on ne bloque jamais.
- **Événements** (20 km de Bruxelles, 24 h vélo…) : pastille différente (drapeau) au départ, visible seulement les 7 jours avant, comme les sessions. Fiche : nom, date, heure, lien officiel pour s'inscrire, « On y va ensemble » qui crée une vraie session au départ, rattachée à l'événement.
- **Données** : terrains tirés d'OpenStreetMap puis nettoyés à la main (on retire le privé et les clubs fermés au public) ; salles et événements choisis à la main par Maxime et Claude, en commençant par Bruxelles.

**À ne pas mettre**
- Des lieux pour les sports libres (pas de « parc à spikeball »).
- Photos, avis, notes, horaires d'ouverture (ils changent : on renvoie vers le site), réservation dans l'app, favoris de lieux.
- Un onglet ou un agenda d'événements : ils vivent sur la carte, rien d'autre.
- Des événements fermés (inscriptions closes, réservés à un club), le parcours complet, les résultats, les classements.
- Tout ce qui laisse croire que des gens sont sur un lieu alors qu'aucune session n'y est prévue.
- Un lieu mis en avant parce qu'il paie sans le dire : un partenaire est toujours marqué « partenaire » (pas de dark patterns).

**Ordre** : d'abord les terrains et les salles (carte + Créer), ensuite les événements.

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
- **Création** : la première fois, rien n'est pré-rempli : 4 choix (sport, quand, joueurs, où). Le nombre de joueurs reste toujours visible sous « Quand » (décidé par Maxime le 19 novembre : il change trop selon le sport et la session) ; durée et « Débutants bienvenus » sont derrière « Plus d'options ».
- **Paiement** : prix indicatif payé sur place, pas de paiement dans l'app.
- **Obligations stores** : bouton signaler / bloquer, contact visible et suppression de compte dès la v1, dans l'app et par un lien web (exigé par Google Play).
- **Niveau d'exigence** : la v1 est un vrai produit, fini et fiable sur ce qu'il fait. On n'ajoute pas de variantes expérimentales (phrase à trous, grille à peindre, balayage).
- **Âge minimum : 18 ans** (décidé par Maxime le 20 novembre 2026, au lieu de 16). Raison : Catch va vers des messages privés entre inconnus (voir « Vision » plus bas), ce qui n'est pas acceptable avec des mineurs. On ne vérifie pas l'âge (pas de pièce d'identité) : l'utilisateur le déclare en acceptant les Conditions, et un compte signalé comme mineur est supprimé.

## Vision : l'app pour rencontrer des gens par le sport (20 novembre 2026)

Ce que Maxime veut que Catch devienne : pas seulement une carte de sessions, mais **l'endroit où on rencontre des partenaires de sport et où on garde contact avec eux**. Les gens continueront d'utiliser WhatsApp ou Messenger pour le reste ; Catch doit être là où on rencontre, avant et après la session. Modèle : BlaBlaCar (on peut écrire au conducteur avant de réserver, sans y être obligé).

Ce qui en découle, dans l'ordre proposé (chaque étape sert seule ; rien n'est construit avant la fin de l'audit et l'accord de Maxime) :

1. **« Écrire à l'organisateur »** depuis le détail d'une session, avant de catcher : poser une question, voir si la personne est sérieuse. Pas obligatoire pour catcher.
2. **« Ils cherchent aussi »** : deux sessions du même sport, à la même heure, proches, qui manquent toutes les deux de joueurs (exemple : deux tennis à 18h) → on propose aux deux organisateurs de s'écrire pour jouer ensemble. Affiché dans l'app (bandeau sur sa session), **pas par notification** (on reste à 4 types). Rien n'est fusionné automatiquement.
3. **Amis** : « Ajouter en ami » une personne avec qui on a joué (acceptée des deux côtés). Profil d'ami : sports, prochaines sessions. Messages privés entre amis.
4. **Groupes d'amis** (exemple : « le foot du jeudi ») : rejoint l'idée des sessions qui se répètent.
5. Pas de pièces jointes pour l'instant (aucune utilité claire).

**Onglet Messages séparé en deux espaces** (demande de Maxime, 20 novembre), pour ne pas mélanger les conversations des gens avec qui on *va* jouer et de ceux avec qui on *a* passé un bon moment :
- **Sessions** : les groupes créés automatiquement pour chaque session (comme aujourd'hui), plus « Écrire à l'organisateur » et « Ils cherchent aussi ». Une fois la session passée, sa conversation descend dans « Terminées » (repliée) au lieu d'encombrer la liste.
- **Amis** : les conversations privées avec ses amis et les groupes d'amis.
- Une pastille de non-lus par espace, pour voir d'un coup d'œil où ça bouge.

Garde-fous à respecter :
- **La conversation de groupe d'une session reste** (« j'arrive », « terrain 3 ») : Maxime trouvait les groupes peu utiles, mais sans eux l'organisateur d'un foot à 10 aurait 9 conversations séparées. Les messages privés s'ajoutent, ils ne remplacent pas.
- **Vie privée** : ce qu'on voit d'une personne (sessions à venir, sports) est réservé à ses amis acceptés, jamais public (même logique que la correction S1 de l'audit : on ne doit pas pouvoir suivre où va quelqu'un).
- **Sécurité** : signaler et bloquer marchent dans les messages privés comme dans les groupes ; limite d'envoi contre le spam (point S5 de l'audit).

## Fonctionnalités prévues plus tard (v2)

Badge « En direct » animé avancé, bouton « je cherche un joueur » avec notifications limitées, système anti-lapin complet, badge Organisateur, paiement dans l'app.

## Idées pas encore décidées

À ne pas construire sans l'accord de Maxime. Elles ne font pas partie du plan de construction.

La réserve d'idées la plus complète est le **laboratoire UX** ([design/laboratoire-ux/](../design/laboratoire-ux/), [version en ligne](https://claude.ai/artifact/XnGqqCVsjx5U1CSBRzKAHR)) : pour chaque écran, plusieurs variantes jouables et une recommandation. Ses variantes recommandées servent de référence quand on construit un écran ; ses variantes expérimentales (phrase à trous, grille à peindre, balayage) sont à tester avec de vrais utilisateurs avant d'entrer dans l'app.

### Contre-expertise du laboratoire (19 novembre 2026)

Le labo n'a pas été mis à jour après les décisions : **en cas de désaccord, ce document l'emporte sur le labo.** Ses notes sur 50 ne décident rien (souvent la variante recommandée a une note plus basse qu'une autre).

- **Le labo se trompe, ne pas suivre** : Catch « optimiste » fêté avant le serveur (on fête après la réponse) · pont WhatsApp · résumé quotidien des notifications · centre de notifications (cloche) · « maintenir pour confirmer » (un dialogue suffit pour l'irréversible) · rayon réglable au curseur.
- **Pour la v1** (fait le 19 novembre) : explication avant la demande de localisation, et lien vers les Réglages si elle a été refusée · « Ajouter à mon calendrier » (écran « Tu l'as catchée ! » et fiche de la session) · barre flottante vérifiée écran par écran. Déjà couverts : la carte charge toutes les sessions des 7 prochains jours (jusqu'à 500), donc déplacer la carte les montre et l'état vide propose d'aller voir plus loin ; « Chercher dans cette zone » ne servira qu'au-delà de 500 sessions.
- **Plus tard, après les premiers utilisateurs** : réponses rapides dans le chat (« J'arrive », « En retard ») · « Préviens-moi » / liste d'attente sur une session complète · habitués · statistiques et historique · photo de profil (avec modération des images) · recherche texte · feuille de filtres complète · squelette de chargement · conversations « À venir / Terminées » · préférences proposées au bon moment · prix indicatif · heures calmes · langues (Bruxelles : néerlandais, anglais).
- **Abandonné** : suggestions personnalisées · phrase à trous · feuille à crans sur la carte · demandes à valider par l'organisateur · grille de disponibilités · badges · groupes et communautés · partage de position · simulateur de notifications · heure de départ conseillée · synchronisation permanente du calendrier · recherche en langage naturel · paiement, remboursement et historique de paiement dans l'app · actions mises en attente hors connexion (un Catch rejoué plus tard peut tomber sur une session complète) · tirer-pour-rafraîchir maison · balayage et glisser-déposer · transitions partagées.
- **À rediscuter avec Maxime** : le taux de présence visible sur les profils (décidé plus haut). Sans moyen de vérifier qui est vraiment venu, il risque d'être injuste et de faire honte.
- **Oublié par le labo** (fait le 19 novembre) : la sécurité quand on retrouve des inconnus, écran « Jouer en sécurité » proposé au premier Catch et dans Profil.

Principe : le fun, c'est le terrain, pas l'écran. On récompense le fait de jouer, jamais le fait d'ouvrir l'app.

- **« Il manque 1 joueur » comme mission** : celui qui catche sauve la session.
- **L'après-session** : écran « C'était bien ? » avec un appui pour remercier un joueur, bouton « Rejouer avec eux » qui recrée la session la semaine suivante.
- **Un profil qui raconte une histoire** : sessions jouées, sports essayés, personnes rencontrées, quelques badges liés à du vrai (premier Catch, premier sport nouveau, 5 sessions complétées).
- **Invitation en forme de défi**, avec la session en image.
- **Un ton qui joue** : humour dans les états vides et le chargement, dans les règles de `ux-writing.md`.
- **Propositions de l'audit concurrents** (voir `recherches.md`) : sessions qui se répètent, liste d'attente, « je viens avec 1 pote », minimum de joueurs.
- **Partenariats avec les salles** (idée de Maxime, 19 novembre) : quand il y aura assez d'utilisateurs, mettre en avant des salles partenaires, toujours marquées « partenaire ». Rien à construire avant.

Écarté : classements entre joueurs, points, niveaux, séries de jours ou de semaines d'affilée, notifications de relance, notifications en plus des 4 types décidés.

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
4. Détail d'une session et bouton Catch (avec l'animation du Catch : la balle attrapée dans le bouton)
5. Connexion (Apple, Google, e-mail) au moment du Catch
6. Créer une session (première création + pré-remplissage + « Relancer »)
7. Lien d'invitation et page web
8. Notifications (4 types, réglages par type, build de développement)
9. Messagerie interne
10. Signalement, blocage, suppression de compte (app + lien web)
11. Tests : 5 potes, puis 5 inconnus du Brabant wallon, puis re-test après corrections. Indicateur : part des nouveaux qui jouent une session dans les 7 jours.
12. Lieux : terrains publics et salles payantes sur la carte, fiche, « Lancer une session ici », suggestions dans Créer (voir « Lieux et événements »)
13. Événements : drapeau au départ, fiche, « On y va ensemble »

## Comment Maxime veut travailler

Maxime dirige le produit et ne code pas. Claude code directement dans le dépôt, une fonctionnalité à la fois, teste, pousse, publie sur Expo, puis explique en une ou deux phrases ce qui a changé et ce qu'il faut regarder sur le téléphone. Réponses courtes, en français, ton décontracté.
