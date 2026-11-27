import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Durees, Espaces, Polices, Rayons, Tailles } from '@/constants/theme';
import { useSessions } from '@/lib/sessions';
import { useStyles, type Palette } from '@/lib/theme';

/** Temps pendant lequel on peut revenir sur une annulation */
const DELAI = 5000;

/** « Tu as quitté la session » avec « Annuler » pendant 5 s : on agit tout de suite, on peut se raviser. */
export function ToastAnnulation() {
  const styles = useStyles(creerStyles);
  const { top } = useSafeAreaInsets();
  const { annulee, retablir, oublierAnnulation } = useSessions();

  useEffect(() => {
    if (!annulee) return;
    const minuteur = setTimeout(oublierAnnulation, DELAI);
    return () => clearTimeout(minuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annulee]);

  if (!annulee) return null;

  return (
    <Animated.View
      key={annulee}
      entering={FadeInUp.duration(Durees.standard)}
      exiting={FadeOutUp.duration(Durees.fast)}
      accessibilityLiveRegion="polite"
      style={[styles.toast, { top: top + 8 }]}>
      <Text style={styles.texte}>Tu as quitté la session</Text>
      <Pressable
        accessibilityRole="button"
        onPress={retablir}
        hitSlop={8}
        style={({ pressed }) => [styles.bouton, pressed && { opacity: 0.7 }]}>
        <Text style={styles.boutonTexte}>Annuler</Text>
      </Pressable>
    </Animated.View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    toast: {
      position: 'absolute',
      left: 12,
      right: 12,
      height: 52,
      paddingLeft: 20,
      paddingRight: 6,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.encre,
      borderRadius: Rayons.pilule,
      boxShadow: c.ombreForte,
    },
    texte: { ...Polices.texteMoyen, fontSize: Tailles.courant, color: c.surEncre },
    bouton: {
      height: 40,
      minWidth: Espaces.cibleTactile,
      paddingHorizontal: 16,
      justifyContent: 'center',
      borderRadius: Rayons.pilule,
      backgroundColor: c.surEncreDoux,
    },
    boutonTexte: { ...Polices.texteDemi, fontSize: Tailles.petit, color: c.surEncre },
  });
