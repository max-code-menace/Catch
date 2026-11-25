// Illustration du terrain de chaque sport (en-tête du détail d'une session, bandeau des cartes de « Mes sessions »).
// Images fabriquées par scripts/generer_terrains.py (vraies dimensions des terrains) puis scripts/rendre_terrains.mjs.
import type { ImageSourcePropType } from 'react-native';

import type { Sport } from '@/donnees/pictos';

export const Terrains: Record<Sport, ImageSourcePropType> = {
  autre: require('../../assets/terrains/autre.jpg'),
  badminton: require('../../assets/terrains/badminton.jpg'),
  basket: require('../../assets/terrains/basket.jpg'),
  boxe: require('../../assets/terrains/boxe.jpg'),
  course: require('../../assets/terrains/course.jpg'),
  escalade: require('../../assets/terrains/escalade.jpg'),
  foot: require('../../assets/terrains/foot.jpg'),
  padel: require('../../assets/terrains/padel.jpg'),
  petanque: require('../../assets/terrains/petanque.jpg'),
  pingpong: require('../../assets/terrains/pingpong.jpg'),
  rugby: require('../../assets/terrains/rugby.jpg'),
  spikeball: require('../../assets/terrains/spikeball.jpg'),
  squash: require('../../assets/terrains/squash.jpg'),
  streetworkout: require('../../assets/terrains/streetworkout.jpg'),
  tennis: require('../../assets/terrains/tennis.jpg'),
  ultimate: require('../../assets/terrains/ultimate.jpg'),
  velo: require('../../assets/terrains/velo.jpg'),
  volley: require('../../assets/terrains/volley.jpg'),
};
