import { type Sport } from '@/theme/pictos';

import { SUPABASE_CLE_PUBLIQUE, SUPABASE_URL } from './config';

export type Session = {
  id: string;
  sport: Sport;
  titre: string | null;
  lieuNom: string;
  commune: string | null;
  lat: number;
  lng: number;
  debut: Date;
  fin: Date;
  joueursMax: number;
  inscrits: number;
  debutantsBienvenus: boolean;
};

export const NOMS_SPORTS: Record<Sport, string> = {
  foot: 'Foot',
  basket: 'Basket',
  volley: 'Volley',
  rugby: 'Rugby',
  spikeball: 'Spikeball',
  tennis: 'Tennis',
  badminton: 'Badminton',
  escalade: 'Escalade',
  padel: 'Padel',
  autre: 'Autre sport',
};

type Ligne = {
  id: string;
  sport: string;
  titre: string | null;
  lieu_nom: string;
  commune: string | null;
  lat: number;
  lng: number;
  debut: string;
  fin: string;
  joueurs_max: number;
  inscrits: number;
  debutants_bienvenus: boolean;
};

// Les sessions pas encore finies qui commencent dans les 7 prochains jours.
export async function chargerSessions(): Promise<Session[]> {
  const maintenant = new Date();
  const dans7Jours = new Date(maintenant.getTime() + 7 * 24 * 3600 * 1000);
  const url =
    `${SUPABASE_URL}/rest/v1/sessions?select=*` +
    `&fin=gt.${encodeURIComponent(maintenant.toISOString())}` +
    `&debut=lt.${encodeURIComponent(dans7Jours.toISOString())}` +
    `&order=debut.asc&limit=500`;
  const controle = new AbortController();
  const delai = setTimeout(() => controle.abort(), 10000);
  try {
    const reponse = await fetch(url, {
      headers: { apikey: SUPABASE_CLE_PUBLIQUE },
      signal: controle.signal,
    });
    if (!reponse.ok) throw new Error(`Réponse ${reponse.status}`);
    const lignes = (await reponse.json()) as Ligne[];
    return lignes.map((l) => ({
      id: l.id,
      sport: (l.sport in NOMS_SPORTS ? l.sport : 'autre') as Sport,
      titre: l.titre,
      lieuNom: l.lieu_nom,
      commune: l.commune,
      lat: l.lat,
      lng: l.lng,
      debut: new Date(l.debut),
      fin: new Date(l.fin),
      joueursMax: l.joueurs_max,
      inscrits: l.inscrits,
      debutantsBienvenus: l.debutants_bienvenus,
    }));
  } finally {
    clearTimeout(delai);
  }
}

export type Statut = 'direct' | 'manque' | 'normal';

export function placesLibres(s: Session) {
  return Math.max(0, s.joueursMax - s.inscrits);
}

// « En direct » : commencée et pas finie. « Il manque » : plus qu'une ou deux places libres.
export function statut(s: Session, maintenant = new Date()): Statut {
  if (s.debut <= maintenant && maintenant < s.fin) return 'direct';
  const libres = placesLibres(s);
  if (libres >= 1 && libres <= 2) return 'manque';
  return 'normal';
}

export function titreSession(s: Session) {
  return s.titre ?? NOMS_SPORTS[s.sport];
}

const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

// « 19h », « 19h30 »
export function texteHeure(d: Date) {
  const m = d.getMinutes();
  return `${d.getHours()}h${m === 0 ? '' : String(m).padStart(2, '0')}`;
}

// « ce soir 19h », « demain 10h », « jeu. 19h »
export function texteQuand(d: Date, maintenant = new Date()) {
  const jour = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const ecart = Math.round((jour(d) - jour(maintenant)) / 86400000);
  const heure = texteHeure(d);
  if (ecart <= 0) return d.getHours() >= 18 ? `ce soir ${heure}` : `aujourd’hui ${heure}`;
  if (ecart === 1) return `demain ${heure}`;
  return `${JOURS[d.getDay()]} ${heure}`;
}

export function majuscule(t: string) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Texte de la pastille sur la carte : « Foot · 6 jouent », « Volley · il manque 1 », « Badminton · jeu. 19h ».
export function textePastille(s: Session, maintenant = new Date()) {
  const nom = NOMS_SPORTS[s.sport];
  const st = statut(s, maintenant);
  if (st === 'direct') return `${nom} · ${s.inscrits} ${s.inscrits > 1 ? 'jouent' : 'joue'}`;
  if (st === 'manque') return `${nom} · il manque ${placesLibres(s)}`;
  return `${nom} · ${texteQuand(s.debut, maintenant)}`;
}

export function textePlaces(s: Session) {
  const libres = placesLibres(s);
  if (libres === 0) return 'Complet';
  return `${libres} ${libres > 1 ? 'places libres' : 'place libre'}`;
}
