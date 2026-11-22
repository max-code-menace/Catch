// Profil façon BlaBlaCar × Instagram : compteurs, « Membre depuis », grille des sessions.
// Calcul pur (seulement des imports de types) pour pouvoir le tester avec `npm test` (tests/profil.test.mjs).
import type { Sport } from '@/donnees/pictos';

/** Une session de mon historique, telle que la grille du profil l'affiche */
export type Trace = {
  id: string;
  sport: Sport;
  titre: string;
  lieu: string;
  debut: Date;
  fin: Date;
  /** C'est moi qui l'organise */
  organise: boolean;
};

export type StatsProfil = {
  /** Sessions terminées où j'étais inscrit (organisées comprises) */
  jouees: number;
  /** Sessions que j'ai lancées, passées ou à venir */
  organisees: number;
  /** Sports joués ou prévus, le plus fréquent d'abord */
  sports: Sport[];
};

const MOIS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

export function statsProfil(traces: Trace[], maintenant = new Date()): StatsProfil {
  const compte = new Map<Sport, number>();
  for (const t of traces) compte.set(t.sport, (compte.get(t.sport) ?? 0) + 1);
  return {
    jouees: traces.filter((t) => t.fin.getTime() <= maintenant.getTime()).length,
    organisees: traces.filter((t) => t.organise).length,
    sports: [...compte.entries()].sort((a, b) => b[1] - a[1]).map(([sport]) => sport),
  };
}

/** Les sessions à venir (la prochaine d'abord) et celles déjà jouées (la plus récente d'abord) */
export function separerTraces(traces: Trace[], maintenant = new Date()) {
  const t = maintenant.getTime();
  return {
    aVenir: traces.filter((s) => s.fin.getTime() > t).sort((a, b) => a.debut.getTime() - b.debut.getTime()),
    jouees: traces.filter((s) => s.fin.getTime() <= t).sort((a, b) => b.debut.getTime() - a.debut.getTime()),
  };
}

/** « Membre depuis novembre 2026 » */
export function texteMembreDepuis(date: Date) {
  return `Membre depuis ${MOIS[date.getMonth()]} ${date.getFullYear()}`;
}

/** « 22 nov. » : date courte d'une tuile de la grille */
export function dateCourte(date: Date) {
  return `${date.getDate()} ${MOIS_COURTS[date.getMonth()]}`;
}

/** « 1 session jouée », « 3 sessions jouées » : compteur lu par VoiceOver */
export function accorder(nombre: number, singulier: string, pluriel: string) {
  return `${nombre} ${nombre > 1 ? pluriel : singulier}`;
}

/** Ce qu'on met dans le grand rond quand il n'y a pas de photo : la première lettre du prénom */
export function initiale(prenom: string | null) {
  const net = prenom?.trim();
  return net ? net.charAt(0).toUpperCase() : '';
}
