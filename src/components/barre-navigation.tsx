import type { TabTriggerSlotProps } from 'expo-router/ui';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarreNavigation as Mesures, Couleurs, Durees, Polices, Rayons, Ressorts } from '@/constants/theme';

const PressableAnime = Animated.createAnimatedComponent(Pressable);

type Icone = (props: { couleur: string; taille?: number }) => React.ReactNode;

type OngletProps = Omit<TabTriggerSlotProps, 'ref'> & {
  ref?: React.Ref<any>;
  titre: string;
  Icone: Icone;
};

export function Onglet({ titre, Icone, isFocused, onPressIn, onPressOut, style, ...props }: OngletProps) {
  const echelle = useSharedValue(1);
  const actif = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    actif.value = withTiming(isFocused ? 1 : 0, { duration: Durees.standard });
  }, [isFocused, actif]);

  const styleOnglet = useAnimatedStyle(() => ({ transform: [{ scale: echelle.value }] }));
  const styleFond = useAnimatedStyle(() => ({ opacity: actif.value }));
  const couleur = isFocused ? Couleurs.carte : Couleurs.texteSecondaire;

  return (
    <PressableAnime
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      onPressIn={(e) => {
        echelle.value = withSpring(0.96, Ressorts.snappy);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        echelle.value = withSpring(1, Ressorts.snappy);
        onPressOut?.(e);
      }}
      style={[styles.onglet, styleOnglet]}
      {...props}>
      <Animated.View style={[styles.fondActif, styleFond]} />
      <View>
        <Icone couleur={couleur} taille={22} />
      </View>
      <Text style={[styles.titre, { color: couleur }]}>{titre}</Text>
    </PressableAnime>
  );
}

/** Style de la pilule blanche flottante, à poser sur <TabList> dans src/app/_layout.tsx. */
export function useStyleBarre() {
  const { bottom } = useSafeAreaInsets();
  return [styles.barre, { bottom: Math.max(bottom, Mesures.margeBas) }];
}

const styles = StyleSheet.create({
  barre: {
    position: 'absolute',
    left: Mesures.margeCotes,
    right: Mesures.margeCotes,
    height: Mesures.hauteur,
    padding: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Couleurs.carte,
    borderRadius: Rayons.pilule,
    borderWidth: 1,
    borderColor: Couleurs.trait,
    boxShadow: '0 8px 24px rgba(28, 20, 18, 0.12)',
  },
  onglet: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: Rayons.pilule,
  },
  fondActif: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: Couleurs.rouge,
    borderRadius: Rayons.pilule,
  },
  titre: { fontFamily: Polices.texteMoyen, fontSize: 11 },
});
