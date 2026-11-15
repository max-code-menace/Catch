import { SvgXml } from 'react-native-svg';

import { pictos, type Sport } from '@/theme/pictos';

// Picto d'un sport (design/pictos). Toujours accompagné du nom du sport à côté.
export function PictoSport({ sport, taille = 20 }: { sport: Sport; taille?: number }) {
  return <SvgXml xml={pictos[sport]} width={taille} height={taille} />;
}
