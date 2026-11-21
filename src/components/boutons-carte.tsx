import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HAUTEUR_BARRE_HAUT } from '@/components/barre-haut';
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

/** Petite bulle sous l'étoile, montrée une seule fois tant qu'on n'a pas choisi de sports */
export function BulleMesSports({ onPress }: { onPress: () => void }) {
  const styles = useStyles(creerStyles);
  const { top } = useSafeAreaInsets();
  return (
    <Animated.View
      entering={FadeIn.duration(Durees.standard)}
      exiting={FadeOut.duration(Durees.standard)}
      style={[styles.cadreBulle, { top: top + HAUTEUR_BARRE_HAUT + 4 }]}>
      <View style={styles.pointe} />
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.bulle}>
        <Text maxFontSizeMultiplier={1.3} style={styles.bulleTexte}>
          Choisis tes sports : ensuite, l’étoile passe de tes sports à tous en un toucher.
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
    presDeMoiTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.aide, color: c.encre },
    cadreBulle: { position: 'absolute', right: 12, width: 220, alignItems: 'flex-end' },
    // La pointe se place sous l'étoile (au bout de la barre du haut)
    pointe: {
      width: 12,
      height: 12,
      marginRight: 20,
      marginBottom: -6,
      backgroundColor: c.encre,
      transform: [{ rotate: '45deg' }],
    },
    bulle: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 14,
      backgroundColor: c.encre,
      boxShadow: c.ombreForte,
    },
    bulleTexte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.aide, color: c.surEncre },
  });
