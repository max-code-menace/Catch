// Photo de chaque sport : tuiles où l'on choisit un sport (Créer, Profil > Mes sports, menu de la carte),
// vignettes de « Relancer », et en plus large le bandeau des cartes de « Mes sessions ».
// Découpées dans design/sports/planche-sports.png par scripts/decouper_sports.py : modifier la planche ou le script.
import type { ImageSourcePropType } from 'react-native';

import type { Sport } from '@/donnees/pictos';

export const ImagesSports: Record<Sport, ImageSourcePropType> = {
  autre: require('../../assets/sports/autre.jpg'),
  badminton: require('../../assets/sports/badminton.jpg'),
  basket: require('../../assets/sports/basket.jpg'),
  boxe: require('../../assets/sports/boxe.jpg'),
  course: require('../../assets/sports/course.jpg'),
  escalade: require('../../assets/sports/escalade.jpg'),
  foot: require('../../assets/sports/foot.jpg'),
  padel: require('../../assets/sports/padel.jpg'),
  petanque: require('../../assets/sports/petanque.jpg'),
  pingpong: require('../../assets/sports/pingpong.jpg'),
  rugby: require('../../assets/sports/rugby.jpg'),
  spikeball: require('../../assets/sports/spikeball.jpg'),
  squash: require('../../assets/sports/squash.jpg'),
  streetworkout: require('../../assets/sports/streetworkout.jpg'),
  tennis: require('../../assets/sports/tennis.jpg'),
  ultimate: require('../../assets/sports/ultimate.jpg'),
  velo: require('../../assets/sports/velo.jpg'),
  volley: require('../../assets/sports/volley.jpg'),
};

/** Même photo en 5:2, l'objet toujours entier : bandeau des cartes de « Mes sessions » */
export const BandeauxSports: Record<Sport, ImageSourcePropType> = {
  autre: require('../../assets/sports/bandeau/autre.jpg'),
  badminton: require('../../assets/sports/bandeau/badminton.jpg'),
  basket: require('../../assets/sports/bandeau/basket.jpg'),
  boxe: require('../../assets/sports/bandeau/boxe.jpg'),
  course: require('../../assets/sports/bandeau/course.jpg'),
  escalade: require('../../assets/sports/bandeau/escalade.jpg'),
  foot: require('../../assets/sports/bandeau/foot.jpg'),
  padel: require('../../assets/sports/bandeau/padel.jpg'),
  petanque: require('../../assets/sports/bandeau/petanque.jpg'),
  pingpong: require('../../assets/sports/bandeau/pingpong.jpg'),
  rugby: require('../../assets/sports/bandeau/rugby.jpg'),
  spikeball: require('../../assets/sports/bandeau/spikeball.jpg'),
  squash: require('../../assets/sports/bandeau/squash.jpg'),
  streetworkout: require('../../assets/sports/bandeau/streetworkout.jpg'),
  tennis: require('../../assets/sports/bandeau/tennis.jpg'),
  ultimate: require('../../assets/sports/bandeau/ultimate.jpg'),
  velo: require('../../assets/sports/bandeau/velo.jpg'),
  volley: require('../../assets/sports/bandeau/volley.jpg'),
};
