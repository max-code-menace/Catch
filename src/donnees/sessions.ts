// Fausses sessions autour de Wavre, le temps de construire les écrans.
// Elles seront remplacées par les vraies sessions de Supabase.
import type { Sport } from '@/donnees/pictos';

export type Coordonnees = { latitude: number; longitude: number };

export type Session = {
  id: string;
  sport: Sport;
  /** Nom court affiché dans les pastilles : « Foot », « Volley » */
  nomSport: string;
  /** Titre de la session : « Foot à 5 » */
  titre: string;
  lieu: string;
  commune: string;
  position: Coordonnees;
  debut: Date;
  fin: Date;
  joueurs: number;
  /** Initiales des inscrits, organisateur en premier */
  inscrits: string[];
  organisateur: string;
  debutantsBienvenus: boolean;
};

export const WAVRE: Coordonnees = { latitude: 50.7167, longitude: 4.6111 };

const MINUTE = 60_000;

function dans(minutes: number) {
  return new Date(Date.now() + minutes * MINUTE);
}

/** Un jour à venir, à une heure fixe. */
function jour(dansJours: number, heure: number, minutes = 0) {
  const date = new Date();
  date.setDate(date.getDate() + dansJours);
  date.setHours(heure, minutes, 0, 0);
  return date;
}

function plus(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * MINUTE);
}

export function sessionsFictives(): Session[] {
  const badminton = jour(2, 19);
  const volley = jour(1, 18, 30);
  const escalade = jour(3, 14);
  const basket = jour(1, 20);

  return [
    {
      id: 'foot-source',
      sport: 'foot',
      nomSport: 'Foot',
      titre: 'Foot à 5',
      lieu: 'Parc de la Source',
      commune: 'Wavre',
      position: { latitude: 50.7204, longitude: 4.6052 },
      debut: dans(-35),
      fin: dans(85),
      joueurs: 10,
      inscrits: ['LM', 'SA', 'TB', 'JD', 'EK', 'NR'],
      organisateur: 'Lucas',
      debutantsBienvenus: true,
    },
    {
      id: 'spikeball-genval',
      sport: 'spikeball',
      nomSport: 'Spikeball',
      titre: 'Spikeball',
      lieu: 'Lac de Genval',
      commune: 'Genval',
      position: { latitude: 50.7262, longitude: 4.5121 },
      debut: dans(-20),
      fin: dans(70),
      joueurs: 6,
      inscrits: ['TB', 'CL', 'MV', 'AD'],
      organisateur: 'Tom',
      debutantsBienvenus: true,
    },
    {
      id: 'volley-bierges',
      sport: 'volley',
      nomSport: 'Volley',
      titre: 'Volley',
      lieu: 'Plaine de Bierges',
      commune: 'Bierges',
      position: { latitude: 50.7108, longitude: 4.5869 },
      debut: volley,
      fin: plus(volley, 90),
      joueurs: 8,
      inscrits: ['EK', 'SA', 'PL', 'HB', 'JD', 'OC', 'MR'],
      organisateur: 'Emma',
      debutantsBienvenus: true,
    },
    {
      id: 'badminton-rixensart',
      sport: 'badminton',
      nomSport: 'Badminton',
      titre: 'Badminton',
      lieu: 'Salle des sports',
      commune: 'Rixensart',
      position: { latitude: 50.7107, longitude: 4.5301 },
      debut: badminton,
      fin: plus(badminton, 90),
      joueurs: 8,
      inscrits: ['SA', 'LM', 'TB', 'JD', 'NR', 'CL'],
      organisateur: 'Sarah',
      debutantsBienvenus: true,
    },
    {
      id: 'basket-limal',
      sport: 'basket',
      nomSport: 'Basket',
      titre: 'Basket 3 contre 3',
      lieu: 'Terrain de Limal',
      commune: 'Limal',
      position: { latitude: 50.6921, longitude: 4.5749 },
      debut: basket,
      fin: plus(basket, 60),
      joueurs: 6,
      inscrits: ['NR', 'AD'],
      organisateur: 'Noah',
      debutantsBienvenus: false,
    },
    {
      id: 'escalade-lln',
      sport: 'escalade',
      nomSport: 'Escalade',
      titre: 'Escalade en salle',
      lieu: 'Salle Blocry',
      commune: 'Louvain-la-Neuve',
      position: { latitude: 50.6692, longitude: 4.6208 },
      debut: escalade,
      fin: plus(escalade, 120),
      joueurs: 8,
      inscrits: ['MV', 'PL', 'HB', 'OC'],
      organisateur: 'Marie',
      debutantsBienvenus: true,
    },
  ];
}
