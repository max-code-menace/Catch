// Anneau des places : un trait par joueur (12 au plus), plein pour chaque inscrit, comme la barre segmentée des places.
// Calcul pur (pas d'import) pour pouvoir le tester avec `npm test`.

/** Nombre de traits maximum : au-delà, chaque trait vaut plusieurs joueurs */
export const TRAITS_MAX = 12;

export type Trait = { d: string; plein: boolean };

/**
 * Les traits de l'anneau (chemins SVG) pour `inscrits` joueurs sur `joueurs`.
 * `taille` est le diamètre total, `epaisseur` celle du trait.
 */
export function traitsAnneau(inscrits: number, joueurs: number, taille: number, epaisseur: number): Trait[] {
  const total = Math.max(1, Math.min(joueurs, TRAITS_MAX));
  const pleins = joueurs > 0 ? Math.min(total, Math.round((Math.max(0, inscrits) / joueurs) * total)) : 0;
  const centre = taille / 2;
  const rayon = centre - epaisseur / 2;
  // Petit espace entre les traits ; un seul trait fait presque le tour entier
  const ecart = total > 1 ? 16 : 0.5;
  const point = (angle: number) => {
    const a = (angle * Math.PI) / 180;
    return `${(centre + rayon * Math.cos(a)).toFixed(2)} ${(centre + rayon * Math.sin(a)).toFixed(2)}`;
  };
  return Array.from({ length: total }, (_, i) => {
    const debut = -90 + (i * 360) / total + ecart / 2;
    const fin = -90 + ((i + 1) * 360) / total - ecart / 2;
    const grand = fin - debut > 180 ? 1 : 0;
    return { d: `M${point(debut)} A${rayon} ${rayon} 0 ${grand} 1 ${point(fin)}`, plein: i < pleins };
  });
}
