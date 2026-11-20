// Regroupement des pastilles de sessions sur la carte (décidé avec Maxime le 20 novembre).
// Règle : jamais deux zones de toucher qui se chevauchent. On calcule où chaque pastille tombe à l'écran
// et sa largeur (selon son texte), avec une petite marge ; deux pastilles qui se toucheraient fusionnent
// en une bulle, et on recommence tant que deux bulles se touchent.
// Calcul pur (pas d'import) pour pouvoir le tester avec `npm test`.

export type Point = { latitude: number; longitude: number };
export type Boite = { largeur: number; hauteur: number };

/** Ce qu'on sait de la carte : son zoom (écart de longitude d'un bord à l'autre) et sa largeur en points */
export type VueCarte = { longitudeDelta: number; largeurEcran: number };

export type GroupeSessions<T> = {
  /** Clé stable tant que les mêmes éléments sont regroupés (la clé de l'élément s'il est seul) */
  cle: string;
  /** Centre de la bulle : le milieu de ses points à l'écran */
  position: Point;
  elements: T[];
};

export type OptionsRegroupement<T> = {
  position: (element: T) => Point;
  cle: (element: T) => string;
  /** Taille de la zone de toucher : d'une pastille (un élément) ou d'une bulle (plusieurs) */
  taille: (elements: T[]) => Boite;
  /** Espace minimum entre deux zones de toucher, en points */
  marge?: number;
};

/** Espace minimum entre deux zones de toucher, en points */
export const MARGE_PASTILLES = 4;
/** Zoom le plus fort qu'on demande à la carte (≈ 140 m d'un bord à l'autre d'un iPhone) */
export const DELTA_MIN = 0.002;

/** Mesures d'une pastille de session (en points) : servent au dessin et au calcul de la largeur */
export const PASTILLE = {
  hauteur: 40,
  cible: 44,
  bordure: 1,
  margeGauche: 4,
  margeDroite: 14,
  rondPicto: 32,
  /** Les pictos d'une bulle « 4 sessions » se recouvrent de ça */
  recouvrementPictos: 12,
  ecart: 7,
  pointDirect: 8,
  /** Largeur moyenne d'un caractère, en fraction de la taille du texte (un peu large exprès : mieux vaut regrouper trop tôt) */
  caractere: 0.6,
} as const;

/**
 * Largeur de la zone de toucher d'une pastille, d'après son texte.
 * `pictos` : nombre de ronds (1 pour une session, 2 ou 3 pour une bulle de sports différents).
 */
export function taillePastille(
  { texte, pictos = 1, direct = false }: { texte: string; pictos?: number; direct?: boolean },
  taillePolice: number,
  echelleTexte = 1,
): Boite {
  const P = PASTILLE;
  const ronds = P.rondPicto + (pictos - 1) * (P.rondPicto - P.recouvrementPictos);
  const largeur =
    2 * P.bordure +
    P.margeGauche +
    ronds +
    P.ecart +
    (direct ? P.pointDirect + P.ecart : 0) +
    texte.length * taillePolice * P.caractere * echelleTexte +
    P.margeDroite;
  return { largeur: Math.max(P.cible, Math.ceil(largeur)), hauteur: P.cible };
}

/** Taille du monde en points à ce zoom (projection de Mercator, celle des cartes Apple et Google) */
function tailleMonde(vue: VueCarte) {
  return (360 * vue.largeurEcran) / vue.longitudeDelta;
}

function versMonde(p: Point, monde: number) {
  const s = Math.sin((Math.max(-85, Math.min(85, p.latitude)) * Math.PI) / 180);
  return {
    x: ((p.longitude + 180) / 360) * monde,
    y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * monde,
  };
}

function depuisMonde(x: number, y: number, monde: number): Point {
  const n = Math.PI - (2 * Math.PI * y) / monde;
  return { latitude: (Math.atan(Math.sinh(n)) * 180) / Math.PI, longitude: (x / monde) * 360 - 180 };
}

/**
 * Position à l'écran (en points, depuis le coin en haut à gauche) d'un point de la carte.
 * Sert à la version web, qui dessine les pastilles elle-même.
 */
export function versEcran(p: Point, centre: Point, vue: VueCarte, hauteurEcran: number) {
  const monde = tailleMonde(vue);
  const a = versMonde(p, monde);
  const c = versMonde(centre, monde);
  return { x: a.x - c.x + vue.largeurEcran / 2, y: a.y - c.y + hauteurEcran / 2 };
}

type Amas<T> = { elements: T[]; sx: number; sy: number; x: number; y: number; boite: Boite };

function seChevauchent<T>(a: Amas<T>, b: Amas<T>, marge: number) {
  return (
    Math.abs(a.x - b.x) < (a.boite.largeur + b.boite.largeur) / 2 + marge &&
    Math.abs(a.y - b.y) < (a.boite.hauteur + b.boite.hauteur) / 2 + marge
  );
}

/**
 * Regroupe les pastilles qui se toucheraient à ce zoom.
 * Le calcul ne dépend que du zoom, pas de l'endroit où on regarde : déplacer la carte ne change rien,
 * et une pastille au bord de l'écran se regroupe avec sa voisine encore cachée.
 * À chaque tour, on fusionne les deux pastilles (ou bulles) qui se touchent et dont les centres sont
 * les plus proches, jusqu'à ce que plus rien ne se touche.
 */
export function regrouperSessions<T>(
  elements: T[],
  { position, cle, taille, marge = MARGE_PASTILLES }: OptionsRegroupement<T>,
  vue: VueCarte,
): GroupeSessions<T>[] {
  const monde = tailleMonde(vue);
  // Ordre fixe (par clé) : même résultat quel que soit l'ordre reçu
  const amas: Amas<T>[] = [...elements]
    .sort((a, b) => (cle(a) < cle(b) ? -1 : cle(a) > cle(b) ? 1 : 0))
    .map((e) => {
      const { x, y } = versMonde(position(e), monde);
      return { elements: [e], sx: x, sy: y, x, y, boite: taille([e]) };
    });

  for (;;) {
    let meilleur: [number, number] | null = null;
    let meilleureDistance = Infinity;
    for (let i = 0; i < amas.length; i++) {
      for (let j = i + 1; j < amas.length; j++) {
        if (!seChevauchent(amas[i], amas[j], marge)) continue;
        const d = (amas[i].x - amas[j].x) ** 2 + (amas[i].y - amas[j].y) ** 2;
        if (d < meilleureDistance) {
          meilleureDistance = d;
          meilleur = [i, j];
        }
      }
    }
    if (!meilleur) break;
    const [i, j] = meilleur;
    const a = amas[i];
    const b = amas[j];
    const fusion = [...a.elements, ...b.elements];
    const sx = a.sx + b.sx;
    const sy = a.sy + b.sy;
    amas[i] = {
      elements: fusion,
      sx,
      sy,
      x: sx / fusion.length,
      y: sy / fusion.length,
      boite: taille(fusion),
    };
    amas.splice(j, 1);
  }

  return amas.map((a) => ({
    cle: a.elements.map(cle).sort().join('|'),
    position: depuisMonde(a.x, a.y, monde),
    elements: a.elements,
  }));
}

/**
 * Quand on touche une bulle : jusqu'où zoomer pour séparer ses sessions.
 * Renvoie l'écart de longitude à demander à la carte et le centre où aller,
 * ou `null` si elles sont au même endroit (même au zoom le plus fort, elles restent ensemble) :
 * dans ce cas, on ouvre une liste pour choisir.
 */
export function zoomPourSeparer<T>(
  elements: T[],
  options: OptionsRegroupement<T>,
  vue: VueCarte,
  deltaMin = DELTA_MIN,
): { longitudeDelta: number; centre: Point } | null {
  if (elements.length < 2) return null;
  const points = elements.map(options.position);
  const lat = points.map((p) => p.latitude);
  const lon = points.map((p) => p.longitude);
  const centre = {
    latitude: (Math.min(...lat) + Math.max(...lat)) / 2,
    longitude: (Math.min(...lon) + Math.max(...lon)) / 2,
  };
  const groupesA = (d: number) => regrouperSessions(elements, options, { ...vue, longitudeDelta: d }).length;
  // On garde toutes les sessions à l'écran (avec de la place pour les pastilles sur les bords),
  // sauf si ça les regroupe de nouveau : mieux vaut en laisser une hors de l'écran que de ne rien séparer
  const ecartLon = Math.max(...lon) - Math.min(...lon);
  const cadrer = (d: number) => {
    const large = ecartLon * 1.5;
    return large > d && groupesA(large) > 1 ? large : d;
  };

  let meilleur: { delta: number; groupes: number } | null = null;
  let delta = vue.longitudeDelta;
  while (delta > deltaMin) {
    delta = Math.max(deltaMin, delta * 0.7);
    const groupes = groupesA(delta);
    if (groupes === elements.length) return { longitudeDelta: cadrer(delta), centre };
    if (!meilleur || groupes > meilleur.groupes) meilleur = { delta, groupes };
  }
  // Pas toutes séparées : on zoome au moins jusqu'à en séparer une partie, sinon c'est le même endroit
  if (meilleur && meilleur.groupes > 1) return { longitudeDelta: cadrer(meilleur.delta), centre };
  return null;
}
