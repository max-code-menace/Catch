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
  /** « ce soir à 19h », « maintenant » */
  quand: string;
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
    { type: 'choix', champ: 'quand', texte: quand, ponctuation: ',' },
    joueurs !== null
      ? { type: 'choix', champ: 'joueurs', texte: `à ${joueurs} ${joueurs === 1 ? 'joueur' : 'joueurs'}`, ponctuation: '.' }
      : { type: 'trou', champ: 'joueurs', texte: 'combien ?' },
    texte('Rendez-vous'),
    lieu ? { type: 'choix', champ: 'ou', texte: lieu, ponctuation: '.' } : { type: 'trou', champ: 'ou', texte: 'où ?' },
  ];
}
