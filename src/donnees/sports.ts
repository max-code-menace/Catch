// Les sports proposés dans « Créer une session », dans l'ordre des tuiles.
import type { Sport } from '@/donnees/pictos';

type Fiche = {
  cle: Sport;
  /** Nom court : « Foot », « Volley » */
  nom: string;
  /** Nombre de joueurs proposé par défaut, toi compris */
  joueurs: number;
};

export const SPORTS: Fiche[] = [
  { cle: 'foot', nom: 'Foot', joueurs: 10 },
  { cle: 'basket', nom: 'Basket', joueurs: 6 },
  { cle: 'volley', nom: 'Volley', joueurs: 8 },
  { cle: 'badminton', nom: 'Badminton', joueurs: 4 },
  { cle: 'spikeball', nom: 'Spikeball', joueurs: 4 },
  { cle: 'tennis', nom: 'Tennis', joueurs: 2 },
  { cle: 'padel', nom: 'Padel', joueurs: 4 },
  { cle: 'escalade', nom: 'Escalade', joueurs: 4 },
  { cle: 'rugby', nom: 'Rugby', joueurs: 14 },
  { cle: 'autre', nom: 'Autre', joueurs: 6 },
];

export function ficheSport(cle: Sport) {
  return SPORTS.find((s) => s.cle === cle) ?? SPORTS[0];
}
