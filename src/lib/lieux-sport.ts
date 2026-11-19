// Les lieux de sport (table `lieux` de Supabase) : terrains publics gratuits et salles payantes.
// Lus une fois par ouverture de l'app : ils changent rarement, et seulement à la main.
import { useEffect, useState } from 'react';

import type { Sport } from '@/donnees/pictos';
import type { Coordonnees, Session } from '@/donnees/sessions';
import { distance } from '@/lib/formats';
import { supabase } from '@/lib/supabase';

export type LieuSport = {
  id: string;
  nom: string;
  sports: Sport[];
  /** `gratuit` : terrain public en accès libre. `payant` : salle, club, terrain à louer */
  type: 'gratuit' | 'payant';
  adresse: string;
  commune: string;
  /** Site du lieu (horaires, prix, réservation) : on y renvoie plutôt que de recopier ce qui change */
  site: string | null;
  /** Page pour réserver un sport précis (clé = sport). Sans lien pour un sport, on renvoie vers `site` */
  reservations: Partial<Record<Sport, string>>;
  position: Coordonnees;
};

type Ligne = Omit<LieuSport, 'position'> & { lat: number; lng: number };

/** Une session à moins de cette distance d'un lieu y est « prévue » */
const PROCHE_M = 100;

let lecture: Promise<LieuSport[]> | null = null;

function lire(): Promise<LieuSport[]> {
  if (!supabase) return Promise.resolve([]);
  const client = supabase;
  lecture ??= (async () => {
    const { data, error } = await client
      .from('lieux')
      .select('id, nom, sports, type, adresse, commune, site, reservations, lat, lng')
      .order('nom');
    if (error) throw error;
    return (data as Ligne[]).map(({ lat, lng, reservations, ...reste }) => ({
      ...reste,
      reservations: reservations ?? {},
      position: { latitude: lat, longitude: lng },
    }));
  })().catch(() => {
    // Pas de réseau : on réessaiera au prochain écran qui en a besoin
    lecture = null;
    return [];
  });
  return lecture;
}

/** Tous les lieux. Liste vide tant qu'ils ne sont pas lus (ou sans réseau) : la carte marche sans. */
export function useLieuxSport() {
  const [lieux, setLieux] = useState<LieuSport[]>([]);
  useEffect(() => {
    let actif = true;
    lire().then((lus) => actif && setLieux(lus));
    return () => {
      actif = false;
    };
  }, []);
  return lieux;
}

/** Les lieux d'un sport, les plus proches d'abord */
export function lieuxDuSport(lieux: LieuSport[], sport: Sport, origine: Coordonnees) {
  return lieux
    .filter((l) => l.sports.includes(sport))
    .map((l) => ({ lieu: l, distance: distance(origine, l.position) }))
    .sort((a, b) => a.distance - b.distance);
}

/** Les sessions prévues à ce lieu, les plus proches dans le temps d'abord */
export function sessionsDuLieu(lieu: LieuSport, sessions: Session[]) {
  return sessions
    .filter((s) => distance(lieu.position, s.position) <= PROCHE_M)
    .sort((a, b) => a.debut.getTime() - b.debut.getTime());
}

/** Le lieu connu à cet endroit (à quelques mètres près), s'il y en a un */
export function lieuA(lieux: LieuSport[], position: Coordonnees, rayonM = 25) {
  return lieux.find((l) => distance(l.position, position) <= rayonM) ?? null;
}

/** « Gratuit » ou « Payant », pour la pastille et la fiche */
export function texteType(lieu: LieuSport) {
  return lieu.type === 'gratuit' ? 'Gratuit' : 'Payant';
}

/** Où envoyer pour ce sport : la page de réservation du sport si on l'a, sinon le site du lieu */
export function lienDuLieu(lieu: LieuSport, sport: Sport) {
  const reservation = lieu.reservations[sport];
  if (reservation) return { url: reservation, titre: 'Réserver', reservation: true };
  if (lieu.site) return { url: lieu.site, titre: 'Site', reservation: false };
  return null;
}
