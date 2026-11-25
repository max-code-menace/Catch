"""Découpe la planche des sports (design/sports/planche-sports.png) en une image par sport.

La planche : 2 colonnes × 9 rangées de cartes orange sur fond foncé, dans l'ordre de PLANCHE ci-dessous.
Chaque carte est coupée sans ses coins arrondis, puis recadrée en 3:2 autour de l'objet
(le fond orange est prolongé en haut et en bas quand l'objet est trop large).

    python3 -I scripts/decouper_sports.py       # écrit assets/sports/<sport>.jpg

Modifier ce script ou la planche, pas les images générées.
"""
from __future__ import annotations

import os

from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLANCHE_PNG = os.path.join(RACINE, 'design', 'sports', 'planche-sports.png')
SORTIE = os.path.join(RACINE, 'assets', 'sports')

# Les cartes de la planche, rangée par rangée (gauche, droite)
PLANCHE = [
    ('foot', 'volley'),
    ('basket', 'boxe'),
    ('escalade', 'course'),
    ('velo', 'padel'),
    ('petanque', 'badminton'),
    ('pingpong', 'spikeball'),
    ('streetworkout', 'rugby'),
    ('tennis', 'squash'),
    ('ultimate', 'autre'),
]

RAPPORT = 3 / 2  # largeur / hauteur de l'image finale
TAILLE = (360, 240)  # assez pour une tuile d'environ 110 px de large en ×3
RETRAIT = 14  # on enlève les coins arrondis de chaque carte


def plages(profil: list[float], seuil: float = 0.8) -> list[tuple[int, int]]:
    """Les suites de colonnes (ou rangées) qui ne sont pas du fond foncé"""
    res, debut = [], None
    for i, v in enumerate(profil):
        if v < seuil and debut is None:
            debut = i
        if v >= seuil and debut is not None:
            res.append((debut, i - 1))
            debut = None
    if debut is not None:
        res.append((debut, len(profil) - 1))
    return [p for p in res if p[1] - p[0] > 40]


def fonce(p: tuple[int, int, int]) -> bool:
    return sum(p) < 200


def est_fond(p: tuple[int, int, int]) -> bool:
    """L'orange du fond (l'ombre de l'objet compte comme fond)"""
    r, g, b = p
    return r > 150 and 50 < g < 150 and b < 90 and r - g > 80


def est_fond_net(p: tuple[int, int, int]) -> bool:
    """L'orange du fond, sans les ombres ni les bords des objets rouges"""
    r, g, b = p
    return r > 235 and 85 < g < 135 and b < 70


def boite_objet(carte: Image.Image) -> tuple[int, int, int, int]:
    l, h = carte.size
    xs, ys = [], []
    px = carte.load()
    for y in range(0, h, 2):
        for x in range(0, l, 2):
            if not est_fond(px[x, y]):
                xs.append(x)
                ys.append(y)
    return min(xs), min(ys), max(xs), max(ys)


def recadrer(carte: Image.Image) -> Image.Image:
    l, h = carte.size
    x0, y0, x1, y1 = boite_objet(carte)
    marge = 0.14
    largeur = max(int((x1 - x0) * (1 + 2 * marge)), int(h * RAPPORT))
    largeur = min(largeur, l)
    hauteur = int(largeur / RAPPORT)
    cx = (x0 + x1) // 2
    gauche = max(0, min(l - largeur, cx - largeur // 2))
    bande = carte.crop((gauche, 0, gauche + largeur, h))
    if hauteur <= h:
        cy = (y0 + y1) // 2
        haut = max(0, min(h - hauteur, cy - hauteur // 2))
        return bande.crop((0, haut, largeur, haut + hauteur))
    # Objet trop large : on prolonge le fond en haut et en bas, colonne par colonne, avec la teinte
    # du bord (les pixels de l'objet sont ignorés), et on fond la jointure là où il n'y a que du fond
    ajout = hauteur - h
    dessus = ajout // 2
    toile = Image.new('RGB', (largeur, hauteur))
    milieu = dessus + h // 2
    toile.paste(ligne_bord(bande, 0, 8).resize((largeur, milieu), Image.NEAREST), (0, 0))
    toile.paste(ligne_bord(bande, h - 8, h).resize((largeur, hauteur - milieu), Image.NEAREST), (0, milieu))
    fondu = 16
    masque = Image.new('L', (largeur, h), 255)
    mp, bp = masque.load(), bande.load()
    for y in range(h):
        a = min(255, int(255 * min(y, h - 1 - y) / fondu))
        if a < 255:
            for x in range(largeur):
                mp[x, y] = a if est_fond(bp[x, y]) else 255
    toile.paste(bande, (0, dessus), masque)
    return toile


def ligne_bord(image: Image.Image, ya: int, yb: int) -> Image.Image:
    """Une rangée d'un pixel : pour chaque colonne, la teinte médiane du fond près du bord"""
    l = image.size[0]
    px = image.load()
    par_colonne = [[px[x, y] for y in range(ya, yb) if est_fond_net(px[x, y])] for x in range(l)]
    ligne = Image.new('RGB', (l, 1))
    for x in range(l):
        rayon, pris = 30, []
        while not pris and rayon < l:  # sous l'objet : on va chercher le fond un peu plus loin
            pris = [p for xx in range(max(0, x - rayon), min(l, x + rayon + 1)) for p in par_colonne[xx]]
            rayon *= 2
        if not pris:
            pris = [(250, 110, 40)]
        ligne.putpixel((x, 0), tuple(sorted(p[i] for p in pris)[len(pris) // 2] for i in range(3)))
    return ligne


def main() -> None:
    planche = Image.open(PLANCHE_PNG).convert('RGB')
    l, h = planche.size
    px = planche.load()
    colonnes = plages([sum(fonce(px[x, y]) for y in range(0, h, 2)) / (h / 2) for x in range(l)])
    rangees = plages([sum(fonce(px[x, y]) for x in range(0, l, 2)) / (l / 2) for y in range(h)])
    assert len(colonnes) == 2 and len(rangees) == len(PLANCHE), (colonnes, rangees)
    os.makedirs(SORTIE, exist_ok=True)
    for (ya, yb), noms in zip(rangees, PLANCHE):
        for (xa, xb), nom in zip(colonnes, noms):
            carte = planche.crop((xa + RETRAIT, ya + RETRAIT, xb - RETRAIT, yb - RETRAIT))
            image = recadrer(carte).resize(TAILLE, Image.LANCZOS)
            image.save(os.path.join(SORTIE, f'{nom}.jpg'), quality=86, optimize=True, progressive=True)
            print(nom, image.size)


if __name__ == '__main__':
    main()
