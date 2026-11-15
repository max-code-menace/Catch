import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Couleurs, Espaces, Polices, Rayons, Ressorts } from '@/constants/theme';

const PressableAnime = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'children' | 'style'> & {
  titre: string;
  variante?: 'principal' | 'secondaire';
};

/** Bouton de Catch : se réduit à 0,96 sous le doigt. */
export function Bouton({ titre, variante = 'principal', onPressIn, onPressOut, ...props }: Props) {
  const echelle = useSharedValue(1);
  const styleAnime = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));
  const principal = variante === 'principal';

  return (
    <PressableAnime
      accessibilityRole="button"
      onPressIn={(e) => {
        echelle.value = withSpring(0.96, Ressorts.snappy);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        echelle.value = withSpring(1, Ressorts.snappy);
        onPressOut?.(e);
      }}
      style={[styles.base, principal ? styles.principal : styles.secondaire, styleAnime]}
      {...props}>
      <Text style={[styles.texte, { color: principal ? Couleurs.carte : Couleurs.encre }]}>
        {titre}
      </Text>
    </PressableAnime>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    minWidth: Espaces.cibleTactile,
    paddingHorizontal: 24,
    borderRadius: Rayons.bouton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  principal: { backgroundColor: Couleurs.rouge },
  secondaire: { backgroundColor: Couleurs.carte, borderWidth: 1, borderColor: Couleurs.trait },
  texte: { fontFamily: Polices.texteDemi, fontSize: 16 },
});
