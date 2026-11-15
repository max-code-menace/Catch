# Recherches

Deux recherches ont été faites pendant la conception (novembre 2026). Voici ce qu'il faut en retenir pour Catch.

## Principes de design : guider sans contraindre

- **Familiarité avant originalité** : reprendre les conventions connues (barre d'onglets, carte façon Maps, messages façon WhatsApp). Garder l'originalité pour un seul geste, le bouton Catch.
- **De bons choix par défaut**, faciles à changer en un geste. Les défauts pèsent énormément sur les décisions, donc ils doivent servir l'utilisateur.
- **Annuler plutôt que confirmer** : on agit tout de suite et on propose « Annuler ». Les confirmations sont réservées à l'irréversible.
- **Connexion différée** : laisser explorer avant de demander un compte. Les murs de connexion font fuir.
- **Pas de tutoriel en carrousel** : ils n'améliorent pas la réussite et sont sautés. Préférer une aide au moment où on en a besoin.
- **Zone du pouce** : actions importantes en bas, au centre. Cibles ≥ 44 pt (Apple) / 48 dp (Android).
- **Confiance entre inconnus** : réputation visible (taux de présence), lieux publics, position approximative, signaler / bloquer en deux appuis.
- **Anti-lapin progressif** : annulation libre jusqu'à quelques heures avant, rappel avec réponse en un appui, fiabilité affichée, limite temporaire après plusieurs absences.
- **Notifications** : ne pas demander au premier lancement, peu nombreuses, réglables par type.
- **Indicateur de succès** : part des nouveaux utilisateurs qui jouent une session dans les 7 jours, pas le temps passé dans l'app.
- **Pas de dark patterns** (fausse urgence, désinscription cachée, honte au refus). En Europe, le Digital Services Act vise ces pratiques.

## Animations, micro-interactions et vibrations

- Peu d'animations, mais cohérentes : 4 ressorts nommés, 5 durées, une carte action → vibration (voir le design system).
- Ressorts sans rebond pour tout ce que le doigt touche ; rebond réservé aux gestes avec élan et aux moments signature.
- 4 moments signature : le geste Catch (balle attrapée dans le bouton), « Tu l'as catchée ! », la pastille « En direct » qui pulse, la balle de chargement.
- Seuils de temps de réponse : 0,1 s (instantané), 1 s (le fil de pensée tient), 10 s (limite de l'attention).
- Pile technique : Reanimated 4, Gesture Handler, pile de navigation native d'expo-router, expo-haptics. Pas de Lottie ni Rive en v1. Pas de « shared element transitions » en v1 (encore expérimentales).
- Tester sur un vrai iPhone 120 Hz et un Android d'entrée de gamme, en build release.

## Concurrents

Audit complet avec captures : [Catch face aux concurrents](https://claude.ai/artifact/SnWSPV13GtcyZeZiQPrwnD) (onze apps, fiches App Store du 15 novembre 2026).

- **La place est libre en Belgique** : GamUp est absente du store belge, Wiinup et Sportmate y ont zéro note. Seul Playtomic est installé, sur le padel en club.
- **Les annuaires et réseaux de sportifs n'ont pas percé** (Sportmate, Leets, Sportpartner). Les apps à sessions, oui (Plei, GoodRec, Playtomic, Timeleft).
- **Celles qui marchent garantissent la session** : un hôte sur place ou un rendez-vous fixe chaque semaine.
- **Trous repérés dans Catch** : sessions qui se répètent, liste d'attente, « je viens avec 1 pote », prix, arrivée sur place, minimum de joueurs, trop de sports au lancement.
- **Amusement** : prendre le rematch, le compte à rebours, les places vides dessinées, l'aperçu du groupe, le merci en un appui. Laisser les niveaux XP, les classements, les notes entre joueurs et le swipe.

Ces propositions ne sont pas encore des décisions : elles passent dans `produit.md` une fois validées par Maxime.

Sources principales : Nielsen Norman Group, Laws of UX, Apple Human Interface Guidelines, WWDC 2018 « Designing Fluid Interfaces », Material Design 3, documentation Reanimated et Expo, Baymard Institute.
