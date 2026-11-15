import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Couleurs, Durees, Espaces, Polices, Rayons } from '@/constants/theme';
import { useSessions } from '@/lib/sessions';

/** Temps pendant lequel on peut revenir sur une annulation */
const DELAI = 5000;

/** « Tu as quitté la session » avec « Annuler » pendant 5 s : on agit tout de suite, on peut se raviser. */
export function ToastAnnulation() {
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

const styles = StyleSheet.create({
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
    backgroundColor: Couleurs.encre,
    borderRadius: Rayons.pilule,
    boxShadow: '0 8px 24px rgba(28, 20, 18, 0.24)',
  },
  texte: { fontFamily: Polices.texteMoyen, fontSize: 15, color: Couleurs.carte },
  bouton: {
    height: 40,
    minWidth: Espaces.cibleTactile,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: Rayons.pilule,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  boutonTexte: { fontFamily: Polices.texteDemi, fontSize: 14, color: Couleurs.carte },
});
