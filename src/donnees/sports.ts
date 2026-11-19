// Les sports proposés dans « Créer une session », dans l'ordre des tuiles.
// La même liste est permise par la base (migration 20261119020000_nouveaux_sports.sql) : les garder ensemble.
import type { Sport } from '@/donnees/pictos';

/**
 * `lieu` : se joue à un endroit précis (terrain public, salle payante) qu'on montre sur la carte.
 * `libre` : partout (parc, rue), pas de lieu à afficher, on pose son point où on veut.
 */
export type Ou = 'lieu' | 'libre';

type Fiche = {
  cle: Sport;
  /** Nom court : « Foot », « Volley » */
  nom: string;
  /** Nom des tuiles quand le nom est trop long pour elles */
  nomTuile?: string;
  /** Nombre de joueurs proposé par défaut, toi compris */
  joueurs: number;
  ou: Ou;
};

export const SPORTS: Fiche[] = [
  { cle: 'foot', nom: 'Foot', joueurs: 10, ou: 'lieu' },
  { cle: 'basket', nom: 'Basket', joueurs: 6, ou: 'lieu' },
  { cle: 'volley', nom: 'Volley', joueurs: 8, ou: 'lieu' },
  { cle: 'tennis', nom: 'Tennis', joueurs: 2, ou: 'lieu' },
  { cle: 'padel', nom: 'Padel', joueurs: 4, ou: 'lieu' },
  { cle: 'badminton', nom: 'Badminton', joueurs: 4, ou: 'lieu' },
  { cle: 'squash', nom: 'Squash', joueurs: 2, ou: 'lieu' },
  { cle: 'pingpong', nom: 'Ping-pong', joueurs: 2, ou: 'lieu' },
  { cle: 'escalade', nom: 'Escalade', joueurs: 4, ou: 'lieu' },
  { cle: 'boxe', nom: 'Boxe', joueurs: 2, ou: 'lieu' },
  { cle: 'course', nom: 'Course à pied', nomTuile: 'Course', joueurs: 4, ou: 'libre' },
  { cle: 'velo', nom: 'Vélo', joueurs: 4, ou: 'libre' },
  { cle: 'ultimate', nom: 'Ultimate', joueurs: 10, ou: 'libre' },
  { cle: 'spikeball', nom: 'Spikeball', joueurs: 4, ou: 'libre' },
  { cle: 'petanque', nom: 'Pétanque', joueurs: 4, ou: 'lieu' },
  { cle: 'streetworkout', nom: 'Street workout', nomTuile: 'Workout', joueurs: 4, ou: 'lieu' },
  { cle: 'rugby', nom: 'Rugby', joueurs: 14, ou: 'libre' },
  { cle: 'autre', nom: 'Autre', joueurs: 6, ou: 'libre' },
];

export function ficheSport(cle: Sport) {
  return SPORTS.find((s) => s.cle === cle) ?? SPORTS[0];
}
