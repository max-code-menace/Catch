"""Fabrique les illustrations de terrain de chaque sport (bandeau des cartes de « Mes sessions »).

Chaque terrain est construit en 3D à partir de ses VRAIES dimensions (en mètres, règlements officiels),
puis vu par une caméra en perspective : les lignes sont justes par construction, pas dessinées à l'œil.

    python3 scripts/generer_terrains.py           # écrit design/terrains/<sport>.svg
    node scripts/rendre_terrains.mjs              # les transforme en assets/terrains/<sport>.jpg

Modifier ce script, pas les fichiers générés.
"""
from __future__ import annotations

import math
import os
import random

LARGEUR, HAUTEUR = 600, 300  # l'image (2:1), rendue ensuite en ×2

# Palette « Chaleur » (tons de l'icône et du bouton Créer)
FOND_HAUT = '#F58A5E'
FOND_BAS = '#E2512D'
SOL = '#F06A3E'
SOL_CLAIR = '#F47B4E'
SOL_EXT = '#D9512E'
LIGNE = '#FFF3EA'
ENCRE = '#2A1C18'
ENCRE_CLAIR = '#4B3530'
FILET = '#3A2622'
VERRE = '#FFE9DE'
OMBRE = 'rgba(80,20,5,0.28)'


# ---------------------------------------------------------------------------
# Caméra
# ---------------------------------------------------------------------------

def _sous(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def _scal(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def _vect(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def _norm(a):
    n = math.sqrt(_scal(a, a))
    return (a[0] / n, a[1] / n, a[2] / n)


class Camera:
    """x : de gauche à droite, y : en s'éloignant, z : vers le haut (mètres)."""

    def __init__(self, position, cible, cadre=None, remplir=0.92, decalage=(0.0, 0.0), focale=None):
        self.pos = position
        self.f = _norm(_sous(cible, position))
        self.r = _norm(_vect(self.f, (0, 0, 1)))
        self.u = _vect(self.r, self.f)
        self.echelle = 1.0
        self.ox = self.oy = 0.0
        if cadre is None:
            # Focale fixe (en largeurs d'image) : la cible au centre, comme un objectif d'appareil photo
            self.echelle = (focale or 1.2) * LARGEUR
            self.ox = LARGEUR / 2 + decalage[0] * LARGEUR
            self.oy = HAUTEUR / 2 + decalage[1] * HAUTEUR
            return
        # Cadrage : les points de `cadre` remplissent l'image (une part `remplir`, peut dépasser 1 pour couper)
        pts = [self._brut(p) for p in cadre]
        xs = [p[0] for p in pts]
        ys = [p[1] for p in pts]
        bw, bh = max(xs) - min(xs), max(ys) - min(ys)
        self.echelle = min(LARGEUR * remplir / bw, HAUTEUR * remplir / bh)
        cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
        self.ox = LARGEUR / 2 - cx * self.echelle + decalage[0] * LARGEUR
        self.oy = HAUTEUR / 2 - cy * self.echelle + decalage[1] * HAUTEUR

    def espace(self, p):
        d = _sous(p, self.pos)
        return (_scal(d, self.r), -_scal(d, self.u), _scal(d, self.f))

    def _brut(self, p):
        x, y, z = self.espace(p)
        return (x / z, y / z)

    def ecran(self, q):
        """Point déjà dans l'espace caméra → image."""
        return (self.ox + q[0] / q[2] * self.echelle, self.oy + q[1] / q[2] * self.echelle)

    def __call__(self, p):
        return self.ecran(self.espace(p))

    def decoupe(self, points, pres=0.5):
        """Polygone découpé au plan juste devant la caméra (les points derrière inverseraient l'image)."""
        qs = [self.espace(p) for p in points]
        out = []
        for i, a in enumerate(qs):
            b = qs[(i + 1) % len(qs)]
            if a[2] >= pres:
                out.append(a)
            if (a[2] >= pres) != (b[2] >= pres):
                t = (pres - a[2]) / (b[2] - a[2])
                out.append(tuple(a[k] + (b[k] - a[k]) * t for k in range(3)))
        return [self.ecran(q) for q in out]

    def profondeur(self, p):
        return _scal(_sous(p, self.pos), self.f)


# ---------------------------------------------------------------------------
# Dessin
# ---------------------------------------------------------------------------

class Scene:
    def __init__(self, cam: Camera, trait: float):
        self.cam = cam
        self.trait = trait  # largeur des lignes au sol, en mètres
        self.sol: list[str] = []  # surfaces et lignes au sol, dans l'ordre
        self.objets: list[tuple[float, str]] = []  # (profondeur, svg), triés du fond vers l'avant
        self.dessus: list[str] = []
        self.ombres: list[str] = []
        self.grain = False  # ombres portées, entre le sol et les objets
        self.soleil = (0.62, 0.55, -0.56)  # direction de la lumière : vers la droite et le fond, en descendant

    def projete(self, p):
        """Où l'ombre d'un point tombe au sol."""
        k = p[2] / -self.soleil[2]
        return (p[0] + self.soleil[0] * k, p[1] + self.soleil[1] * k, 0.0)

    def ombre_portee(self, points, opacite=0.3):
        """Ombre d'une face plane : chaque sommet projeté au sol le long du soleil."""
        self.ombres.append(self.poly([self.projete(p) for p in points], '#4A1004', f'fill-opacity="{opacite}"'))

    def ombre_trait(self, a, b, largeur, opacite=0.3):
        pa, pb = self.cam(self.projete(a)), self.cam(self.projete(b))
        self.ombres.append(f'<line x1="{pa[0]:.2f}" y1="{pa[1]:.2f}" x2="{pb[0]:.2f}" y2="{pb[1]:.2f}" stroke="#4A1004" '
                           f'stroke-opacity="{opacite}" stroke-width="{largeur:.2f}" stroke-linecap="round"/>')

    # -- utilitaires ------------------------------------------------------
    def pts(self, points):
        return ' '.join(f'{x:.2f},{y:.2f}' for x, y in (self.cam(p) for p in points))

    def poly(self, points, couleur, extra=''):
        ecran = self.cam.decoupe(points)
        if len(ecran) < 3:
            return ''
        pts = ' '.join(f'{x:.2f},{y:.2f}' for x, y in ecran)
        return f'<polygon points="{pts}" fill="{couleur}" {extra}/>'

    def au_sol(self, points, couleur, z=0.0, extra=''):
        self.sol.append(self.poly([(x, y, z) for x, y in points], couleur, extra))

    def objet(self, points, couleur, extra='', prof=None, ombre=0.0):
        if ombre:
            self.ombre_portee(points, ombre)
        if prof is None:
            prof = max(self.cam.profondeur(p) for p in points)
        self.objets.append((prof, self.poly(points, couleur, extra)))

    def trait3d(self, a, b, couleur, epaisseur, prof=None, extra=''):
        (x1, y1), (x2, y2) = self.cam(a), self.cam(b)
        if prof is None:
            prof = max(self.cam.profondeur(a), self.cam.profondeur(b))
        self.objets.append((prof, f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" '
                                  f'stroke="{couleur}" stroke-width="{epaisseur}" stroke-linecap="round" {extra}/>'))

    # -- lignes au sol, vraies largeurs ------------------------------------
    def ruban(self, points, ferme=False, largeur=None, couleur=LIGNE, z=0.0):
        """Une ligne peinte au sol qui suit `points` (x, y), de `largeur` mètres."""
        w = (largeur or self.trait) / 2
        n = len(points)
        gauche, droite = [], []
        for i in range(n):
            if ferme:
                p0, p1, p2 = points[i - 1], points[i], points[(i + 1) % n]
            else:
                p0 = points[max(i - 1, 0)]
                p1 = points[i]
                p2 = points[min(i + 1, n - 1)]
            # normales des deux segments, moyennées (onglet)
            def normale(a, b):
                dx, dy = b[0] - a[0], b[1] - a[1]
                l = math.hypot(dx, dy) or 1
                return (-dy / l, dx / l)
            if p0 == p1:
                nx, ny = normale(p1, p2)
                k = 1
            elif p1 == p2:
                nx, ny = normale(p0, p1)
                k = 1
            else:
                a, b = normale(p0, p1), normale(p1, p2)
                nx, ny = a[0] + b[0], a[1] + b[1]
                l = math.hypot(nx, ny) or 1
                nx, ny = nx / l, ny / l
                k = 1 / max(0.3, (nx * a[0] + ny * a[1]))
            gauche.append((p1[0] + nx * w * k, p1[1] + ny * w * k, z))
            droite.append((p1[0] - nx * w * k, p1[1] - ny * w * k, z))
        if ferme:
            self.sol.append(f'<path d="M {self.pts(gauche)} Z M {self.pts(list(reversed(droite)))} Z" '
                            f'fill="{couleur}" fill-rule="evenodd"/>')
        else:
            self.sol.append(self.poly(gauche + list(reversed(droite)), couleur))

    def segment(self, a, b, **k):
        self.ruban([a, b], **k)

    def rectangle(self, x1, y1, x2, y2, **k):
        self.ruban([(x1, y1), (x2, y1), (x2, y2), (x1, y2)], ferme=True, **k)

    def arc(self, cx, cy, r, debut, fin, pas=48, **k):
        """Arc de cercle au sol, angles en degrés (0 = vers +x, 90 = vers +y)."""
        pts = [(cx + r * math.cos(math.radians(debut + (fin - debut) * i / pas)),
                cy + r * math.sin(math.radians(debut + (fin - debut) * i / pas))) for i in range(pas + 1)]
        self.ruban(pts, **k)

    def cercle(self, cx, cy, r, pas=64, **k):
        pts = [(cx + r * math.cos(2 * math.pi * i / pas), cy + r * math.sin(2 * math.pi * i / pas)) for i in range(pas)]
        self.ruban(pts, ferme=True, **k)

    def point(self, cx, cy, r, couleur=LIGNE):
        pts = [(cx + r * math.cos(2 * math.pi * i / 24), cy + r * math.sin(2 * math.pi * i / 24)) for i in range(24)]
        self.au_sol(pts, couleur)

    def tirets(self, a, b, tiret, vide, **k):
        l = math.dist(a, b)
        d = 0.0
        while d < l:
            e = min(d + tiret, l)
            t0, t1 = d / l, e / l
            self.segment((a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0),
                         (a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1), **k)
            d += tiret + vide

    # -- volumes ------------------------------------------------------------
    def boite(self, x1, y1, z1, x2, y2, z2, dessus=ENCRE_CLAIR, cote=ENCRE, face=None):
        """Pavé : on dessine les faces visibles depuis la caméra."""
        face = face or cote
        c = self.cam.pos
        sommets = {
            (i, j, k): (x, y, z)
            for i, x in enumerate((x1, x2)) for j, y in enumerate((y1, y2)) for k, z in enumerate((z1, z2))
        }
        faces = []
        if c[2] > z2:
            faces.append(([(0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1)], dessus))
        if c[1] < y1:
            faces.append(([(0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)], face))
        if c[1] > y2:
            faces.append(([(0, 1, 0), (1, 1, 0), (1, 1, 1), (0, 1, 1)], face))
        if c[0] < x1:
            faces.append(([(0, 0, 0), (0, 1, 0), (0, 1, 1), (0, 0, 1)], cote))
        if c[0] > x2:
            faces.append(([(1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1)], cote))
        prof = self.cam.profondeur(((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2))
        for f in ([(x1, y1), (x2, y1)], [(x2, y1), (x2, y2)], [(x2, y2), (x1, y2)], [(x1, y2), (x1, y1)]):
            self.ombre_portee([(f[0][0], f[0][1], z1), (f[1][0], f[1][1], z1), (f[1][0], f[1][1], z2), (f[0][0], f[0][1], z2)], 0.22)
        svg = ''.join(self.poly([sommets[s] for s in f], col) for f, col in faces)
        self.objets.append((prof, svg))

    def poteau(self, x, y, h, r, couleur=ENCRE, prof=None):
        """Poteau rond vu de face : un rectangle à l'écran, de la largeur du diamètre."""
        (bx, by), (hx, hy) = self.cam((x, y, 0)), self.cam((x, y, h))
        largeur = 2 * r * self.cam.echelle / self.cam.profondeur((x, y, h / 2))
        if prof is None:
            prof = self.cam.profondeur((x, y, h / 2))
        self.ombre_trait((x, y, 0), (x, y, h), max(largeur, 1.2), 0.28)
        self.objets.append((prof, f'<line x1="{bx:.2f}" y1="{by:.2f}" x2="{hx:.2f}" y2="{hy:.2f}" stroke="{couleur}" '
                                  f'stroke-width="{max(largeur, 1.2):.2f}" stroke-linecap="round"/>'))

    def balle(self, x, y, r, couleur=LIGNE, z=None, coutures=None):
        """Une balle posée au sol (ou en l'air à `z`), avec son ombre et un reflet."""
        z = r if z is None else z
        c = self.projete((x, y, z))
        self.ombres.append(self.poly([(c[0] + r * 0.95 * math.cos(2 * math.pi * i / 20), c[1] + r * 0.7 * math.sin(2 * math.pi * i / 20), 0) for i in range(20)],
                                     '#4A1004', 'fill-opacity="0.35"'))
        cx, cy = self.cam((x, y, z))
        rr = r * self.cam.echelle / self.cam.profondeur((x, y, z))
        dessin = (f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{rr:.2f}" fill="{couleur}"/>'
                  f'<path d="M {cx - rr:.2f} {cy:.2f} A {rr:.2f} {rr:.2f} 0 0 0 {cx + rr:.2f} {cy:.2f} A {rr * 0.9:.2f} {rr * 0.75:.2f} 0 0 1 {cx - rr:.2f} {cy:.2f} Z" fill="#5A1405" fill-opacity="0.22"/>'
                  + (coutures(cx, cy, rr) if coutures else '')
                  + f'<circle cx="{cx - rr * 0.35:.2f}" cy="{cy - rr * 0.4:.2f}" r="{rr * 0.28:.2f}" fill="#FFFFFF" fill-opacity="0.55"/>')
        self.objets.append((self.cam.profondeur((x, y, z)) - r, dessin))

    def ombre(self, points):
        self.au_sol(points, OMBRE)

    def ombre_ronde(self, x, y, rx, ry=None):
        ry = ry or rx
        self.au_sol([(x + rx * math.cos(2 * math.pi * i / 24), y + ry * math.sin(2 * math.pi * i / 24)) for i in range(24)], OMBRE)

    def filet(self, a, b, bas, haut, maille, bande=None, couleur=FILET, prof_dec=0.0, trait=0.6, opacite=0.18):
        """Filet vertical tendu de a à b (x, y), entre les hauteurs bas et haut."""
        (ax, ay), (bx2, by2) = a, b
        p = self.cam.profondeur(((ax + bx2) / 2, (ay + by2) / 2, (bas + haut) / 2)) + prof_dec
        self.ombre_portee([(ax, ay, bas), (bx2, by2, bas), (bx2, by2, haut), (ax, ay, haut)], 0.10 + opacite * 0.4)
        if bande:
            self.ombre_portee([(ax, ay, haut - bande), (bx2, by2, haut - bande), (bx2, by2, haut), (ax, ay, haut)], 0.25)
        morceaux = [self.poly([(ax, ay, bas), (bx2, by2, bas), (bx2, by2, haut), (ax, ay, haut)],
                              couleur, f'fill-opacity="{opacite}"')]
        l = math.dist(a, b)
        n = max(1, int(l / maille))
        for i in range(n + 1):
            t = i / n
            x, y = ax + (bx2 - ax) * t, ay + (by2 - ay) * t
            (x1, y1), (x2, y2) = self.cam((x, y, bas)), self.cam((x, y, haut))
            morceaux.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{couleur}" '
                            f'stroke-width="{trait}" stroke-opacity="0.75"/>')
        m = max(1, int((haut - bas) / maille))
        for j in range(m + 1):
            z = bas + (haut - bas) * j / m
            (x1, y1), (x2, y2) = self.cam((ax, ay, z)), self.cam((bx2, by2, z))
            morceaux.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{couleur}" '
                            f'stroke-width="{trait}" stroke-opacity="0.75"/>')
        if bande:
            h = bande
            morceaux.append(self.poly([(ax, ay, haut - h), (bx2, by2, haut - h), (bx2, by2, haut), (ax, ay, haut)], LIGNE))
        self.objets.append((p, ''.join(morceaux)))

    # -- sortie -------------------------------------------------------------
    def _brume(self):
        """Fond l'horizon dans le ciel : le sol s'efface au loin au lieu de finir en bande."""
        f = self.cam.f
        n = math.hypot(f[0], f[1]) or 1
        loin = (self.cam.pos[0] + f[0] / n * 1e5, self.cam.pos[1] + f[1] / n * 1e5, 0)
        y = self.cam(loin)[1]
        if y < -40 or y > HAUTEUR:
            return ''
        return (f'<defs><linearGradient id="brume" x1="0" y1="0" x2="0" y2="1">'
                f'<stop offset="0" stop-color="{FOND_HAUT}" stop-opacity="1"/>'
                f'<stop offset="0.35" stop-color="{FOND_HAUT}" stop-opacity="0.85"/>'
                f'<stop offset="1" stop-color="{FOND_HAUT}" stop-opacity="0"/></linearGradient></defs>'
                f'<rect x="0" y="{y - 30:.1f}" width="{LARGEUR}" height="90" fill="url(#brume)"/>'
                f'<rect x="0" y="0" width="{LARGEUR}" height="{max(y - 30, 0):.1f}" fill="{FOND_HAUT}"/>')

    def svg(self, fond=None):
        objets = ''.join(s for _, s in sorted(self.objets, key=lambda o: -o[0]))
        return (
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {LARGEUR} {HAUTEUR}" width="{LARGEUR}" height="{HAUTEUR}">'
            '<defs>'
            f'<linearGradient id="fond" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{FOND_HAUT}"/>'
            f'<stop offset="1" stop-color="{FOND_BAS}"/></linearGradient>'
            '<radialGradient id="lumiere" cx="0.5" cy="0.35" r="0.75"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.16"/>'
            '<stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>'
            '<linearGradient id="voile" x1="0" y1="0" x2="0" y2="1"><stop offset="0.55" stop-color="#5A1405" stop-opacity="0"/>'
            '<stop offset="1" stop-color="#5A1405" stop-opacity="0.22"/></linearGradient>'
            '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" stitchTiles="stitch"/>'
            '<feColorMatrix type="saturate" values="0"/></filter>'
            '</defs>'
            f'<rect width="{LARGEUR}" height="{HAUTEUR}" fill="url(#fond)"/>'
            + (fond or '')
            + ''.join(self.sol) + ''.join(self.ombres) + self._brume() + objets + ''.join(self.dessus)
            + f'<rect width="{LARGEUR}" height="{HAUTEUR}" fill="url(#lumiere)"/>'
            f'<rect width="{LARGEUR}" height="{HAUTEUR}" fill="url(#voile)"/>'
            + (f'<rect width="{LARGEUR}" height="{HAUTEUR}" filter="url(#grain)" opacity="0.10" style="mix-blend-mode:overlay"/>'
               if self.grain else '')
            + '</svg>'
        )


def camera_cote(lx, ly, hauteur_rel=0.62, recul=1.05, remplir=0.98, extra=(), decalage=(0.0, 0.0), cible_z=0.0, azimut=24):
    """Caméra sur le grand côté, en hauteur et de trois quarts (`azimut` en degrés) :
    le terrain s'étale en largeur et les filets se voient de biais, pas en un simple trait."""
    d = max(lx, ly * 1.6) * recul
    a = math.radians(azimut)
    vy = -(ly / 2 + d)
    pos = (-vy * math.sin(a), vy * math.cos(a), d * hauteur_rel)
    cadre = [(sx * lx / 2, sy * ly / 2, 0) for sx in (-1, 1) for sy in (-1, 1)] + list(extra)
    return Camera(pos, (0, 0, cible_z), cadre, remplir, decalage)


def sol_autour(s: Scene, *_args, couleur=SOL_EXT):
    """Le sol autour du terrain, jusqu'à l'horizon."""
    s.au_sol([(-4000, -4000), (4000, -4000), (4000, 4000), (-4000, 4000)], couleur)


def surface(s: Scene, x1, y1, x2, y2, couleur=SOL):
    s.au_sol([(x1, y1), (x2, y1), (x2, y2), (x1, y2)], couleur)


# ---------------------------------------------------------------------------
# Les terrains (dimensions officielles)
# ---------------------------------------------------------------------------

def foot(cam=None, trait=0.45, essai=False):
    # Loi 1 de l'IFAB : 105 × 68, surface de réparation 16,5 × 40,32, but 7,32 × 2,44
    L, l = 105.0, 68.0
    cam = cam or camera_cote(L, l, hauteur_rel=0.55, remplir=0.97)
    s = Scene(cam, trait)
    sol_autour(s, L, l, 40)
    # bandes de tonte
    for i in range(10):
        x1 = -L / 2 + i * L / 10
        surface(s, x1, -l / 2 - 4, x1 + L / 10, l / 2 + 4, SOL if i % 2 == 0 else SOL_CLAIR)
    s.rectangle(-L / 2, -l / 2, L / 2, l / 2)
    s.segment((0, -l / 2), (0, l / 2))
    s.cercle(0, 0, 9.15)
    s.point(0, 0, 0.5)
    for sens in (-1, 1):
        x = sens * L / 2
        s.ruban([(x, -20.16), (x - sens * 16.5, -20.16), (x - sens * 16.5, 20.16), (x, 20.16)])
        s.ruban([(x, -9.16), (x - sens * 5.5, -9.16), (x - sens * 5.5, 9.16), (x, 9.16)])
        s.point(x - sens * 11, 0, 0.4)
        # arc de réparation : cercle de 9,15 m autour du point, hors de la surface
        a = math.degrees(math.acos(5.5 / 9.15))
        centre = 180 if sens > 0 else 0
        s.arc(x - sens * 11, 0, 9.15, centre - a, centre + a, pas=24)
        for coin in (-1, 1):
            depart = {(-1, -1): 0, (-1, 1): 270, (1, -1): 90, (1, 1): 180}[(sens, coin)]
            s.arc(x, coin * l / 2, 1.0, depart, depart + 90, pas=8)
        # buts 7,32 × 2,44 et filet en arrière
        p = 2.0
        s.filet((x, -3.66), (x + sens * p, -3.66), 0, 2.44, 0.5, couleur=LIGNE)
        s.filet((x, 3.66), (x + sens * p, 3.66), 0, 2.44, 0.5, couleur=LIGNE)
        s.filet((x + sens * p, -3.66), (x + sens * p, 3.66), 0, 2.44, 0.5, couleur=LIGNE)
        for y in (-3.66, 3.66):
            s.poteau(x, y, 2.44, 0.12, LIGNE, prof=cam.profondeur((x, y, 1)) - 5)
        s.trait3d((x, -3.66, 2.44), (x, 3.66, 2.44), LIGNE, 2.0, prof=cam.profondeur((x, 0, 2.44)) - 5)
    for coin_x in (-1, 1):
        for coin_y in (-1, 1):
            s.poteau(coin_x * L / 2, coin_y * l / 2, 1.5, 0.04, ENCRE)
    return s if essai else s.svg()


def basket(cam_essai=None, trait=0.07, essai=False):
    # FIBA : 28 × 15, raquette 4,90 × 5,80, ligne à 3 points 6,75 m (6,60 dans les coins, à 0,90 m des côtés)
    L, l = 28.0, 15.0
    cam = camera_cote(L, l, hauteur_rel=0.6, remplir=0.94, extra=[(-L / 2 - 1, 0, 3.95), (L / 2 + 1, 0, 3.95)])
    cam = cam_essai or cam
    s = Scene(cam, trait)
    sol_autour(s, L, l, 6)
    surface(s, -L / 2 - 1, -l / 2 - 1, L / 2 + 1, l / 2 + 1, SOL)
    s.rectangle(-L / 2, -l / 2, L / 2, l / 2)
    s.segment((0, -l / 2), (0, l / 2))
    s.cercle(0, 0, 1.8)
    for sens in (-1, 1):
        x = sens * L / 2
        panier = x - sens * 1.575
        # raquette pleine, plus foncée
        s.au_sol([(x, -2.45), (x - sens * 5.8, -2.45), (x - sens * 5.8, 2.45), (x, 2.45)], SOL_EXT)
        s.ruban([(x, -2.45), (x - sens * 5.8, -2.45), (x - sens * 5.8, 2.45), (x, 2.45)])
        # cercle de lancer franc : plein hors de la raquette, en tirets dedans
        lf = x - sens * 5.8
        s.arc(lf, 0, 1.8, 90 if sens > 0 else -90, 270 if sens > 0 else 90, pas=24)
        dedans = -90 if sens > 0 else 90
        for k in range(8):
            a0 = dedans + k * 22.5
            s.arc(lf, 0, 1.8, a0 + 3, a0 + 14, pas=4)
        # ligne à 3 points
        y_coin = l / 2 - 0.9
        a = math.degrees(math.asin(y_coin / 6.75))
        dx = math.sqrt(6.75 ** 2 - y_coin ** 2)
        centre = 0 if sens < 0 else 180
        pts = [(x, -y_coin), (panier - sens * dx, -y_coin)]
        arc = [(panier + 6.75 * math.cos(math.radians(t)), 6.75 * math.sin(math.radians(t)))
               for t in [((centre - a) if sens < 0 else (centre + a)) + (2 * a if sens < 0 else -2 * a) * i / 40 for i in range(41)]]
        if arc[0][1] > 0:
            arc.reverse()
        s.ruban(pts + arc + [(x, y_coin)])
        s.arc(panier, 0, 1.25, 90 if sens > 0 else -90, 270 if sens > 0 else 90, pas=16)
        # panneau 1,80 × 1,05 (bas à 2,90 m), cercle à 3,05 m, poteau derrière la ligne de fond
        planche = x - sens * 1.2
        support = x + sens * 1.0
        s.boite(min(support, support + sens * 0.25), -0.15, 0, max(support, support + sens * 0.25), 0.15, 3.3)
        s.boite(min(support, planche), -0.06, 3.2, max(support, planche), 0.06, 3.3)
        s.objet([(planche, -0.9, 2.9), (planche, 0.9, 2.9), (planche, 0.9, 3.95), (planche, -0.9, 3.95)], LIGNE)
        anneau = [(panier + 0.23 * math.cos(2 * math.pi * i / 24), 0.23 * math.sin(2 * math.pi * i / 24), 3.05) for i in range(24)]
        s.objets.append((cam.profondeur((panier, 0, 3.05)) - 0.5,
                         f'<polygon points="{s.pts(anneau)}" fill="none" stroke="{ENCRE}" stroke-width="2"/>'))
        s.ombre([(support - 0.4, -0.6), (support + 0.4, -0.6), (support + 0.4, 0.6), (support - 0.4, 0.6)])
    return s if essai else s.svg()


def volley():
    # FIVB : 18 × 9, lignes d'attaque à 3 m du filet, filet 2,43 m (hommes), 1 m de haut, poteaux à 1 m des côtés
    L, l = 18.0, 9.0
    cam = camera_cote(L, l, hauteur_rel=0.55, remplir=0.98, extra=[(0, -l / 2 - 1, 2.6), (0, l / 2 + 1, 2.6)])
    s = Scene(cam, 0.05)
    sol_autour(s, L, l, 5)
    surface(s, -L / 2, -l / 2, L / 2, l / 2)
    s.rectangle(-L / 2, -l / 2, L / 2, l / 2)
    s.segment((0, -l / 2), (0, l / 2))
    for x in (-3, 3):
        s.segment((x, -l / 2), (x, l / 2))
    s.filet((0, -l / 2 - 0.5), (0, l / 2 + 0.5), 1.43, 2.43, 0.12, bande=0.07)
    for y in (-l / 2, l / 2):  # antennes au-dessus des lignes de côté
        s.trait3d((0, y, 1.43), (0, y, 3.23), LIGNE, 1.6, prof=cam.profondeur((0, y, 2)) - 0.1)
    for y in (-l / 2 - 1, l / 2 + 1):
        s.poteau(0, y, 2.55, 0.06)
        s.trait3d((0, y, 2.43), (0, y + (0.5 if y < 0 else -0.5), 2.43), ENCRE, 1)
    return s.svg()


def tennis():
    # ITF : 23,77 × 10,97 (simple 8,23), carrés de service 6,40 m, filet 0,914 m au centre, 1,07 m aux poteaux
    L, l = 23.77, 10.97
    cam = camera_cote(L, l, hauteur_rel=0.58, remplir=0.96)
    s = Scene(cam, 0.05)
    sol_autour(s, L, l, 8)
    surface(s, -L / 2 - 4, -l / 2 - 2.5, L / 2 + 4, l / 2 + 2.5, SOL_CLAIR)
    surface(s, -L / 2, -l / 2, L / 2, l / 2)
    s.rectangle(-L / 2, -l / 2, L / 2, l / 2)
    s.segment((-L / 2, -4.115), (L / 2, -4.115))
    s.segment((-L / 2, 4.115), (L / 2, 4.115))
    for x in (-6.40, 6.40):
        s.segment((x, -4.115), (x, 4.115))
    s.segment((-6.40, 0), (6.40, 0))
    for x in (-L / 2, L / 2):  # marque centrale de 10 cm
        s.segment((x, 0), (x + (0.1 if x < 0 else -0.1), 0))
    y0, y1 = -l / 2 - 0.914, l / 2 + 0.914
    # filet : bas à 0, haut en chaînette de 1,07 m aux poteaux à 0,914 m au centre
    morceaux = []
    n = 24
    haut = [(0, y0 + (y1 - y0) * i / n, 0.914 + 0.156 * (2 * i / n - 1) ** 2) for i in range(n + 1)]
    morceaux.append(s.poly([(0, y0, 0)] + haut + [(0, y1, 0)], FILET, 'fill-opacity="0.22"'))
    for i in range(0, n + 1):
        p = haut[i]
        (x1, y1_), (x2, y2) = cam((0, p[1], 0)), cam(p)
        morceaux.append(f'<line x1="{x1:.2f}" y1="{y1_:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{FILET}" stroke-width="0.6" stroke-opacity="0.8"/>')
    for k in range(1, 9):
        z = k * 0.1
        (x1, y1_), (x2, y2) = cam((0, y0, z)), cam((0, y1, z))
        morceaux.append(f'<line x1="{x1:.2f}" y1="{y1_:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{FILET}" stroke-width="0.6" stroke-opacity="0.8"/>')
    bande = haut + [(q[0], q[1], q[2] - 0.06) for q in reversed(haut)]
    morceaux.append(s.poly(bande, LIGNE))
    (x1, y1_), (x2, y2) = cam((0, 0, 0)), cam((0, 0, 0.914))
    morceaux.append(f'<line x1="{x1:.2f}" y1="{y1_:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{LIGNE}" stroke-width="1.6"/>')
    s.objets.append((cam.profondeur((0, 0, 0.5)), ''.join(morceaux)))
    for y in (y0, y1):
        s.poteau(0, y, 1.07, 0.05)
    return s.svg()


def padel(cam_essai=None, trait=0.05, essai=False):
    # FIP : 20 × 10, lignes de service à 6,95 m du filet, ligne centrale qui dépasse de 20 cm,
    # filet 0,88 m au centre / 0,92 m aux poteaux. Vitres du fond : 10 m × 3 m + grillage jusqu'à 4 m.
    # Vitres des côtés : 2 m à 3 m de haut puis 2 m à 2 m de haut ; le reste du côté en grillage à 3 m.
    L, l = 20.0, 10.0
    cam = camera_cote(L, l, hauteur_rel=0.62, remplir=0.95, extra=[(-L / 2, l / 2, 4), (L / 2, l / 2, 4), (L / 2, -l / 2, 4)])
    cam = cam_essai or cam
    s = Scene(cam, trait)
    sol_autour(s, L, l, 6)
    surface(s, -L / 2, -l / 2, L / 2, l / 2)
    for x in (-6.95, 6.95):
        s.segment((x, -l / 2), (x, l / 2))
    s.segment((-6.95 - 0.2, 0), (6.95 + 0.2, 0))
    n = 20
    haut = [(0, -l / 2 + l * i / n, 0.88 + 0.04 * (2 * i / n - 1) ** 2) for i in range(n + 1)]
    morceaux = [s.poly([(0, -l / 2, 0)] + haut + [(0, l / 2, 0)], FILET, 'fill-opacity="0.25"')]
    for i in range(n * 2 + 1):
        y = -l / 2 + l * i / (n * 2)
        z = 0.88 + 0.04 * (2 * i / (2 * n) - 1) ** 2
        (x1, y1_), (x2, y2) = cam((0, y, 0)), cam((0, y, z))
        morceaux.append(f'<line x1="{x1:.2f}" y1="{y1_:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{FILET}" stroke-width="0.5" stroke-opacity="0.8"/>')
    bande = haut + [(q[0], q[1], q[2] - 0.05) for q in reversed(haut)]
    morceaux.append(s.poly(bande, LIGNE))
    s.objets.append((cam.profondeur((0, 0, 0.5)), ''.join(morceaux)))
    for y in (-l / 2, l / 2):
        s.poteau(0, y, 0.92, 0.04)

    def vitre(points):
        s.objet(points, VERRE, 'fill-opacity="0.42" stroke="#FFFFFF" stroke-opacity="0.9" stroke-width="0.9"', ombre=0.12)

    def grille(a, b, bas, haut_):
        s.filet(a, b, bas, haut_, 0.2, couleur=ENCRE, trait=0.35, opacite=0.08)

    for sens in (-1, 1):
        x = sens * L / 2
        vitre([(x, -l / 2, 0), (x, l / 2, 0), (x, l / 2, 3), (x, -l / 2, 3)])
        grille((x, -l / 2), (x, l / 2), 3, 4)
        for y in (-l / 2, l / 2):
            xi = x - sens * 2
            xj = x - sens * 4
            vitre([(x, y, 0), (xi, y, 0), (xi, y, 3), (x, y, 3)])
            vitre([(xi, y, 0), (xj, y, 0), (xj, y, 2), (xi, y, 2)])
            grille((x, y), (xi, y), 3, 4)
            grille((xj, y), (sens * 1, y), 0, 3)  # grillage du côté ; portes d'1 m de part et d'autre du filet
    for sens in (-1, 1):
        for y in (-l / 2, l / 2):
            for x in (sens * L / 2, sens * (L / 2 - 2), sens * (L / 2 - 4), sens * 1):
                h = 4 if abs(x) >= L / 2 - 2 else 3
                s.poteau(x, y, h, 0.05, prof=cam.profondeur((x, y, h / 2)) - 0.05)
        for y in (-l / 2 / 3, l / 2 / 3, -l / 2, l / 2):
            s.poteau(sens * L / 2, y, 4, 0.05)
    s.rectangle(-L / 2, -l / 2, L / 2, l / 2)
    return s if essai else s.svg()


def badminton():
    # BWF : 13,40 × 6,10 (simple 5,18), ligne de service court à 1,98 m du filet,
    # ligne de service long double à 0,76 m du fond, filet 1,524 m au centre / 1,55 m aux poteaux
    L, l = 13.40, 6.10
    cam = camera_cote(L, l, hauteur_rel=0.55, remplir=0.96, extra=[(0, -l / 2, 1.55), (0, l / 2, 1.55)])
    s = Scene(cam, 0.04)
    sol_autour(s, L, l, 4)
    surface(s, -L / 2 - 1.5, -l / 2 - 1.5, L / 2 + 1.5, l / 2 + 1.5, SOL_CLAIR)
    surface(s, -L / 2, -l / 2, L / 2, l / 2)
    s.rectangle(-L / 2, -l / 2, L / 2, l / 2)
    s.segment((-L / 2, -2.59), (L / 2, -2.59))
    s.segment((-L / 2, 2.59), (L / 2, 2.59))
    for sens in (-1, 1):
        s.segment((sens * 1.98, -l / 2), (sens * 1.98, l / 2))
        s.segment((sens * (L / 2 - 0.76), -l / 2), (sens * (L / 2 - 0.76), l / 2))
        s.segment((sens * 1.98, 0), (sens * L / 2, 0))
    s.filet((0, -l / 2), (0, l / 2), 0.764, 1.524, 0.05, bande=0.05)
    for y in (-l / 2, l / 2):
        s.poteau(0, y, 1.55, 0.03)
        s.ombre([(-0.3, y - 0.3), (0.3, y - 0.3), (0.3, y + 0.3), (-0.3, y + 0.3)])
    return s.svg()


def squash():
    # WSF : 9,75 × 6,40. Mur avant : ligne haute 4,57 m, ligne de service 1,78 m, plaque (tin) 0,48 m.
    # Mur du fond 2,13 m. Ligne courte à 5,44 m du mur avant, carrés de service 1,60 m.
    L, l = 9.75, 6.40  # y : du mur du fond (−) au mur avant (+), x : largeur
    y_f, y_a = -L / 2, L / 2
    cam = Camera((0, y_f - 4.6, 3.6), (0, 1.2, 1.4),
                 [(-l / 2, y_f, 0), (l / 2, y_f, 0), (-l / 2, y_a, 4.57), (l / 2, y_a, 4.57), (-l / 2, y_a, 0)],
                 remplir=1.02)
    s = Scene(cam, 0.05)
    MUR = '#F7D9CA'
    MUR_COTE = '#EFC6B2'
    surface(s, -l / 2, y_f, l / 2, y_a)
    # parquet : lames dans la longueur
    for i in range(1, 16):
        x = -l / 2 + i * l / 16
        s.segment((x, y_f), (x, y_a), largeur=0.012, couleur='rgba(120,30,10,0.18)')
    court = y_a - 5.44
    s.segment((-l / 2, court), (l / 2, court))
    s.segment((0, court), (0, y_f))
    for sens in (-1, 1):
        s.ruban([(sens * l / 2, court - 1.6), (sens * (l / 2 - 1.6), court - 1.6), (sens * (l / 2 - 1.6), court)])
    # murs
    s.sol.append(s.poly([(-l / 2, y_a, 0), (l / 2, y_a, 0), (l / 2, y_a, 5.6), (-l / 2, y_a, 5.6)], MUR))
    for sens in (-1, 1):
        x = sens * l / 2
        s.sol.append(s.poly([(x, y_f, 0), (x, y_a, 0), (x, y_a, 5.6), (x, y_f, 5.6)], MUR_COTE))
    rouge = '#C8361C'

    def ligne_mur(a, b, ep=0.05):
        s.sol.append(f'<line x1="{cam(a)[0]:.2f}" y1="{cam(a)[1]:.2f}" x2="{cam(b)[0]:.2f}" y2="{cam(b)[1]:.2f}" '
                     f'stroke="{rouge}" stroke-width="{ep * cam.echelle / cam.profondeur(a):.2f}"/>')

    s.sol.append(s.poly([(-l / 2, y_a - 0.005, 0), (l / 2, y_a - 0.005, 0), (l / 2, y_a - 0.005, 0.48), (-l / 2, y_a - 0.005, 0.48)], rouge))
    ligne_mur((-l / 2, y_a, 1.78), (l / 2, y_a, 1.78))
    ligne_mur((-l / 2, y_a, 4.57), (l / 2, y_a, 4.57))
    for sens in (-1, 1):
        x = sens * (l / 2 - 0.005)
        ligne_mur((x, y_a, 4.57), (x, y_f, 2.13))
        ligne_mur((x, y_a, 0), (x, y_a, 5.6), 0.02)
    # mur du fond vitré (on regarde à travers) : seulement le bas et le haut du cadre
    s.dessus.append(s.poly([(-l / 2, y_f, 0), (l / 2, y_f, 0), (l / 2, y_f, 2.13), (-l / 2, y_f, 2.13)],
                           VERRE, 'fill-opacity="0.10" stroke="#FFFFFF" stroke-opacity="0.6" stroke-width="1"'))
    ombre = (f'<line x1="{cam((-l/2, y_a, 0))[0]:.2f}" y1="{cam((-l/2, y_a, 0))[1]:.2f}" x2="{cam((l/2, y_a, 0))[0]:.2f}" '
             f'y2="{cam((l/2, y_a, 0))[1]:.2f}" stroke="#5A1405" stroke-opacity="0.25" stroke-width="2"/>')
    s.sol.append(ombre)
    return s.svg()


def pingpong():
    # ITTF : table 2,74 × 1,525 à 0,76 m, bords blancs de 2 cm, ligne centrale 3 mm,
    # filet 15,25 cm de haut qui dépasse de 15,25 cm de chaque côté
    L, l, h = 2.74, 1.525, 0.76
    cam = Camera((1.9, -3.6, 2.6), (0, 0.1, 0.55), [(-L / 2 - 0.4, -l / 2, 0), (L / 2 + 0.4, -l / 2, 0),
                                                       (-L / 2, l / 2, h), (L / 2, l / 2, h), (0, l / 2 + 1.3, 0)],
                 remplir=1.02)
    s = Scene(cam, 0.02)
    sol_autour(s, 12, 10, 0)
    for i in range(-8, 9):  # sol en dalles
        s.segment((i * 0.9, -6), (i * 0.9, 6), largeur=0.012, couleur='rgba(120,30,10,0.18)')
    s.ombre([(-L / 2 - 0.05, -l / 2 + 0.05), (L / 2 + 0.15, -l / 2 + 0.05), (L / 2 + 0.25, l / 2 + 0.25), (-L / 2 + 0.05, l / 2 + 0.25)])
    BLEU = '#1F3B5C'
    BLEU_COTE = '#152A42'
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = sx * (L / 2 - 0.3), sy * (l / 2 - 0.2)
            s.boite(x - 0.03, y - 0.03, 0, x + 0.03, y + 0.03, h - 0.025)
    s.boite(-L / 2, -l / 2, h - 0.025, L / 2, l / 2, h, dessus=BLEU, cote=BLEU_COTE, face=BLEU_COTE)
    bord = 0.02
    pts = lambda x1, y1, x2, y2: [(x1, y1, h + 0.001), (x2, y1, h + 0.001), (x2, y2, h + 0.001), (x1, y2, h + 0.001)]
    lignes = [pts(-L / 2, -l / 2, L / 2, -l / 2 + bord), pts(-L / 2, l / 2 - bord, L / 2, l / 2),
              pts(-L / 2, -l / 2, -L / 2 + bord, l / 2), pts(L / 2 - bord, -l / 2, L / 2, l / 2),
              pts(-L / 2, -0.0015, L / 2, 0.0015)]
    s.objets.append((cam.profondeur((0, 0, h)) - 0.01, ''.join(s.poly(p, LIGNE) for p in lignes)))
    s.filet((0, -l / 2 - 0.1525), (0, l / 2 + 0.1525), h, h + 0.1525, 0.02, bande=0.012)
    for y in (-l / 2 - 0.1525, l / 2 + 0.1525):
        s.poteau(0, y, h + 0.1525, 0.015)
    return s.svg()


def escalade():
    # Mur de bloc : pans de 4,5 m (dalle, vertical, dévers) au-dessus d'un tapis de 30 cm
    cam = Camera((0, -9.5, 3.0), (0, 0, 2.0), [(-6.5, 0.0, 0), (6.5, 0.0, 0), (-6.5, 1.2, 4.6), (6.5, 1.2, 4.6)], remplir=1.04)
    s = Scene(cam, 0.05)
    s.au_sol([(-10, -8), (10, -8), (10, 3), (-10, 3)], SOL_EXT)
    s.boite(-6.8, -2.2, 0, 6.8, 0.6, 0.3, dessus='#3B2723', cote='#2A1C18', face='#2A1C18')
    for x in (-3.4, 0, 3.4):
        s.objets.append((cam.profondeur((x, -0.8, 0.31)) - 0.01,
                         f'<line x1="{cam((x, -2.2, 0.31))[0]:.2f}" y1="{cam((x, -2.2, 0.31))[1]:.2f}" '
                         f'x2="{cam((x, 0.6, 0.31))[0]:.2f}" y2="{cam((x, 0.6, 0.31))[1]:.2f}" stroke="#1A100E" stroke-width="1"/>'))
    pans = [
        ((-6.8, 0.6), (-3.4, 0.6), 0.6, 1.0, '#F59874'),   # dalle
        ((-3.4, 0.6), (0.0, 0.6), 0.6, 0.6, '#F7AB8B'),    # vertical
        ((0.0, 0.6), (3.4, 0.6), 0.6, -1.2, '#F08A63'),    # dévers
        ((3.4, 0.6), (6.8, 0.6), 0.6, -0.4, '#F59E7B'),
    ]
    alea = random.Random(7)
    couleurs = ['#2A1C18', '#FFF3EA', '#2A1C18', '#C8361C', '#FFD23F', '#2A1C18']
    for (a, b, y0, dy, coul) in pans:
        haut_y = y0 + dy
        p = [(a[0], y0, 0.3), (b[0], y0, 0.3), (b[0], haut_y, 4.6), (a[0], haut_y, 4.6)]
        morceaux = [s.poly(p, coul, 'stroke="#C8562F" stroke-width="0.8"')]
        for _ in range(14):
            u, v = alea.uniform(0.08, 0.92), alea.uniform(0.06, 0.95)
            x = a[0] + (b[0] - a[0]) * u
            z = 0.3 + 4.3 * v
            y = y0 + dy * v
            r = alea.uniform(0.08, 0.2)
            cx, cy = cam((x, y, z))
            rr = r * cam.echelle / cam.profondeur((x, y, z))
            c = alea.choice(couleurs)
            morceaux.append(f'<ellipse cx="{cx:.2f}" cy="{cy:.2f}" rx="{rr:.2f}" ry="{rr * 0.8:.2f}" fill="{c}" transform="rotate({alea.uniform(-40, 40):.0f} {cx:.2f} {cy:.2f})"/>')
        s.objets.append((cam.profondeur(((a[0] + b[0]) / 2, y0 + dy, 2.5)) + 3, ''.join(morceaux)))
    return s.svg()


def boxe():
    # Ring : 6,10 m entre les cordes, plateau à 1 m du sol, 4 cordes à 40, 71, 102 et 132 cm,
    # coins rouge et bleu en diagonale, deux coins neutres blancs
    c, plateau = 6.10, 1.0
    m = c / 2 + 0.6  # le plateau dépasse de 60 cm
    cam = Camera((4.5, -c / 2 - 11, 6.5), (0, 0, 1.2), [(-m, -m, 0), (m, -m, 0), (m, m, 0), (-c / 2, c / 2, plateau + 1.42), (c / 2, c / 2, plateau + 1.42)], remplir=0.9)
    s = Scene(cam, 0.05)
    sol_autour(s, 20, 20, 0)
    s.ombre([(-m - 0.3, -m), (m + 0.6, -m), (m + 0.6, m + 0.4), (-m - 0.3, m + 0.4)])
    s.boite(-m, -m, 0, m, m, plateau, dessus=SOL, cote='#2A1C18', face='#3B2723')
    tapis = [(-m, -m, plateau), (m, -m, plateau), (m, m, plateau), (-m, m, plateau)]
    s.objets.append((cam.profondeur((0, 0, plateau)) - 0.01, s.poly([(x * c / 2 / m, y * c / 2 / m, z + 0.002) for x, y, z in tapis], SOL_CLAIR)))
    coins = {(-1, -1): '#C8361C', (1, 1): '#2D5DA8', (1, -1): LIGNE, (-1, 1): LIGNE}
    hauteurs = [0.40, 0.71, 1.02, 1.32]
    for (sx, sy), coul in coins.items():
        x, y = sx * c / 2, sy * c / 2
        s.poteau(x, y, plateau + 1.42, 0.07, ENCRE, prof=cam.profondeur((x, y, plateau)))
        s.objets.append((cam.profondeur((x, y, plateau)) - 0.02,
                         f'<line x1="{cam((x, y, plateau + 0.3))[0]:.2f}" y1="{cam((x, y, plateau + 0.3))[1]:.2f}" '
                         f'x2="{cam((x, y, plateau + 1.4))[0]:.2f}" y2="{cam((x, y, plateau + 1.4))[1]:.2f}" stroke="{coul}" '
                         f'stroke-width="{0.32 * cam.echelle / cam.profondeur((x, y, plateau)):.2f}" stroke-linecap="round"/>'))
    cotes = [((-1, -1), (1, -1)), ((1, -1), (1, 1)), ((1, 1), (-1, 1)), ((-1, 1), (-1, -1))]
    for (a, b) in cotes:
        for hz in hauteurs:
            pa = (a[0] * c / 2, a[1] * c / 2, plateau + hz)
            pb = (b[0] * c / 2, b[1] * c / 2, plateau + hz)
            prof = max(cam.profondeur(pa), cam.profondeur(pb)) - (0 if a[1] == b[1] == 1 else 0.5)
            if a[1] == b[1] == -1:
                prof = min(cam.profondeur(pa), cam.profondeur(pb)) - 0.5
            s.trait3d(pa, pb, LIGNE, 1.6, prof=prof)
    return s.svg()


def course():
    # Piste de 400 m (World Athletics) : lignes droites de 84,39 m, virages de 36,50 m de rayon, 8 couloirs de 1,22 m
    R, D, n, w = 36.5, 84.39, 8, 1.22
    cam = Camera((40, -95, 42), (18, 0, 0), [(-D / 2, -R - n * w, 0), (D / 2 + R + n * w, 0, 0), (D / 2, R + n * w, 0)], remplir=1.15, decalage=(-0.04, 0.02))
    s = Scene(cam, 0.05)
    s.au_sol([(-200, -200), (200, -200), (200, 200), (-200, 200)], SOL_EXT)

    def contour(r):
        pts = []
        for i in range(41):
            a = -90 + 180 * i / 40
            pts.append((D / 2 + r * math.cos(math.radians(a)), r * math.sin(math.radians(a))))
        for i in range(41):
            a = 90 + 180 * i / 40
            pts.append((-D / 2 + r * math.cos(math.radians(a)), r * math.sin(math.radians(a))))
        return pts

    ext = contour(R + n * w)
    s.au_sol(ext, SOL)
    s.au_sol(contour(R), '#D9482A')
    s.au_sol(contour(R - 1.0), '#B84A2C')
    for k in range(n + 1):
        s.ruban(contour(R + k * w), ferme=True)
    # ligne d'arrivée au bout de la ligne droite d'en face
    s.segment((D / 2, -R), (D / 2, -R - n * w), largeur=0.3)
    for k in range(n):  # numéros de couloir : petits traits sur la ligne d'arrivée
        y = -R - (k + 0.5) * w
        s.segment((D / 2 + 1.2, y), (D / 2 + 1.8, y), largeur=0.25)
    return s.svg()


def velo():
    # Route qui serpente dans la campagne, ligne blanche en tirets
    cam = Camera((0, -40, 16), (0, 30, 0), [(-30, 0, 0), (30, 0, 0), (-30, 90, 0), (30, 90, 0)], remplir=1.0)
    s = Scene(cam, 0.15)
    s.au_sol([(-200, -60), (200, -60), (200, 400), (-200, 400)], SOL)
    for i in range(12):  # champs en bandes
        y = 20 + i * 18
        s.au_sol([(-200, y), (200, y + 6), (200, y + 14), (-200, y + 8)], SOL_CLAIR)
    centre = [(14 * math.sin(t / 22) - 4, t) for t in range(-60, 260, 2)]

    def decale(pts, d):
        out = []
        for i, (x, y) in enumerate(pts):
            a = pts[max(i - 1, 0)]
            b = pts[min(i + 1, len(pts) - 1)]
            dx, dy = b[0] - a[0], b[1] - a[1]
            l = math.hypot(dx, dy)
            out.append((x - dy / l * d, y + dx / l * d))
        return out

    g, d = decale(centre, 3.2), decale(centre, -3.2)
    s.au_sol(g + list(reversed(d)), '#3A2622')
    s.ruban(decale(centre, 2.9), largeur=0.15)
    s.ruban(decale(centre, -2.9), largeur=0.15)
    for i in range(0, len(centre) - 3, 4):
        s.ruban(centre[i:i + 3], largeur=0.15)
    alea = random.Random(3)
    for _ in range(18):
        y = alea.uniform(-5, 200)
        cote = alea.choice((-1, 1))
        x = 14 * math.sin(y / 22) - 4 + cote * alea.uniform(8, 30)
        h = alea.uniform(4, 7)
        s.poteau(x, y, h * 0.4, 0.15, '#3A2622')
        cx, cy = cam((x, y, h * 0.65))
        rr = h * 0.28 * cam.echelle / cam.profondeur((x, y, h))
        s.objets.append((cam.profondeur((x, y, 0)) - 0.5,
                         f'<ellipse cx="{cx:.2f}" cy="{cy:.2f}" rx="{rr:.2f}" ry="{rr * 1.35:.2f}" fill="#8F2410"/>'
                         f'<ellipse cx="{cx - rr * 0.3:.2f}" cy="{cy - rr * 0.35:.2f}" rx="{rr * 0.45:.2f}" ry="{rr * 0.6:.2f}" fill="#A8301A"/>'))
        s.ombre([(x - 1.5, y - 0.5), (x + 2.5, y - 0.5), (x + 2.5, y + 1.5), (x - 1.5, y + 1.5)])
    return s.svg()


def ultimate():
    # WFDF : 100 × 37 dont deux zones d'en-but de 18 m ; plots orange aux 8 coins
    L, l = 100.0, 37.0
    cam = camera_cote(L, l, hauteur_rel=0.5, remplir=0.97)
    s = Scene(cam, 0.35)
    sol_autour(s, L, l, 40)
    for i in range(10):
        x1 = -L / 2 + i * L / 10
        surface(s, x1, -l / 2 - 4, x1 + L / 10, l / 2 + 4, SOL if i % 2 == 0 else SOL_CLAIR)
    s.rectangle(-L / 2, -l / 2, L / 2, l / 2)
    for x in (-L / 2 + 18, L / 2 - 18):
        s.segment((x, -l / 2), (x, l / 2))
    for x in (-L / 2, -L / 2 + 18, L / 2 - 18, L / 2):
        for y in (-l / 2, l / 2):
            p = [(x - 0.5, y, 0), (x + 0.5, y, 0), (x, y, 0.9)]
            s.objet(p, '#FFD23F')
    # le disque, en l'air
    cx, cy = cam((6, -4, 2.2))
    rr = 0.6 * cam.echelle / cam.profondeur((6, -4, 2.2))
    s.dessus.append(f'<ellipse cx="{cx:.2f}" cy="{cy:.2f}" rx="{rr * 1.5:.2f}" ry="{rr * 0.55:.2f}" fill="{LIGNE}"/>'
                    f'<ellipse cx="{cx:.2f}" cy="{cy - rr * 0.08:.2f}" rx="{rr:.2f}" ry="{rr * 0.32:.2f}" fill="none" stroke="#E0CFC4" stroke-width="1"/>')
    s.ombre_ronde(6.3, -3.6, 0.9, 0.5)
    return s.svg()


def spikeball():
    # Filet rond de 91 cm à 25 cm du sol, 5 pieds, sur l'herbe d'un parc ; balle jaune
    cam = Camera((0, -3.4, 2.6), (0, 0.2, 0.1), [(-1.6, -0.5, 0), (1.6, -0.5, 0), (-1.6, 1.4, 0), (1.6, 1.4, 0)], remplir=1.0)
    s = Scene(cam, 0.03)
    s.au_sol([(-20, -10), (20, -10), (20, 20), (-20, 20)], SOL)
    alea = random.Random(5)
    for _ in range(220):  # touffes d'herbe
        x, y = alea.uniform(-4, 4), alea.uniform(-1.5, 5)
        a, b = cam((x, y, 0)), cam((x + alea.uniform(-0.02, 0.02), y, 0.05))
        s.sol.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#D9482A" stroke-width="1.2" stroke-linecap="round"/>')
    r, h = 0.455, 0.25
    s.ombre([(r * math.cos(2 * math.pi * i / 32) + 0.08, r * math.sin(2 * math.pi * i / 32) + 0.1) for i in range(32)])
    for i in range(5):
        a = 2 * math.pi * i / 5 + 0.3
        x, y = r * 0.95 * math.cos(a), r * 0.95 * math.sin(a)
        s.trait3d((x * 1.08, y * 1.08, 0), (x, y, h), ENCRE, 3.2, prof=cam.profondeur((x, y, h / 2)) + (0.6 if y > 0 else -0.6))
    anneau = [(r * math.cos(2 * math.pi * i / 48), r * math.sin(2 * math.pi * i / 48), h) for i in range(48)]
    morceaux = [s.poly(anneau, ENCRE, 'fill-opacity="0.35"')]
    for k in range(-6, 7):
        d = k * r / 7
        c = math.sqrt(max(r * r - d * d, 0))
        for a, b in (((d, -c, h), (d, c, h)), ((-c, d, h), (c, d, h))):
            pa, pb = cam(a), cam(b)
            morceaux.append(f'<line x1="{pa[0]:.2f}" y1="{pa[1]:.2f}" x2="{pb[0]:.2f}" y2="{pb[1]:.2f}" stroke="{ENCRE}" stroke-width="0.9"/>')
    exterieur = [(1.04 * x, 1.04 * y, h) for x, y, _ in anneau]
    morceaux.append(f'<polygon points="{s.pts(exterieur)}" fill="none" stroke="{ENCRE}" stroke-width="5"/>')
    s.objets.append((cam.profondeur((0, 0, h)), ''.join(morceaux)))
    bx, by = cam((0.75, -0.25, 0.9))
    rb = 0.06 * cam.echelle / cam.profondeur((0.75, -0.25, 0.9))
    s.dessus.append(f'<circle cx="{bx:.2f}" cy="{by:.2f}" r="{rb:.2f}" fill="#FFD23F"/>'
                    f'<circle cx="{bx - rb * 0.3:.2f}" cy="{by - rb * 0.3:.2f}" r="{rb * 0.35:.2f}" fill="#FFF3B0"/>')
    s.ombre_ronde(0.8, -0.2, 0.07, 0.05)
    return s.svg()


def petanque():
    # Terrain de 15 × 4 en gravier, cercle de lancer de 50 cm, cochonnet et boules de 7,5 cm
    L, l = 15.0, 4.0
    cam = Camera((-1.2, -3.2, 2.0), (2.3, 0.2, 0), [(0.8, -l / 2, 0), (4.5, -l / 2, 0), (0.8, l / 2, 0), (4.5, l / 2, 0)], remplir=1.1)
    s = Scene(cam, 0.03)
    s.au_sol([(-40, -30), (40, -30), (40, 30), (-40, 30)], SOL_EXT)
    GRAVIER = '#F2875E'
    surface(s, -L / 2, -l / 2, L / 2, l / 2, GRAVIER)
    alea = random.Random(9)
    for _ in range(2600):
        x, y = alea.uniform(-L / 2, L / 2), alea.uniform(-l / 2, l / 2)
        px, py = cam((x, y, 0))
        rr = 0.012 * cam.echelle / cam.profondeur((x, y, 0))
        s.sol.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="{rr:.2f}" fill="{alea.choice(["#E0673F", "#F9A27F", "#D9572F"])}"/>')
    # bordures en bois
    for y in (-l / 2, l / 2):
        s.boite(-L / 2, y - 0.08, 0, L / 2, y + 0.08, 0.15, dessus='#9C3A1E', cote='#7A2A14', face='#7A2A14')
    s.cercle(0.6, -0.3, 0.25)  # cercle de lancer (50 cm)
    boules = [(2.6, 0.1, 'c'), (2.95, -0.25, 'a'), (2.3, 0.5, 'b'), (3.3, 0.35, 'a'), (2.0, -0.35, 'b'), (2.75, 0.75, 'b')]
    for x, y, t in boules:
        r = 0.015 if t == 'c' else 0.0375
        r_vue = r
        s.ombre([(x + r_vue * math.cos(2 * math.pi * i / 16) + r_vue * 0.6, y + r_vue * math.sin(2 * math.pi * i / 16) + r_vue * 0.4) for i in range(16)])
        cx, cy = cam((x, y, r_vue))
        rr = r_vue * cam.echelle / cam.profondeur((x, y, r_vue))
        if t == 'c':
            dessin = f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{rr:.2f}" fill="#FFD23F"/>'
        else:
            base = '#6E6461' if t == 'a' else '#4A3F3C'
            dessin = (f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{rr:.2f}" fill="{base}"/>'
                      f'<circle cx="{cx - rr * 0.3:.2f}" cy="{cy - rr * 0.35:.2f}" r="{rr * 0.35:.2f}" fill="#D8D2CF" fill-opacity="0.8"/>')
        s.objets.append((cam.profondeur((x, y, 0)), dessin))
    return s.svg()


def streetworkout():
    # Aire de street workout : barres de traction (2,2 m), barres parallèles (1,2 m), espalier ; sol amortissant
    cam = Camera((0, -9.5, 4.2), (0, 0.5, 1.3), [(-5.5, -1.5, 0), (5.5, -1.5, 0), (-5.5, 1.5, 2.6), (5.5, 1.5, 2.6)], remplir=1.0)
    s = Scene(cam, 0.05)
    s.au_sol([(-30, -20), (30, -20), (30, 30), (-30, 30)], SOL_EXT)
    surface(s, -6, -2.5, 6, 2.5, '#C94A2B')
    for i in range(-6, 7):  # dalles
        s.segment((i, -2.5), (i, 2.5), largeur=0.02, couleur='rgba(60,10,0,0.25)')
    for j in range(-2, 3):
        s.segment((-6, j), (6, j), largeur=0.02, couleur='rgba(60,10,0,0.25)')
    r = 0.05

    def barre(a, b):
        s.trait3d(a, b, ENCRE, 2.6, prof=max(cam.profondeur(a), cam.profondeur(b)) - 0.1)

    # portique de traction à 3 hauteurs
    xs = [-5.0, -3.6, -2.2, -0.8]
    hs = [2.0, 2.3, 2.6]
    for x in xs:
        s.poteau(x, 0.6, 2.7, r)
    for i, h in enumerate(hs):
        barre((xs[i], 0.6, h), (xs[i + 1], 0.6, h))
    # barres parallèles
    for y in (-0.6, -0.05):
        for x in (1.2, 3.0):
            s.poteau(x, y, 1.2, r * 0.8)
        barre((1.0, y, 1.2), (3.2, y, 1.2))
    # espalier
    for x in (4.2, 5.2):
        s.poteau(x, 1.0, 2.4, r)
    for k in range(1, 9):
        barre((4.2, 1.0, k * 0.27), (5.2, 1.0, k * 0.27))
    for x0, x1, y in ((-5.2, -0.6, 0.6), (1.0, 3.2, -0.3), (4.0, 5.4, 1.0)):
        s.ombre([(x0, y - 0.5), (x1 + 0.5, y - 0.5), (x1 + 0.5, y + 0.4), (x0, y + 0.4)])
    return s.svg()


def rugby():
    # World Rugby : 100 m entre les lignes d'essai, 70 m de large, en-buts de 10 m,
    # lignes des 22 m pleines, des 10 m en tirets, tirets à 5 m et 15 m des touches ; poteaux en H de 5,60 m, barre à 3 m
    L, l, eb = 100.0, 70.0, 10.0
    cam = camera_cote(L + 2 * eb, l, hauteur_rel=0.52, remplir=0.96, extra=[(L / 2, 0, 16), (-L / 2, 0, 16)])
    s = Scene(cam, 0.4)
    sol_autour(s, L + 2 * eb, l, 40)
    for i in range(12):
        x1 = -(L + 2 * eb) / 2 + i * (L + 2 * eb) / 12
        surface(s, x1, -l / 2 - 4, x1 + (L + 2 * eb) / 12, l / 2 + 4, SOL if i % 2 == 0 else SOL_CLAIR)
    s.rectangle(-L / 2 - eb, -l / 2, L / 2 + eb, l / 2)
    for x in (-L / 2, L / 2, -28, 28, 0):
        s.segment((x, -l / 2), (x, l / 2))
    for x in (-10, 10):
        s.tirets((x, -l / 2), (x, l / 2), 2.5, 2.5)
    for y in (-l / 2 + 5, -l / 2 + 15, l / 2 - 15, l / 2 - 5):
        for x in (-L / 2 + 5, -28, -10, 0, 10, 28, L / 2 - 5):
            s.segment((x - 1.5, y), (x + 1.5, y))
    for sens in (-1, 1):
        x = sens * L / 2
        for y in (-2.8, 2.8):
            s.poteau(x, y, 16, 0.12, LIGNE)
            s.boite(x - 0.35, y - 0.35, 0, x + 0.35, y + 0.35, 1.8, dessus='#E8E0DA', cote='#D7CCC5', face='#CFC3BB')
        s.trait3d((x, -2.8, 3), (x, 2.8, 3), LIGNE, 2.2, prof=cam.profondeur((x, 0, 3)) - 1)
    return s.svg()


def autre():
    # Terrain multisport (« agora ») de 30 × 15 : lignes de foot et de basket, palissade basse
    L, l = 30.0, 15.0
    cam = camera_cote(L, l, hauteur_rel=0.6, remplir=1.0, extra=[(-L / 2, 0, 1.2), (L / 2, 0, 1.2)])
    s = Scene(cam, 0.08)
    sol_autour(s, L, l, 8)
    surface(s, -L / 2, -l / 2, L / 2, l / 2)
    s.rectangle(-L / 2 + 0.5, -l / 2 + 0.5, L / 2 - 0.5, l / 2 - 0.5)
    s.segment((0, -l / 2 + 0.5), (0, l / 2 - 0.5))
    s.cercle(0, 0, 3)
    for sens in (-1, 1):
        x = sens * (L / 2 - 0.5)
        s.ruban([(x, -4.5), (x - sens * 6, -4.5), (x - sens * 6, 4.5), (x, 4.5)])
    for sens in (-1, 1):
        x = sens * L / 2
        s.filet((x, -1.5), (x, 1.5), 0, 2, 0.3, couleur=LIGNE)
        s.boite(x - 0.05, -l / 2, 0, x + 0.05, -1.5, 1.2, dessus=ENCRE, cote=ENCRE_CLAIR, face=ENCRE_CLAIR)
        s.boite(x - 0.05, 1.5, 0, x + 0.05, l / 2, 1.2, dessus=ENCRE, cote=ENCRE_CLAIR, face=ENCRE_CLAIR)
    s.filet((-L / 2, l / 2), (L / 2, l / 2), 0, 1.2, 0.6, couleur=ENCRE)
    s.filet((-L / 2, -l / 2), (L / 2, -l / 2), 0, 1.2, 0.6, couleur=ENCRE)
    return s.svg()


# ---------------------------------------------------------------------------
# Essais du passage « directeur artistique » : cadrage serré, soleil, grain, ballon
# ---------------------------------------------------------------------------

def coutures_basket(cx, cy, r):
    t = f'stroke="{ENCRE}" stroke-width="{max(r * 0.09, 0.7):.2f}" fill="none"'
    return (f'<line x1="{cx - r:.2f}" y1="{cy:.2f}" x2="{cx + r:.2f}" y2="{cy:.2f}" {t}/>'
            f'<line x1="{cx:.2f}" y1="{cy - r:.2f}" x2="{cx:.2f}" y2="{cy + r:.2f}" {t}/>'
            f'<path d="M {cx - r * 0.7:.2f} {cy - r * 0.7:.2f} Q {cx - r * 0.25:.2f} {cy:.2f} {cx - r * 0.7:.2f} {cy + r * 0.7:.2f}" {t}/>'
            f'<path d="M {cx + r * 0.7:.2f} {cy - r * 0.7:.2f} Q {cx + r * 0.25:.2f} {cy:.2f} {cx + r * 0.7:.2f} {cy + r * 0.7:.2f}" {t}/>')


def coutures_foot(cx, cy, r):
    morceaux = [f'<polygon points="{" ".join(f"{cx + r * 0.38 * math.cos(math.radians(90 + 72 * i)):.2f},{cy - r * 0.38 * math.sin(math.radians(90 + 72 * i)):.2f}" for i in range(5))}" fill="{ENCRE}"/>']
    for i in range(5):
        a = math.radians(90 + 72 * i + 36)
        px, py = cx + r * 0.92 * math.cos(a), cy - r * 0.92 * math.sin(a)
        morceaux.append(f'<circle cx="{px:.2f}" cy="{py:.2f}" r="{r * 0.2:.2f}" fill="{ENCRE}"/>')
    nom = f'ballon{int(cx)}{int(cy)}'
    return (f'<clipPath id="{nom}"><circle cx="{cx:.2f}" cy="{cy:.2f}" r="{r:.2f}"/></clipPath>'
            f'<g clip-path="url(#{nom})">' + ''.join(morceaux) + '</g>')


def essai_foot():
    # Surface de réparation et but, vus depuis l'extérieur du point de penalty
    cam = Camera((27, -19, 11), (47.0, 0, 0.6), focale=1.55, decalage=(0.0, 0.0))
    s = foot(cam=cam, trait=0.13, essai=True)
    s.grain = True
    s.balle(52.5 - 11, 0, 0.24, LIGNE, coutures=coutures_foot)
    return s.svg()


def essai_basket():
    # Demi-terrain : raquette, cercle de lancer franc, ligne à 3 points, panneau et filet
    cam = Camera((-6, -15, 10), (10.6, 0.2, 1.5), focale=1.75, decalage=(0.0, 0.0))
    s = basket(cam_essai=cam, trait=0.06, essai=True)
    s.grain = True
    panier = 14 - 1.575
    # filet du panier : tronc de cône de 45 cm
    morceaux = []
    for i in range(12):
        a = 2 * math.pi * i / 12
        haut = (panier + 0.23 * math.cos(a), 0.23 * math.sin(a), 3.05)
        bas = (panier + 0.14 * math.cos(a + 0.4), 0.14 * math.sin(a + 0.4), 2.62)
        pa, pb = cam(haut), cam(bas)
        morceaux.append(f'<line x1="{pa[0]:.2f}" y1="{pa[1]:.2f}" x2="{pb[0]:.2f}" y2="{pb[1]:.2f}" stroke="{LIGNE}" stroke-width="0.9"/>')
    bas = [(panier + 0.14 * math.cos(2 * math.pi * i / 16), 0.14 * math.sin(2 * math.pi * i / 16), 2.62) for i in range(16)]
    morceaux.append(f'<polygon points="{s.pts(bas)}" fill="none" stroke="{LIGNE}" stroke-width="0.9"/>')
    s.objets.append((cam.profondeur((panier, 0, 2.8)) - 0.6, ''.join(morceaux)))
    # carré du panneau : 59 × 45 cm, bas au niveau du cercle
    planche = 14 - 1.2
    s.objets.append((cam.profondeur((planche, 0, 3.4)) - 0.02,
                     s.poly([(planche - 0.01, -0.295, 3.05), (planche - 0.01, 0.295, 3.05), (planche - 0.01, 0.295, 3.5), (planche - 0.01, -0.295, 3.5)],
                            'none', f'stroke="{ENCRE}" stroke-width="1.6"')))
    s.balle(10.2, 3.4, 0.26, '#F59A52', coutures=coutures_basket)
    return s.svg()


def essai_padel():
    # Depuis le coin, derrière la vitre du fond : vitres, grillage, filet et une balle
    cam = Camera((-44, -15, 19), (-1.0, 0.3, 0.9), focale=2.3, decalage=(0.0, 0.0))
    s = padel(cam_essai=cam, trait=0.05, essai=True)
    s.grain = True
    s.balle(-5.2, -1.8, 0.12, '#FFF3EA')
    s.balle(-7.6, 2.6, 0.12, '#FFF3EA')
    return s.svg()


ESSAIS = {'essai-foot': essai_foot, 'essai-basket': essai_basket, 'essai-padel': essai_padel}

TERRAINS = {
    'foot': foot, 'basket': basket, 'volley': volley, 'tennis': tennis, 'padel': padel,
    'badminton': badminton, 'squash': squash, 'pingpong': pingpong, 'escalade': escalade, 'boxe': boxe,
    'course': course, 'velo': velo, 'ultimate': ultimate, 'spikeball': spikeball, 'petanque': petanque,
    'streetworkout': streetworkout, 'rugby': rugby, 'autre': autre,
}

if __name__ == '__main__':
    import sys
    racine = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dossier = os.path.join(racine, 'design', 'terrains')
    os.makedirs(dossier, exist_ok=True)
    tous = {**TERRAINS, **ESSAIS}
    choix = sys.argv[1:] or list(TERRAINS)
    for nom in choix:
        with open(os.path.join(dossier, f'{nom}.svg'), 'w', encoding='utf-8') as f:
            f.write(tous[nom]())
        print('✓', nom)
