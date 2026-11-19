// Les événements sportifs ouverts à tous (table `evenements` de Supabase) : courses, randos vélo…
// Ils vivent sur la carte, au départ, seulement pendant les 7 jours qui précèdent (comme les sessions).
import { useEffect, useState } from 'react';

import type { Sport } from '@/donnees/pictos';
import type { Coordonnees, Session } from '@/donnees/sessions';
import { supabase } from '@/lib/supabase';

export type Evenement = {
  id: string;
  nom: string;
  sport: Sport;
  /** Ce qu'on y fait, en une ligne : « 5 et 10 km » */
  detail: string | null;
  debut: Date;
  /** Nom du lieu de départ */
  depart: string;
  commune: string;
  position: Coordonnees;
  /** Page officielle pour s'inscrire */
  lien: string;
};

type Ligne = Omit<Evenement, 'debut' | 'position'> & { debut: string; lat: number; lng: number };

const HEURE = 3_600_000;
const JOUR = 24 * HEURE;
/** Un événement reste sur la carte quelques heures après son départ (les gens sont encore là) */
const APRES_DEPART = 3 * HEURE;

let lecture: Promise<Evenement[]> | null = null;

function lire(): Promise<Evenement[]> {
  if (!supabase) return Promise.resolve([]);
  const client = supabase;
  lecture ??= (async () => {
    const { data, error } = await client
      .from('evenements')
      .select('id, nom, sport, detail, debut, depart, commune, lat, lng, lien')
      .gte('debut', new Date(Date.now() - APRES_DEPART).toISOString())
      .order('debut');
    if (error) throw error;
    return (data as Ligne[]).map(({ lat, lng, debut, ...reste }) => ({
      ...reste,
      debut: new Date(debut),
      position: { latitude: lat, longitude: lng },
    }));
  })().catch(() => {
    // Pas de réseau : on réessaiera au prochain écran qui en a besoin
    lecture = null;
    return [];
  });
  return lecture;
}

/** Visible sur la carte : départ dans les 7 prochains jours, ou il y a moins de 3 heures */
export function estVisible(evenement: Evenement, maintenant = Date.now()) {
  const ecart = evenement.debut.getTime() - maintenant;
  return ecart > -APRES_DEPART && ecart <= 7 * JOUR;
}

/** Les événements à montrer. Liste vide tant qu'ils ne sont pas lus (ou sans réseau). */
export function useEvenements() {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  useEffect(() => {
    let actif = true;
    lire().then((lus) => actif && setEvenements(lus.filter((e) => estVisible(e))));
    return () => {
      actif = false;
    };
  }, []);
  return evenements;
}

/** Les sessions qui y vont ensemble, les plus tôt d'abord */
export function sessionsDeLEvenement(evenement: Evenement, sessions: Session[]) {
  return sessions
    .filter((s) => s.evenementId === evenement.id)
    .sort((a, b) => a.debut.getTime() - b.debut.getTime());
}
