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

/** Texte d'une pastille de carte : « Foot · 6 jouent », « Volley · il manque 1 », « Escalade · sam. 14h » */
export function textePastille(session: Session) {
  if (estEnDirect(session)) return `${session.nomSport} · ${session.inscrits.length} jouent`;
  if (placesLibres(session) === 1) return `${session.nomSport} · il manque 1`;
  return `${session.nomSport} · ${quand(session.debut).toLowerCase()}`;
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

/** Texte d'une bulle : « Foot ×4 · dès 18h », « Foot ×4 · en direct », « 4 sessions » (sports différents) */
export function texteGroupe(sessions: Session[], maintenant = new Date()) {
  const sports = sportsDuGroupe(sessions);
  if (sports.length > 1) return `${sessions.length} sessions`;
  const suite = sessions.some((s) => estEnDirect(s, maintenant))
    ? 'en direct'
    : `dès ${quandCourt(premierDebut(sessions), maintenant)}`;
  return `${sports[0].nom} ×${sessions.length} · ${suite}`;
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
