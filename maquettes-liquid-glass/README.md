# Catch — maquettes liquid glass (session du 14 novembre)

> Il manque quelqu'un ? C'est toi.

Catch est une appli mobile avec une carte : tu vois les parties de sport près de chez toi, tu en rejoins une en un geste, ou tu crées un team-up en trois touches quand il te manque des joueurs (« Il nous manque 2 personnes pour le spikeball »).

Le but n'est pas la performance : c'est de faire sortir les gens de chez eux, de les faire bouger et de leur faire rencontrer du monde, sans être une appli de drague.

- **Villes de départ :** Bruxelles et Louvain-la-Neuve d'abord, puis Strasbourg et Delft
- **Équipe :** Mathias (marketing et vision), Math (code et vision), Loup (images, style, logo)
- **État :** étape D (maquettes) — pas encore de code

## Ce qu'il y a dans ce dossier

| Dossier | Contenu |
| --- | --- |
| `docs/01-fiche-projet.md` | Étape A : l'idée, le public, les rôles, les règles, la concurrence, le lancement |
| `docs/02-parcours-et-ecrans.md` | Étape B : les parcours et la liste des écrans |
| `docs/03-design.md` | Les choix de design (liquid glass gris) et les 8 règles inspirées de Raven |
| `maquettes/` | Les écrans des maquettes (format `.dc.html` du canevas Claude Design) |
| `inspiration/` | Les références : la galerie des 10 directions, le menu en verre, le modèle de tableau |

## Les maquettes

Les maquettes vivantes (cliquables) sont sur le canevas : <https://claude.ai/artifact/WqFYGU3pBa9EHSwBjvvuvd>

- Page **Maquettes** : 4 lignes, de la première version simple à la version liquid glass
- Page **Tableau** : la couverture, « Comment ça marche », la page d'inscription et tous les écrans dans des téléphones

Les fichiers `maquettes/*.dc.html` sont une copie de sauvegarde : ils ont besoin du canevas pour s'afficher. Les écrans à garder sont ceux qui commencent par `Glass` (version actuelle) ; `Main`, `Session`, `Creer`, `Chat`, `Profil` et `Mix*` sont les versions précédentes.

| Écran actuel | Fichier |
| --- | --- |
| Inscription | `GlassInscription.dc.html` |
| Bienvenue | `GlassBienvenue.dc.html` |
| Carte | `GlassCarte.dc.html` |
| Swipe | `GlassSwipe.dc.html` |
| Créer un team-up | `GlassCreer.dc.html` |
| Partie et chat | `GlassPartie.dc.html` |
| Après la partie | `GlassApres.dc.html` |
| Messages et rencontres | `GlassMessages.dc.html` |
| Profil | `GlassProfil.dc.html` |

## Les documents d'origine

- Fiche projet (étape A) : <https://claude.ai/artifact/G99rUfriU6HiUg6HboEide>
- Parcours et écrans (étape B) : <https://claude.ai/artifact/XFPZzWCcJ22mWstVo577KH>

## Les étapes de A à Z

1. **A. Fiche projet** — fait
2. **B. Parcours et liste des écrans** — fait
3. **C. Design system** — en cours (liquid glass gris, une seule couleur)
4. **D. Maquettes** — en cours
5. **E. Choix techniques**
6. **F. Développement de la V1**
7. **G. Bêta fermée entre potes**
8. **H. Lancement à Bruxelles et Louvain-la-Neuve**
9. **I. Lancement à Strasbourg et Delft**
