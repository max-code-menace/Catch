import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Polices, Tailles } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

const TAILLE = 30;
const NOMBRE_ECLATS = 8;
const PORTEE = 30;

function Eclat({ rang, avancee, couleur }: { rang: number; avancee: SharedValue<number>; couleur: string }) {
  const styles = useStyles(creerStyles);
  const angle = (rang / NOMBRE_ECLATS) * 2 * Math.PI - Math.PI / 2;
  const portee = PORTEE + (rang % 3) * 6;
  const style = useAnimatedStyle(() => {
    const t = avancee.get();
    return {
      opacity: t === 0 ? 0 : 1 - t,
      transform: [
        { translateX: Math.cos(angle) * portee * t },
        { translateY: Math.sin(angle) * portee * t },
        { scale: 1 - 0.5 * t },
      ],
    };
  });
  return <Animated.View style={[styles.eclat, rang % 2 ? styles.carre : null, { backgroundColor: couleur }, style]} />;
}

/**
 * Ton rond « Toi » qui rejoint l'équipe après un Catch : il sort, une onde part autour
 * et quelques éclats aux couleurs de Catch. Avec « Réduire les animations », un simple fondu.
 */
export function RondToiQuiArrive({ delai = 0 }: { delai?: number }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const reduit = useReducedMotion();
  const sortie = useSharedValue(0);
  const fete = useSharedValue(0);

  useEffect(() => {
    sortie.set(
      withDelay(delai, reduit ? withTiming(1, { duration: 250 }) : withSpring(1, { duration: 420, dampingRatio: 0.55 })),
    );
    if (!reduit) fete.set(withDelay(delai + 120, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) })));
  }, [delai, reduit, sortie, fete]);

  const styleRond = useAnimatedStyle(() => ({
    opacity: Math.min(1, sortie.get() * 3),
    transform: [{ scale: reduit ? 1 : 0.3 + 0.7 * sortie.get() }],
  }));
  const styleOnde = useAnimatedStyle(() => ({
    opacity: fete.get() === 0 ? 0 : 0.6 * (1 - fete.get()),
    transform: [{ scale: 1 + 1.3 * fete.get() }],
  }));
  const couleurs = [c.orange, c.rouge, c.creerDebut, c.avatar1];

  return (
    <View style={styles.cadre} accessibilityLabel="Toi">
      {!reduit && (
        <>
          <Animated.View pointerEvents="none" style={[styles.onde, styleOnde]} />
          {Array.from({ length: NOMBRE_ECLATS }, (_, i) => (
            <Eclat key={i} rang={i} avancee={fete} couleur={couleurs[i % couleurs.length]} />
          ))}
        </>
      )}
      <Animated.View style={[styles.rond, styleRond]}>
        <Text maxFontSizeMultiplier={1.3} style={styles.texte}>
          Toi
        </Text>
      </Animated.View>
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    cadre: { width: TAILLE, height: TAILLE, marginLeft: -8, alignItems: 'center', justifyContent: 'center' },
    rond: {
      width: TAILLE,
      height: TAILLE,
      borderRadius: TAILLE / 2,
      borderWidth: 2,
      borderColor: c.carte,
      backgroundColor: c.rouge,
      alignItems: 'center',
      justifyContent: 'center',
    },
    onde: {
      position: 'absolute',
      width: TAILLE,
      height: TAILLE,
      borderRadius: TAILLE / 2,
      borderWidth: 2,
      borderColor: c.orange,
    },
    eclat: { position: 'absolute', width: 7, height: 7, borderRadius: 4 },
    carre: { borderRadius: 1.5 },
    texte: { ...Polices.texteDemi, fontSize: Tailles.minuscule, color: c.surRouge },
  });
