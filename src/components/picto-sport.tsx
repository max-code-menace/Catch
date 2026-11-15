import { SvgXml } from 'react-native-svg';

import { Pictos, type Sport } from '@/donnees/pictos';

/** Picto d'un sport. Toujours l'accompagner du nom du sport. */
export function PictoSport({ sport, taille }: { sport: Sport; taille: number }) {
  return <SvgXml xml={Pictos[sport]} width={taille} height={taille} />;
}
