// La phrase de Créer (idée de Mathias, choisie par Maxime le 24 novembre) :
// « Je lance du foot ce soir à 19h pour 1h30, à 10 joueurs, débutants bienvenus. Rendez-vous Parc Josaphat. »
// Chaque choix y devient un mot surligné ; ce qui manque est un trou à remplir. Calcul pur, testé.
import type { Sport } from '@/donnees/pictos';

export type Champ = 'sport' | 'quand' | 'duree' | 'joueurs' | 'niveau' | 'ou';
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

/** « débutants bienvenus » ou « niveau confirmé » */
export function niveauDansLaPhrase(debutants: boolean) {
  return debutants ? 'débutants bienvenus' : 'niveau confirmé';
}

/** Chaque valeur vaut `null` tant qu'elle n'est pas choisie : elle reste un trou dans la phrase */
type Choix = {
  sport: { cle: Sport; nom: string } | null;
  /** « ce soir à 19h », « maintenant » */
  quand: string | null;
  /** « 1h30 » */
  duree: string | null;
  joueurs: number | null;
  debutants: boolean | null;
  /** Nom du lieu */
  lieu: string | null;
};

export function phraseCreation({ sport, quand, duree, joueurs, debutants, lieu }: Choix): Morceau[] {
  const texte = (t: string): Morceau => ({ type: 'texte', texte: t });
  const trou = (champ: Champ, t: string): Morceau => ({ type: 'trou', champ, texte: t });
  return [
    texte('Je lance'),
    sport ? { type: 'choix', champ: 'sport', texte: sportDansLaPhrase(sport.cle, sport.nom) } : trou('sport', 'quel sport ?'),
    quand ? { type: 'choix', champ: 'quand', texte: quand } : trou('quand', 'quand ?'),
    duree ? { type: 'choix', champ: 'duree', texte: `pour ${duree}`, ponctuation: ',' } : trou('duree', 'combien de temps ?'),
    joueurs !== null
      ? { type: 'choix', champ: 'joueurs', texte: `à ${joueurs} ${joueurs === 1 ? 'joueur' : 'joueurs'}`, ponctuation: ',' }
      : trou('joueurs', 'combien ?'),
    debutants !== null
      ? { type: 'choix', champ: 'niveau', texte: niveauDansLaPhrase(debutants), ponctuation: '.' }
      : trou('niveau', 'quel niveau ?'),
    texte('Rendez-vous'),
    lieu ? { type: 'choix', champ: 'ou', texte: lieu, ponctuation: '.' } : trou('ou', 'où ?'),
  ];
}

/** L'ordre des étapes d'une nouvelle session : celui de la phrase */
export const ORDRE: Champ[] = ['sport', 'quand', 'duree', 'joueurs', 'niveau', 'ou'];

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

/** Une tuile de « Quand ? » : `date` vaut `null` pour « Maintenant » */
export type Creneau = { date: Date | null; titre: string; sous: string };

/**
 * Les créneaux proposés en tuiles dans « Quand ? » (comme la maquette) : « Maintenant », les prochaines heures pleines
 * du jour (au moins 30 minutes devant soi, avant minuit), puis demain soir. Toujours 5 ; « Autre » ouvre le sélecteur.
 */
export function creneauxProposes(maintenant = new Date()): Creneau[] {
  const creneaux: Creneau[] = [{ date: null, titre: 'Maintenant', sous: `${maintenant.getHours()}h${String(maintenant.getMinutes()).padStart(2, '0')}` }];
  const premiere = new Date(maintenant);
  premiere.setMinutes(0, 0, 0);
  premiere.setHours(premiere.getHours() + (maintenant.getMinutes() > 30 ? 2 : 1));
  for (const h = new Date(premiere); creneaux.length < 4 && h.getDate() === maintenant.getDate(); h.setHours(h.getHours() + 1)) {
    creneaux.push({ date: new Date(h), titre: `${h.getHours()}h`, sous: h.getHours() >= 18 ? 'ce soir' : 'aujourd’hui' });
  }
  const demain = new Date(maintenant);
  demain.setDate(demain.getDate() + 1);
  for (const heure of [18, 19, 20, 12]) {
    if (creneaux.length >= 5) break;
    const d = new Date(demain);
    d.setHours(heure, 0, 0, 0);
    creneaux.push({ date: d, titre: 'Demain', sous: `${heure}h` });
  }
  return creneaux;
}
