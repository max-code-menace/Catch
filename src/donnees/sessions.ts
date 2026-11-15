// La forme d'une session dans l'app. Les sessions viennent de Supabase (src/lib/sessions.tsx).
import type { Sport } from '@/donnees/pictos';

export type Coordonnees = { latitude: number; longitude: number };

export type Session = {
  id: string;
  sport: Sport;
  /** Nom court affiché dans les pastilles : « Foot », « Volley » */
  nomSport: string;
  /** Titre de la session : « Foot à 5 » */
  titre: string;
  lieu: string;
  commune: string;
  position: Coordonnees;
  debut: Date;
  fin: Date;
  joueurs: number;
  /** Ce qui s'affiche dans les avatars : début du prénom de chaque inscrit, organisateur en premier, « Toi » pour soi */
  inscrits: string[];
  /** Identifiants des comptes inscrits, dans le même ordre */
  idsInscrits: string[];
  /** Prénom de l'organisateur */
  organisateur: string;
  organisateurId: string;
  debutantsBienvenus: boolean;
  /** Ce qu'il faut savoir avant de venir : matériel, tenue */
  aSavoir?: { titre: string; detail: string };
};

export const WAVRE: Coordonnees = { latitude: 50.7167, longitude: 4.6111 };
