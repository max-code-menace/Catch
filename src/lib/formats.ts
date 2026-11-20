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
