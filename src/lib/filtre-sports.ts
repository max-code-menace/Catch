// Filtre « Mes sports » de la carte : ce qu'on garde, et comment le dire quand il ne reste rien.
// Calcul pur (seulement des imports de types) pour pouvoir le tester avec `npm test` (tests/filtre-sports.test.mjs).
import type { Sport } from '@/donnees/pictos';

/** Choix retenu sur le téléphone : ses sports, et « Tous les sports » pour voir le reste un moment */
export type ChoixSports = { sports: Sport[]; tous: boolean };

export const CHOIX_VIDE: ChoixSports = { sports: [], tous: false };

/** La carte est filtrée seulement si on a choisi au moins un sport et qu'on n'a pas demandé « Tous les sports » */
export function filtreActif(choix: ChoixSports) {
  return !choix.tous && choix.sports.length > 0;
}

/** Ajoute ou retire un sport. Toucher un sport, c'est revenir à « Mes sports ». */
export function basculerSport(choix: ChoixSports, sport: Sport): ChoixSports {
  const sports = choix.sports.includes(sport)
    ? choix.sports.filter((s) => s !== sport)
    : [...choix.sports, sport];
  return { sports, tous: false };
}

/** Garde ce qui touche à un des sports choisis (une salle peut en proposer plusieurs) */
export function garder<T>(liste: T[], choix: ChoixSports, sportsDe: (element: T) => Sport[]): T[] {
  if (!filtreActif(choix)) return liste;
  return liste.filter((element) => sportsDe(element).some((s) => choix.sports.includes(s)));
}

/** Relit ce qui a été enregistré : tout ce qui n'est pas un sport connu est oublié */
export function lireChoix(texte: string | null, connus: readonly Sport[]): ChoixSports {
  if (!texte) return CHOIX_VIDE;
  try {
    const brut = JSON.parse(texte) as Partial<ChoixSports>;
    const sports = Array.isArray(brut.sports)
      ? connus.filter((s) => (brut.sports as unknown[]).includes(s))
      : [];
    return { sports, tous: brut.tous === true };
  } catch {
    return CHOIX_VIDE;
  }
}

/** « en padel » pour un seul sport, « dans tes sports » sinon */
export function texteFiltre(choix: ChoixSports, nomDe: (sport: Sport) => string) {
  return choix.sports.length === 1 ? `en ${nomDe(choix.sports[0]).toLowerCase()}` : 'dans tes sports';
}

/** « Foot, padel, course à pied » : la liste des sports choisis, pour VoiceOver et le Profil */
export function listeSports(sports: Sport[], nomDe: (sport: Sport) => string) {
  const noms = sports.map((s, i) => (i === 0 ? nomDe(s) : nomDe(s).toLowerCase()));
  return noms.join(', ');
}

/** Sessions et événements : un seul sport chacun */
export function garderParSport<T extends { sport: Sport }>(liste: T[], choix: ChoixSports): T[] {
  return garder(liste, choix, (element) => [element.sport]);
}

/** Salles et terrains : plusieurs sports possibles */
export function garderParSports<T extends { sports: Sport[] }>(liste: T[], choix: ChoixSports): T[] {
  return garder(liste, choix, (element) => element.sports);
}
