# Sports à trier

Liste proposée par Claude le 19 novembre 2026. **Tranché le 24 novembre** (accord de Maxime) : les sports déjà dans l'app restent, rugby compris ; on n'en ajoute que si un utilisateur le demande.

Aujourd'hui l'app en a 10 : Foot, Basket, Volley, Badminton, Spikeball, Tennis, Padel, Escalade, Rugby, Autre (`src/donnees/sports.ts`).

## Sélection pour la v1 (proposée le 19 novembre, à valider par Maxime)

16 sports + « Autre ». Le reste de cette page est gardé en réserve.

| Sport | Où | Pourquoi |
| --- | --- | --- |
| Foot (mini-foot compris) | Terrain, salle | Le plus demandé, terrains publics partout |
| Basket | Terrain | Beaucoup de terrains publics gratuits |
| Volley (beach compris) | Salle, terrain | Très social, beach l'été |
| Tennis | Terrain, salle | Il faut un partenaire |
| Padel | Salle | Très demandé, il faut être 4 |
| Badminton | Salle | Facile pour débutants |
| Squash | Salle | Il faut un partenaire |
| Ping-pong | Terrain | Tables publiques gratuites |
| Escalade | Salle | En voie, il faut quelqu'un pour assurer |
| Boxe | Salle | Très demandée ; cours ou entraînement, pas de combat entre inconnus |
| Course à pied | Libre | Le plus simple à lancer |
| Vélo | Libre | Sorties en groupe, Forêt de Soignes |
| Ultimate frisbee | Libre | Convivial, n'importe quel parc |
| Spikeball | Libre | Déjà là, au parc |
| Pétanque | Terrain | 120 terrains publics recensés à Bruxelles |
| Street workout | Terrain | Barres publiques gratuites |

**Rugby** (déjà dans l'app) n'est pas dans la sélection : peu joué entre inconnus. À garder ou retirer, au choix de Maxime. Les lieux de chaque sport retenu sont dans `lieux-a-verifier.md`.

**Où ça se joue** (voir « Lieux et événements » dans `produit.md`) :
- **Terrain** : un terrain public précis (gratuit), qu'on affichera sur la carte
- **Salle** : un lieu payant (club, salle, box), avec sa fiche
- **Libre** : partout (parc, placette, rue), on pose son point où on veut

Légende : ⭐ = très adapté à Catch (on joue facilement avec des inconnus, petit groupe, ça se lance en une heure) · ⚠️ = à réfléchir (voir la remarque).

## Sports de ballon et collectifs

| Sport | Où | Joueurs | Remarque |
| --- | --- | --- | --- |
| Foot ⭐ | Terrain, salle | 10 | Déjà dans l'app |
| Mini-foot / foot à 5 ⭐ | Terrain, salle | 10 | Distinct du foot ? Les Agoraspaces sont faits pour ça |
| Basket ⭐ | Terrain | 6 | Déjà dans l'app |
| Volley ⭐ | Salle | 8 | Déjà dans l'app |
| Beach-volley ⭐ | Terrain | 4 | Surtout l'été |
| Rugby / rugby touché | Libre, terrain | 14 | Déjà dans l'app. Le « touché » se joue sans contact, plus facile entre inconnus |
| Handball | Salle | 12 | |
| Futsal | Salle | 10 | |
| Hockey sur gazon | Salle | 14 | Peu de matériel chez les gens |
| Ultimate frisbee ⭐ | Libre | 10 | Très convivial, se joue dans n'importe quel parc |
| Kin-ball | Salle | 12 | Ludique, peu connu |
| Football américain / flag football | Libre | 10 | Le flag se joue sans contact |
| Cricket | Libre | 12 | Communauté indienne et pakistanaise à Bruxelles |
| Baseball / softball | Libre | 14 | ⚠️ Rare, peu de terrains |

## Raquettes

| Sport | Où | Joueurs | Remarque |
| --- | --- | --- | --- |
| Tennis ⭐ | Terrain, salle | 2 | Déjà dans l'app |
| Padel ⭐ | Salle | 4 | Déjà dans l'app. Très demandé |
| Badminton ⭐ | Salle | 4 | Déjà dans l'app |
| Ping-pong ⭐ | Terrain | 2 | Beaucoup de tables publiques dans les parcs |
| Squash | Salle | 2 | |
| Pickleball | Salle | 4 | En pleine croissance, la fédération l'a ajouté à son nom |
| Spikeball ⭐ | Libre | 4 | Déjà dans l'app |
| Beach tennis | Terrain | 4 | Rare |

## Sports de combat

⚠️ À réfléchir : se battre entre inconnus pose une vraie question de sécurité. Plutôt pensé comme « on va ensemble au cours d'essai » ou « entraînement technique dans une salle encadrée » que comme un combat organisé dans l'app.

| Sport | Où | Joueurs | Remarque |
| --- | --- | --- | --- |
| Boxe ⭐ | Salle | 2 | Très demandée. Footing + sac de frappe à deux, ou cours d'essai ensemble |
| Kickboxing / muay-thaï | Salle | 2 | |
| MMA | Salle | 2 | ⚠️ Combat libre : seulement en salle encadrée |
| Judo | Salle | 2 | Surtout en club |
| Jiu-jitsu brésilien (JJB) | Salle | 2 | Beaucoup de « open mats » (séances libres) dans les clubs |
| Lutte | Salle | 2 | |
| Karaté / taekwondo | Salle | 2 | Surtout en club, ⚠️ peu fait « entre inconnus » |
| Escrime | Salle | 2 | Matériel du club |
| Capoeira | Libre, salle | 6 | Rodas parfois en plein air |
| Self-défense | Salle | 6 | Cours |

## Course, vélo, glisse

| Sport | Où | Joueurs | Remarque |
| --- | --- | --- | --- |
| Course à pied / running ⭐ | Libre | 6 | Le sport le plus simple à lancer. Point de départ, distance, rythme |
| Trail | Libre | 6 | Forêt de Soignes |
| Marche sportive / nordique | Libre | 6 | Public plus âgé, très social |
| Randonnée | Libre | 8 | ⚠️ Souvent hors Bruxelles, sur la journée |
| Vélo de route ⭐ | Libre | 6 | Sorties en groupe |
| VTT / gravel | Libre | 6 | Forêt de Soignes |
| Roller / patins | Libre | 6 | |
| Skateboard | Terrain | 4 | Skateparks publics |
| Trottinette / BMX | Terrain | 4 | Skateparks |
| Athlétisme (piste) | Terrain, salle | 4 | Pistes parfois en accès libre |

## Eau et glace

| Sport | Où | Joueurs | Remarque |
| --- | --- | --- | --- |
| Natation | Salle | 4 | Piscines communales. Peu « collectif » mais on y va à plusieurs |
| Aviron / kayak / paddle | Salle | 4 | Canal, étangs, souvent via un club |
| Plongée | Salle | 4 | ⚠️ Club obligatoire |
| Patinage sur glace | Salle | 4 | Patinoires, saison d'hiver |
| Hockey sur glace | Salle | 10 | ⚠️ Rare |

## Fitness et bien-être

| Sport | Où | Joueurs | Remarque |
| --- | --- | --- | --- |
| Street workout ⭐ | Terrain | 4 | Beaucoup d'installations publiques gratuites |
| Musculation | Salle | 2 | « Partenaire de salle », ⚠️ souvent abonnement nominatif |
| CrossFit | Salle | 4 | ⚠️ Souvent abonnement ou séance d'essai |
| Yoga ⭐ | Libre, salle | 8 | Au parc l'été |
| Pilates | Salle, libre | 8 | |
| Stretching / mobilité | Libre | 8 | |
| Bootcamp / HIIT ⭐ | Libre | 8 | Se fait au parc, sans matériel |
| Danse (salsa, hip-hop…) | Salle | 8 | ⚠️ Est-ce du sport pour Catch ? Très social |
| Zumba | Salle | 8 | |

## Jeux de plein air et de précision

| Sport | Où | Joueurs | Remarque |
| --- | --- | --- | --- |
| Pétanque ⭐ | Terrain | 4 | Beaucoup de pistes publiques, très social |
| Mölkky / kubb | Libre | 6 | Au parc, très convivial |
| Frisbee (lancer simple) | Libre | 4 | |
| Disc golf | Terrain | 4 | Parcours fixes, rares |
| Golf / practice | Salle | 4 | ⚠️ Cher |
| Mini-golf | Salle | 4 | Plus loisir que sport |
| Bowling | Salle | 6 | Plus loisir que sport |
| Fléchettes / billard | Salle | 4 | ⚠️ Plus bar que sport |
| Tir à l'arc | Salle | 4 | Club |
| Slackline | Libre | 4 | Entre deux arbres au parc |
| Échecs (en plein air) | Libre | 2 | ⚠️ Pas du sport physique, mais très social |

## Escalade et montagne

| Sport | Où | Joueurs | Remarque |
| --- | --- | --- | --- |
| Escalade (bloc et voie) ⭐ | Salle | 4 | Déjà dans l'app. En voie il faut un partenaire pour assurer : idéal pour Catch |
| Parkour | Libre | 4 | |
| Ski / snowboard (piste indoor) | Salle | 4 | ⚠️ Hors Bruxelles |

## Ma recommandation

- **Ne pas tout mettre en tuiles.** Plus il y a de choix, plus on réfléchit dans Créer. Garder environ 12 tuiles (les ⭐ les plus courants) et mettre le reste dans « Plus de sports », avec une recherche.
- **Pour commencer, ajouter** : Ping-pong, Course à pied, Pétanque, Ultimate frisbee, Boxe, Squash, Vélo, Yoga, Street workout, Mini-foot. Ils sont simples à lancer ou ont déjà des lieux publics à Bruxelles.
- **Sports de combat** : oui pour la boxe en « salle » (cours ou entraînement), en évitant d'organiser des combats entre inconnus.
- **Laisser de côté** pour l'instant ce qui est plus loisir que sport (bowling, billard, échecs) et ce qui est rare à Bruxelles (hockey sur glace, baseball).
- Chaque nouveau sport a besoin d'un **picto** dans le style Chaleur (`design/pictos/`, `scripts/generer_pictos.py`).
