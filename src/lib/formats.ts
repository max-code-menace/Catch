// Mise en forme des textes d'une session (voir docs/ux-writing.md).
import type { Coordonnees, Session } from '@/donnees/sessions';

const JOURS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];

export function estEnDirect(session: Session, maintenant = new Date()) {
  return session.debut <= maintenant && maintenant < session.fin;
}

export function placesLibres(session: Session) {
  return Math.max(0, session.joueurs - session.inscrits.length);
}

/** « 19h » ou « 19h02 » */
export function heure(date: Date) {
  const minutes = date.getMinutes();
  return `${date.getHours()}h${minutes === 0 ? '' : String(minutes).padStart(2, '0')}`;
}

function joursEntre(a: Date, b: Date) {
  const debutA = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const debutB = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((debutB - debutA) / 86_400_000);
}

/** « Ce soir 19h », « Demain 18h30 », « Jeu. 19h » */
export function quand(date: Date, maintenant = new Date()) {
  const ecart = joursEntre(maintenant, date);
  if (ecart === 0) return `${date.getHours() >= 18 ? 'Ce soir' : "Aujourd'hui"} ${heure(date)}`;
  if (ecart === 1) return `Demain ${heure(date)}`;
  return `${JOURS[date.getDay()]} ${heure(date)}`;
}

/**
 * Étiquette sous l'anneau d'une session sur la carte : « 19h », « Demain 18h », « 20h20 · 1 pl. » (1 ou 2 places
 * libres), « 19h · complet », « En direct ».
 */
export function etiquettePastille(session: Session, maintenant = new Date()) {
  if (estEnDirect(session, maintenant)) return 'En direct';
  const moment = quandCourt(session.debut, maintenant);
  const debut = moment.charAt(0).toUpperCase() + moment.slice(1);
  const libres = placesLibres(session);
  if (libres === 0) return `${debut} · complet`;
  return libres <= 2 ? `${debut} · ${libres} pl.` : debut;
}

/** Ce que VoiceOver lit sur la pastille d'une session : « Foot, ce soir 19h, 3 places libres » */
export function descriptionPastille(session: Session, maintenant = new Date()) {
  return `${session.nomSport}, ${quandPhrase(session, maintenant)}, ${textePlaces(session).toLowerCase()}`;
}

/** « 3 places libres », « 1 place libre », « Complet » */
export function textePlaces(session: Session) {
  const libres = placesLibres(session);
  if (libres === 0) return 'Complet';
  return libres === 1 ? '1 place libre' : `${libres} places libres`;
}

/** Distance à vol d'oiseau, en mètres. */
export function distance(a: Coordonnees, b: Coordonnees) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

/** « à 600 m », « à 4 km » */
export function texteDistance(metres: number) {
  if (metres < 950) return `à ${Math.max(50, Math.round(metres / 50) * 50)} m`;
  return `à ${Math.round(metres / 1000)} km`;
}

const JOURS_LONGS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function majuscule(texte: string) {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** Dans le détail : « Jeudi 20 novembre · 19h », « Ce soir · 19h », « En ce moment · jusqu'à 20h » */
export function quandDetail(session: Session, maintenant = new Date()) {
  const { debut } = session;
  if (estEnDirect(session, maintenant)) return `En ce moment · jusqu'à ${heure(session.fin)}`;
  const ecart = joursEntre(maintenant, debut);
  if (ecart === 0) return `${debut.getHours() >= 18 ? 'Ce soir' : "Aujourd'hui"} · ${heure(debut)}`;
  if (ecart === 1) return `Demain · ${heure(debut)}`;
  return `${majuscule(JOURS_LONGS[debut.getDay()])} ${debut.getDate()} ${MOIS[debut.getMonth()]} · ${heure(debut)}`;
}

/** Le jour, en haut de la tuile « Quand » du détail : « En ce moment », « Ce soir », « Demain », « Mar. 24 novembre » */
export function jourDetail(session: Session, maintenant = new Date()) {
  const { debut } = session;
  if (estEnDirect(session, maintenant)) return 'En ce moment';
  const ecart = joursEntre(maintenant, debut);
  if (ecart === 0) return debut.getHours() >= 18 ? 'Ce soir' : "Aujourd'hui";
  if (ecart === 1) return 'Demain';
  return `${JOURS[debut.getDay()]} ${debut.getDate()} ${MOIS[debut.getMonth()]}`;
}

/** Dans une phrase : « jeudi 19h », « ce soir 19h », « en ce moment » */
export function quandPhrase(session: Session, maintenant = new Date()) {
  const { debut } = session;
  if (estEnDirect(session, maintenant)) return 'en ce moment';
  const ecart = joursEntre(maintenant, debut);
  if (ecart === 0) return `${debut.getHours() >= 18 ? 'ce soir' : "aujourd'hui"} ${heure(debut)}`;
  if (ecart === 1) return `demain ${heure(debut)}`;
  return `${JOURS_LONGS[debut.getDay()]} ${heure(debut)}`;
}

/** « Environ 1h30 », « Environ 45 min » */
export function texteDuree(session: Session) {
  const minutes = Math.round((session.fin.getTime() - session.debut.getTime()) / 60_000);
  if (minutes < 60) return `Environ ${minutes} min`;
  const reste = minutes % 60;
  return `Environ ${Math.floor(minutes / 60)}h${reste === 0 ? '' : String(reste).padStart(2, '0')}`;
}

/** On peut annuler librement jusqu'à 3h avant le début. */
export function annulationLibre(session: Session, maintenant = new Date()) {
  return session.debut.getTime() - maintenant.getTime() > 3 * 3_600_000;
}

/** « Sarah t'attend », « Sarah et 5 autres t'attendent » : les inscrits, sans compter « Toi ». */
export function texteAttente(session: Session) {
  const autres = session.inscrits.filter((nom) => nom !== 'Toi').length - 1;
  if (autres <= 0) return `${session.organisateur} t’attend`;
  return `${session.organisateur} et ${autres} ${autres === 1 ? 'autre' : 'autres'} t’attendent`;
}

/** Début le plus proche, court : « 18h » (aujourd'hui), « demain 18h », « jeu. 18h » */
function quandCourt(date: Date, maintenant: Date) {
  const ecart = joursEntre(maintenant, date);
  if (ecart === 0) return heure(date);
  if (ecart === 1) return `demain ${heure(date)}`;
  return `${JOURS[date.getDay()].toLowerCase()} ${heure(date)}`;
}

/** Début le plus proche, dans une phrase : « 18h », « demain 18h », « jeudi 18h » */
function quandLong(date: Date, maintenant: Date) {
  const ecart = joursEntre(maintenant, date);
  if (ecart === 0) return heure(date);
  if (ecart === 1) return `demain ${heure(date)}`;
  return `${JOURS_LONGS[date.getDay()]} ${heure(date)}`;
}

/** Les sports d'un groupe, sans doublon, dans l'ordre des sessions (la plus proche d'abord) */
export function sportsDuGroupe(sessions: Session[]) {
  const tries = [...sessions].sort((a, b) => a.debut.getTime() - b.debut.getTime());
  const vus = new Map<string, Session>();
  for (const s of tries) if (!vus.has(s.sport)) vus.set(s.sport, s);
  return [...vus.values()].map((s) => ({ sport: s.sport, nom: s.nomSport }));
}

function premierDebut(sessions: Session[]) {
  return new Date(Math.min(...sessions.map((s) => s.debut.getTime())));
}

/** Étiquette sous la bulle de sessions (le nombre est dans la bulle) : « dès 18h », « dès demain 19h », « En direct » */
export function etiquetteGroupe(sessions: Session[], maintenant = new Date()) {
  if (sessions.some((s) => estEnDirect(s, maintenant))) return 'En direct';
  return `dès ${quandCourt(premierDebut(sessions), maintenant)}`;
}

/** « de foot », « d’escalade » */
function deSport(nom: string) {
  const bas = nom.toLowerCase();
  return /^[aeiouyéèêàâ]/.test(bas) ? `d’${bas}` : `de ${bas}`;
}

/** « foot, volley et padel » */
function enumeration(mots: string[]) {
  return mots.length < 2 ? mots.join('') : `${mots.slice(0, -1).join(', ')} et ${mots[mots.length - 1]}`;
}

/**
 * Ce que VoiceOver lit sur une bulle : « 4 sessions de foot, à partir de 18h »,
 * « 3 sessions : foot, volley et padel, à partir de demain 19h », « …, dont 1 en ce moment »
 */
export function descriptionGroupe(sessions: Session[], maintenant = new Date()) {
  const sports = sportsDuGroupe(sessions);
  const quoi =
    sports.length > 1
      ? `${sessions.length} sessions : ${enumeration(sports.map((s) => s.nom.toLowerCase()))}`
      : `${sessions.length} sessions ${deSport(sports[0].nom)}`;
  const enDirect = sessions.filter((s) => estEnDirect(s, maintenant)).length;
  const aVenir = sessions.filter((s) => !estEnDirect(s, maintenant));
  const parties = [quoi];
  if (aVenir.length) parties.push(`à partir de ${quandLong(premierDebut(aVenir), maintenant)}`);
  if (enDirect) parties.push(aVenir.length ? `dont ${enDirect} en ce moment` : 'en ce moment');
  return parties.join(', ');
}

/**
 * Le compte à rebours en grand dans l'en-tête du détail :
 * « En direct », « Dans 45 min », « Dans 3 h », « Ce soir », « Demain », « Dans 4 jours », « Terminée ».
 */
export function compteARebours(session: Session, maintenant = new Date()) {
  if (maintenant >= session.fin) return 'Terminée';
  if (estEnDirect(session, maintenant)) return 'En direct';
  const minutes = Math.round((session.debut.getTime() - maintenant.getTime()) / 60_000);
  if (minutes < 60) return `Dans ${Math.max(1, minutes)} min`;
  const ecart = joursEntre(maintenant, session.debut);
  if (ecart === 0) return minutes < 4 * 60 ? `Dans ${Math.round(minutes / 60)} h` : session.debut.getHours() >= 18 ? 'Ce soir' : "Aujourd'hui";
  if (ecart === 1) return 'Demain';
  return `Dans ${ecart} jours`;
}

/**
 * La phrase de l'en-tête du détail : le temps qui reste, puis les places, lues d'un trait
 * (« Dans 3 h · encore 2 places », « Ce soir · complet »). Idée de Mathias, version A choisie par Maxime le 24 novembre.
 * `places` est `null` une fois la session terminée.
 */
export function phraseEntete(session: Session, maintenant = new Date()) {
  const temps = compteARebours(session, maintenant);
  if (temps === 'Terminée') return { temps, places: null };
  const libres = placesLibres(session);
  if (libres === 0) return { temps, places: { avant: '', nombre: null, apres: 'complet' } };
  return { temps, places: { avant: 'encore', nombre: libres, apres: libres === 1 ? 'place' : 'places' } };
}

export type Point = 'joueur' | 'toi' | 'libre';

/**
 * La ligne de points d'une session : un point plein par joueur, rouge pour soi, un point vide par place libre.
 * Au-delà de `max` points, on coupe et `reste` dit combien on n'en montre pas (« +8 »).
 */
export function pointsDesPlaces(session: Session, max = 12) {
  const points: Point[] = [
    ...session.inscrits.map((nom): Point => (nom === 'Toi' ? 'toi' : 'joueur')),
    ...Array.from({ length: placesLibres(session) }, (): Point => 'libre'),
  ];
  return { points: points.slice(0, max), reste: Math.max(0, points.length - max) };
}

/**
 * Le moment dans la phrase de la fiche d'une session sur la carte :
 * « en direct », « dans 40 min », « dans 3 h », puis comme dans Créer (« ce soir à 19h », « demain à 18h », « jeudi à 19h »).
 */
export function quandFiche(session: Session, maintenant = new Date()) {
  if (estEnDirect(session, maintenant)) return 'en direct';
  const minutes = Math.round((session.debut.getTime() - maintenant.getTime()) / 60_000);
  if (minutes < 60) return `dans ${Math.max(1, minutes)} min`;
  if (joursEntre(maintenant, session.debut) === 0 && minutes < 4 * 60) return `dans ${Math.round(minutes / 60)} h`;
  return quandCreation(session.debut, maintenant);
}

/** Titre d'une rangée de Mes sessions : « Aujourd’hui », « Demain », « Samedi 28 » */
export function jourSection(date: Date, maintenant = new Date()) {
  const ecart = joursEntre(maintenant, date);
  if (ecart <= 0) return 'Aujourd’hui';
  if (ecart === 1) return 'Demain';
  return `${majuscule(JOURS_LONGS[date.getDay()])} ${date.getDate()}`;
}

/**
 * Ce qui est écrit sur le terrain d'une session dans Mes sessions : aujourd'hui, le compte à rebours en grand
 * (« Dans 3 h », « En direct ») et l'heure au-dessus ; les autres jours (déjà rangés par jour), l'heure en grand.
 */
export function textesBandeau(session: Session, maintenant = new Date()) {
  if (estEnDirect(session, maintenant)) return { petit: `Jusqu’à ${heure(session.fin)}`, grand: 'En direct' };
  if (joursEntre(maintenant, session.debut) <= 0) {
    const compte = compteARebours(session, maintenant);
    // Plus de 4 h avant : « Ce soir » au-dessus, l'heure en grand ; sinon le compte à rebours en grand
    if (compte === 'Ce soir' || compte === "Aujourd'hui") return { petit: compte, grand: heure(session.debut) };
    return { petit: heure(session.debut), grand: compte };
  }
  return { petit: `Jusqu’à ${heure(session.fin)}`, grand: heure(session.debut) };
}

/** « Quand » dans la phrase de Créer : « ce soir à 19h », « demain à 18h », « jeudi à 19h », « samedi 6 décembre à 10h » */
export function quandCreation(date: Date, maintenant = new Date()) {
  const ecart = joursEntre(maintenant, date);
  const a = `à ${heure(date)}`;
  if (ecart === 0) return `${date.getHours() >= 18 ? 'ce soir' : 'aujourd’hui'} ${a}`;
  if (ecart === 1) return `demain ${a}`;
  if (ecart < 7) return `${JOURS_LONGS[date.getDay()]} ${a}`;
  return `${JOURS_LONGS[date.getDay()]} ${date.getDate()} ${MOIS[date.getMonth()]} ${a}`;
}
