// Regroupement des lieux quand on dézoome : « 12 lieux » au lieu de 12 pastilles qui se chevauchent.
// Calcul pur (pas d'import) pour pouvoir le tester avec `npm test`.

type Point = { latitude: number; longitude: number };

export type Groupe<T> = {
  /** Clé stable tant que les mêmes éléments sont regroupés */
  cle: string;
  /** Centre du groupe : la moyenne de ses points */
  position: Point;
  elements: T[];
};

/** Au-delà de cette ouverture de carte (en degrés de latitude), les lieux proches se regroupent */
export const OUVERTURE_REGROUPEMENT = 0.045;

/**
 * Range les éléments dans une grille dont la taille suit le zoom (`ouverture` = latitudeDelta de la carte) :
 * chaque case devient un groupe. Zoomé (ouverture petite), chaque lieu reste seul.
 */
export function regrouper<T>(
  elements: T[],
  position: (element: T) => Point,
  ouverture: number,
  cle: (element: T) => string,
): Groupe<T>[] {
  if (ouverture <= OUVERTURE_REGROUPEMENT) {
    return elements.map((e) => ({ cle: cle(e), position: position(e), elements: [e] }));
  }
  // Environ 7 cases sur la hauteur de l'écran
  const pas = ouverture / 7;
  const cases = new Map<string, T[]>();
  for (const e of elements) {
    const p = position(e);
    const id = `${Math.floor(p.latitude / pas)}:${Math.floor(p.longitude / (pas * 1.6))}`;
    const liste = cases.get(id);
    if (liste) liste.push(e);
    else cases.set(id, [e]);
  }
  return [...cases.values()].map((liste) => {
    const points = liste.map(position);
    return {
      cle: liste.map(cle).sort().join('|'),
      position: {
        latitude: points.reduce((s, p) => s + p.latitude, 0) / points.length,
        longitude: points.reduce((s, p) => s + p.longitude, 0) / points.length,
      },
      elements: liste,
    };
  });
}
