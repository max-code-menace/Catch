"""Découpe la planche des sports (design/sports/planche-sports.png) en une image par sport.

La planche : 2 colonnes × 9 rangées de cartes orange sur fond foncé, dans l'ordre de PLANCHE ci-dessous.
Chaque carte est coupée sans ses coins arrondis, puis recadrée autour de l'objet, toujours entier
(le fond orange est prolongé en haut et en bas si besoin).

    python3 -I scripts/decouper_sports.py       # écrit assets/sports/<sport>.jpg et assets/sports/bandeau/<sport>.jpg

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

# (dossier, largeur / hauteur, taille en pixels)
FORMATS = [
    ('', 3 / 2, (360, 240)),  # tuiles (Créer, Mes sports, menu de la carte), vignettes de « Relancer »
    ('bandeau', 5 / 2, (900, 360)),  # bandeau des cartes de « Mes sessions »
]
RETRAIT_COTES = 14  # on enlève les coins arrondis de chaque carte…
RETRAIT_HAUT_BAS = 3  # …sans couper le haut des ballons
MARGE_COTES = 0.12  # de l'air autour de l'objet, en part de sa taille
MARGE_HAUT_BAS = 0.16


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


def prolonger(carte: Image.Image, ajout: int) -> Image.Image:
    """La carte avec `ajout` pixels de fond en plus en haut et en bas : colonne par colonne, la teinte
    du bord (les pixels de l'objet sont ignorés), jointure fondue là où il n'y a que du fond"""
    l, h = carte.size
    hauteur = h + 2 * ajout
    toile = Image.new('RGB', (l, hauteur))
    milieu = ajout + h // 2
    toile.paste(ligne_bord(carte, 0, 8).resize((l, milieu), Image.NEAREST), (0, 0))
    toile.paste(ligne_bord(carte, h - 8, h).resize((l, hauteur - milieu), Image.NEAREST), (0, milieu))
    fondu = 16
    masque = Image.new('L', (l, h), 255)
    mp, bp = masque.load(), carte.load()
    for y in range(h):
        a = min(255, int(255 * min(y, h - 1 - y) / fondu))
        if a < 255:
            for x in range(l):
                mp[x, y] = a if est_fond(bp[x, y]) else 255
    toile.paste(carte, (0, ajout), masque)
    return toile


def recadrer(carte: Image.Image, rapport: float) -> Image.Image:
    """Cadre (largeur / hauteur = rapport) qui contient TOUT l'objet, avec de l'air autour (le fond est prolongé si besoin)"""
    l, h = carte.size
    x0, y0, x1, y1 = boite_objet(carte)
    largeur = max((x1 - x0) * (1 + 2 * MARGE_COTES), (y1 - y0) * (1 + 2 * MARGE_HAUT_BAS) * rapport)
    largeur = int(largeur)
    hauteur = int(largeur / rapport)
    # Assez de fond tout autour (en haut et en bas, puis sur les côtés en tournant l'image) pour centrer l'objet
    ajout_y, ajout_x = h, max(0, largeur - l) + 40
    grande = prolonger(carte, ajout_y)
    grande = prolonger(grande.transpose(Image.Transpose.ROTATE_90), ajout_x).transpose(Image.Transpose.ROTATE_270)
    cx, cy = (x0 + x1) // 2 + ajout_x, (y0 + y1) // 2 + ajout_y
    gauche, haut = cx - largeur // 2, cy - hauteur // 2
    return grande.crop((gauche, haut, gauche + largeur, haut + hauteur))


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
            carte = planche.crop((xa + RETRAIT_COTES, ya + RETRAIT_HAUT_BAS, xb - RETRAIT_COTES, yb - RETRAIT_HAUT_BAS))
            for dossier, rapport, taille in FORMATS:
                image = recadrer(carte, rapport).resize(taille, Image.LANCZOS)
                os.makedirs(os.path.join(SORTIE, dossier), exist_ok=True)
                image.save(os.path.join(SORTIE, dossier, f'{nom}.jpg'), quality=84, optimize=True, progressive=True)
            print(nom)


if __name__ == '__main__':
    main()
