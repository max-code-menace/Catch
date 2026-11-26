// Fil d'une conversation : calcul pur (pas d'import de code) pour pouvoir le tester avec `npm test`.
import type { Message } from '@/lib/messages';

/**
 * Ajoute des messages reçus à ceux déjà affichés : sans doublon, dans l'ordre d'arrivée,
 * les messages en cours d'envoi toujours à la fin.
 */
export function fusionnerMessages(avant: Message[], recus: Message[]) {
  const ids = new Set(recus.map((m) => m.id));
  const gardes = avant.filter((m) => !m.enAttente && !ids.has(m.id));
  const enAttente = avant.filter((m) => m.enAttente);
  return [...gardes, ...recus].sort((a, b) => a.date.getTime() - b.date.getTime()).concat(enAttente);
}

/** Au-delà de cet écart, deux messages de la même personne ne sont plus collés. */
const ECART_GROUPE = 5 * 60_000;
/** Au-delà de cet écart (et avant le premier message), une heure s'affiche au milieu du fil. */
const ECART_HEURE = 60 * 60_000;

export type PlaceDansLeFil = {
  /** Premier message d'une suite de la même personne (bloc collé) */
  debutGroupe: boolean;
  /** Quelqu'un d'autre parlait juste avant (ou l'heure vient d'être affichée) : on rappelle son prénom */
  avecPrenom: boolean;
  /** Dernier de la suite : on affiche son avatar à côté, et un peu d'espace après */
  finGroupe: boolean;
  /** Heure à afficher au milieu du fil juste avant ce message */
  separateur: Date | null;
};

/**
 * Comme Messenger : les messages qui se suivent de la même personne sont collés en un seul bloc,
 * et l'heure n'apparaît qu'au milieu du fil, quand la conversation reprend après une pause.
 */
export function placesDansLeFil(messages: Message[]): PlaceDansLeFil[] {
  const separateurs = messages.map((m, i) => {
    const avant = messages[i - 1];
    return !avant || m.date.getTime() - avant.date.getTime() >= ECART_HEURE ? m.date : null;
  });
  const colle = (i: number) => {
    // Le message i est-il collé au précédent ?
    const avant = messages[i - 1];
    const m = messages[i];
    if (!avant || !m || separateurs[i]) return false;
    return avant.auteurId === m.auteurId && m.date.getTime() - avant.date.getTime() < ECART_GROUPE;
  };
  return messages.map((m, i) => ({
    debutGroupe: !colle(i),
    avecPrenom: !!separateurs[i] || messages[i - 1]?.auteurId !== m.auteurId,
    finGroupe: !colle(i + 1),
    separateur: separateurs[i],
  }));
}

const JOURS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];

/** Heure au milieu du fil : « 19h02 », « Hier 19h02 », « Lun. 19h02 », « 12/11 19h02 ». */
export function texteSeparateur(date: Date, maintenant = new Date()) {
  const jour = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const ecart = Math.round((jour(maintenant) - jour(date)) / 86_400_000);
  const h = `${date.getHours()}h${String(date.getMinutes()).padStart(2, '0')}`;
  if (ecart <= 0) return h;
  if (ecart === 1) return `Hier ${h}`;
  if (ecart < 7) return `${JOURS[date.getDay()]} ${h}`;
  return `${date.getDate()}/${date.getMonth() + 1} ${h}`;
}

/** Initiale d'un prénom, pour le petit rond à côté des messages. */
export function initiale(prenom: string) {
  return (prenom.trim()[0] ?? '?').toUpperCase();
}

/** Toujours la même teinte (0 à 3) pour la même personne. */
export function teinte(auteurId: string) {
  let somme = 0;
  for (const lettre of auteurId) somme += lettre.charCodeAt(0);
  return somme % 4;
}

/** Quelqu'un a rejoint la session (une ligne de `participations`). */
export type Arrivee = { joueurId: string; prenom: string; date: Date };

/**
 * Ce qui s'affiche dans le fil d'un groupe : les messages, et entre eux ce qui arrive à la session
 * (finition 1 de Messages, piste H, choisie par Maxime le 26 novembre) :
 * « Sarah a catché · 6/10 », « Plus que 2 places », « Complet », « C’est parti ».
 */
export type ElementDuFil =
  | { type: 'message'; message: Message; place: PlaceDansLeFil }
  | { type: 'arrivee'; id: string; joueurId: string; prenom: string; nombre: number; total: number; date: Date }
  | { type: 'repere'; id: string; texte: string; date: Date };

export function elementsDuFil(
  messages: Message[],
  session?: { arrivees: Arrivee[]; organisateurId: string; joueurs: number; debut: Date },
  maintenant = new Date(),
): ElementDuFil[] {
  const places = placesDansLeFil(messages);
  const enAttente: ElementDuFil[] = [];
  const elements: ElementDuFil[] = [];
  messages.forEach((message, i) => {
    const element: ElementDuFil = { type: 'message', message, place: places[i] };
    (message.enAttente ? enAttente : elements).push(element);
  });
  if (!session) return elements;

  const evenements: ElementDuFil[] = [];
  const arrivees = [...session.arrivees].sort((a, b) => a.date.getTime() - b.date.getTime());
  arrivees.forEach((arrivee, i) => {
    const nombre = i + 1;
    // L'organisateur est inscrit en créant la session : ce n'est pas une arrivée
    if (arrivee.joueurId === session.organisateurId) return;
    evenements.push({
      type: 'arrivee',
      id: `arrivee-${arrivee.joueurId}`,
      joueurId: arrivee.joueurId,
      prenom: arrivee.prenom,
      nombre,
      total: session.joueurs,
      date: arrivee.date,
    });
    const libres = session.joueurs - nombre;
    if (libres <= 2 && libres >= 0) {
      const texte = libres === 0 ? 'Complet' : libres === 1 ? 'Plus que 1 place' : 'Plus que 2 places';
      evenements.push({ type: 'repere', id: `places-${nombre}`, texte, date: arrivee.date });
    }
  });
  if (maintenant >= session.debut) {
    evenements.push({ type: 'repere', id: 'cest-parti', texte: 'C’est parti', date: session.debut });
  }
  const date = (e: ElementDuFil) => (e.type === 'message' ? e.message.date : e.date).getTime();
  // Tri stable : à la même date, l'arrivée passe avant son repère
  return [...elements, ...evenements].sort((a, b) => date(a) - date(b)).concat(enAttente);
}
