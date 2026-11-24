// La phrase de Créer (idée de Mathias, choisie par Maxime le 24 novembre) :
// « Je lance du foot ce soir à 19h, à 10 joueurs. Rendez-vous Parc Josaphat. »
// Chaque choix y devient un mot surligné ; ce qui manque est un trou à remplir. Calcul pur, testé.
import type { Sport } from '@/donnees/pictos';

export type Champ = 'sport' | 'quand' | 'joueurs' | 'ou';
export type Morceau =
  | { type: 'texte'; texte: string }
  /** `ponctuation` s'écrit après le choix, hors du trait de surligneur */
  | { type: 'choix'; champ: Champ; texte: string; ponctuation?: string }
  | { type: 'trou'; champ: Champ; texte: string };

/** « du foot », « de l'escalade », « de la boxe » */
const ARTICLES: Partial<Record<Sport, string>> = {
  escalade: 'de l’escalade',
  ultimate: 'de l’ultimate',
  boxe: 'de la boxe',
  course: 'de la course',
  petanque: 'de la pétanque',
  autre: 'une session',
};

export function sportDansLaPhrase(sport: Sport, nom: string) {
  return ARTICLES[sport] ?? `du ${nom.toLowerCase()}`;
}

type Choix = {
  sport: { cle: Sport; nom: string } | null;
  /** « ce soir à 19h », « maintenant » ; `null` tant que ce n'est pas choisi (étapes) */
  quand: string | null;
  /** `null` tant que le sport n'est pas choisi (le nombre par défaut dépend du sport) */
  joueurs: number | null;
  /** Nom du lieu, `null` tant qu'il n'est pas choisi */
  lieu: string | null;
};

export function phraseCreation({ sport, quand, joueurs, lieu }: Choix): Morceau[] {
  const texte = (t: string): Morceau => ({ type: 'texte', texte: t });
  return [
    texte('Je lance'),
    sport
      ? { type: 'choix', champ: 'sport', texte: sportDansLaPhrase(sport.cle, sport.nom) }
      : { type: 'trou', champ: 'sport', texte: 'quel sport ?' },
    quand
      ? { type: 'choix', champ: 'quand', texte: quand, ponctuation: ',' }
      : { type: 'trou', champ: 'quand', texte: 'quand ?' },
    joueurs !== null
      ? { type: 'choix', champ: 'joueurs', texte: `à ${joueurs} ${joueurs === 1 ? 'joueur' : 'joueurs'}`, ponctuation: '.' }
      : { type: 'trou', champ: 'joueurs', texte: 'combien ?' },
    texte('Rendez-vous'),
    lieu ? { type: 'choix', champ: 'ou', texte: lieu, ponctuation: '.' } : { type: 'trou', champ: 'ou', texte: 'où ?' },
  ];
}

/** L'ordre des étapes d'une nouvelle session : celui de la phrase */
export const ORDRE: Champ[] = ['sport', 'quand', 'joueurs', 'ou'];

/** L'étape qui suit `actuelle` parmi celles à faire, ou `null` quand tout est choisi */
export function etapeSuivante(actuelle: Champ, aFaire: Champ[]): Champ | null {
  const reste = ORDRE.slice(ORDRE.indexOf(actuelle) + 1);
  return reste.find((champ) => aFaire.includes(champ)) ?? null;
}

/** L'étape d'avant parmi celles à faire, ou `null` à la première */
export function etapePrecedente(actuelle: Champ, aFaire: Champ[]): Champ | null {
  const avant = ORDRE.slice(0, ORDRE.indexOf(actuelle)).reverse();
  return avant.find((champ) => aFaire.includes(champ)) ?? null;
}

/**
 * L'heure proposée pour « Relancer » : la même heure que la dernière fois, au prochain créneau possible
 * (ce soir à 19h s'il est 15h, demain à 19h s'il est 20h). Moins de 10 minutes devant soi : on passe au lendemain.
 */
export function prochainCreneau(heures: number, minutes: number, maintenant = new Date()) {
  const creneau = new Date(maintenant);
  creneau.setHours(heures, minutes, 0, 0);
  if (creneau.getTime() - maintenant.getTime() < 10 * 60_000) creneau.setDate(creneau.getDate() + 1);
  return creneau;
}

/** Ce que « Relancer » retient d'une session publiée */
export type Modele<L> = {
  sport: Sport;
  joueurs: number;
  duree: number;
  debutants: boolean;
  lieu: L;
  /** Heure de début, pour proposer la même la prochaine fois */
  heure?: { heures: number; minutes: number };
};

/** Les 3 dernières créations différentes (même sport au même endroit = la même), la plus récente d'abord */
export function retenirCreation<L extends { nom: string }>(liste: Modele<L>[], nouveau: Modele<L>, max = 3) {
  const autres = liste.filter((m) => !(m.sport === nouveau.sport && m.lieu.nom === nouveau.lieu.nom));
  return [nouveau, ...autres].slice(0, max);
}
