import { useEffect, useRef } from 'react';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';

import { Pictos, type Sport } from '@/donnees/pictos';

/** Picto d'un sport. Toujours l'accompagner du nom du sport. */
export function PictoSport({ sport, taille }: { sport: Sport; taille: number }) {
  return <SvgXml xml={Pictos[sport]} width={taille} height={taille} />;
}

/** Ressort court du picto qui reprend sa taille après s'être tassé */
const RESSORT_TASSE = { duration: 320, dampingRatio: 0.55 };

/**
 * Picto d'une tuile qu'on choisit : au moment où elle devient choisie, il se tasse sous le doigt
 * et reprend sa taille. Rien au premier affichage ni quand on décoche.
 */
export function PictoQuiSaute({ sport, taille, actif }: { sport: Sport; taille: number; actif: boolean }) {
  const reduit = useReducedMotion();
  const echelle = useSharedValue(1);
  const premier = useRef(true);

  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    if (!actif || reduit) return;
    echelle.set(withSequence(withTiming(0.78, { duration: 90 }), withSpring(1, RESSORT_TASSE)));
  }, [actif, reduit, echelle]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: echelle.get() }] }));
  return (
    <Animated.View style={style}>
      <PictoSport sport={sport} taille={taille} />
    </Animated.View>
  );
}
