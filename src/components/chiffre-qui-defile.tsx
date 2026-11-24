import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, Easing } from 'react-native-reanimated';

type Props = {
  valeur: number;
  /** Taille du chiffre : sert aussi à la hauteur de la fenêtre où il défile */
  taille: number;
  style: StyleProp<TextStyle>;
  /** Plus grande valeur possible (le nombre de joueurs de la session) */
  max: number;
};

/**
 * Un chiffre qui défile comme un compteur quand il change pendant qu'on regarde
 * (quelqu'un catche, quelqu'un se désiste). À l'arrivée sur l'écran, il est déjà en place : pas d'animation en boucle.
 * « Réduire les animations » : Reanimated saute directement à la nouvelle valeur.
 */
export function ChiffreQuiDefile({ valeur, taille, style, max }: Props) {
  const hauteur = Math.round(taille * 1.08);
  const decalage = useSharedValue(-valeur * hauteur);
  const premier = useRef(true);

  useEffect(() => {
    const but = -valeur * hauteur;
    if (premier.current) {
      premier.current = false;
      decalage.set(but);
      return;
    }
    decalage.set(withTiming(but, { duration: 550, easing: Easing.bezier(0.65, 0, 0.25, 1) }));
  }, [valeur, hauteur, decalage]);

  const styleColonne = useAnimatedStyle(() => ({ transform: [{ translateY: decalage.get() }] }));
  const chiffres = Array.from({ length: Math.max(max, valeur) + 1 }, (_, i) => i);

  return (
    <View
      accessible
      accessibilityLabel={String(valeur)}
      style={[styles.fenetre, { height: hauteur }]}>
      <Animated.View style={styleColonne}>
        {chiffres.map((n) => (
          <Text
            key={n}
            maxFontSizeMultiplier={1}
            style={[style, { fontSize: taille, height: hauteur, lineHeight: hauteur, textAlign: 'center' }]}>
            {n}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fenetre: { overflow: 'hidden' },
});
