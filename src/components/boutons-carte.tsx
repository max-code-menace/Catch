import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconeRecentrer } from '@/components/icones';
import { BarreNavigation, Durees, Espaces, Polices, Rayons, RESERVE_BAS, Tailles } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/**
 * « Près de moi » : n'apparaît que quand il sert (carte éloignée de soi, ou position pas encore connue),
 * à droite au-dessus de « + Créer ». Remplace l'ancien bouton « recentrer » de la barre du haut.
 */
export function BoutonPresDeMoi({ onPress, decalage = 0 }: { onPress: () => void; decalage?: number }) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const { bottom } = useSafeAreaInsets();
  const bas = Math.max(bottom, BarreNavigation.margeBas) + RESERVE_BAS + 12 + decalage;
  return (
    <Animated.View
      entering={FadeIn.duration(Durees.standard)}
      exiting={FadeOut.duration(Durees.standard)}
      style={[styles.cadrePresDeMoi, { bottom: bas }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Revenir près de moi"
        onPress={onPress}
        style={({ pressed }) => [styles.presDeMoi, pressed && { backgroundColor: c.beige }]}>
        <IconeRecentrer couleur={c.encre} taille={20} />
        <Text maxFontSizeMultiplier={1.3} style={styles.presDeMoiTexte}>
          Près de moi
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    cadrePresDeMoi: { position: 'absolute', right: 16 },
    presDeMoi: {
      minHeight: Espaces.cibleTactile,
      paddingLeft: 10,
      paddingRight: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderRadius: Rayons.pilule,
      backgroundColor: c.carte,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombrePetite,
    },
    presDeMoiTexte: { ...Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
  });
