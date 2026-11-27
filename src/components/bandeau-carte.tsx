import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HAUTEUR_BARRE_HAUT } from '@/components/barre-haut';
import { Durees, Polices, Rayons, Tailles } from '@/constants/theme';
import { useStyles, type Palette } from '@/lib/theme';

type Props = {
  /** Change pour relancer le bandeau et son minuteur */
  cle: number;
  titre: string;
  /** Deuxième ligne, plus discrète */
  texte?: string;
  /** Bouton à droite (« Inviter ») */
  action?: { titre: string; onPress: () => void };
  /** Temps d'affichage, en millisecondes */
  duree: number;
  onFini: () => void;
};

/**
 * Bonne nouvelle sous la barre du haut (« 7 sessions près de toi », « C'est en ligne ! ») :
 * elle glisse depuis la barre, reste quelques secondes et repart toute seule, sans bloquer la carte.
 */
export function BandeauCarte({ cle, titre, texte, action, duree, onFini }: Props) {
  const styles = useStyles(creerStyles);
  const reduit = useReducedMotion();
  const { top } = useSafeAreaInsets();

  useEffect(() => {
    const minuteur = setTimeout(onFini, duree);
    return () => clearTimeout(minuteur);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);

  return (
    <View pointerEvents="box-none" style={[styles.cadre, { top: top + HAUTEUR_BARRE_HAUT + 4 }]}>
      <Animated.View
        key={cle}
        entering={reduit ? undefined : FadeInUp.springify().dampingRatio(0.7).duration(Durees.emphasized + 100)}
        exiting={FadeOutUp.duration(Durees.fast)}
        accessibilityLiveRegion="polite"
        style={[styles.bandeau, action && styles.avecAction]}>
        <View style={styles.point} />
        <View style={styles.textes}>
          <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.titre}>
            {titre}
          </Text>
          {texte && (
            <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.texte}>
              {texte}
            </Text>
          )}
        </View>
        {action && (
          <Pressable
            accessibilityRole="button"
            onPress={action.onPress}
            hitSlop={8}
            style={({ pressed }) => [styles.bouton, pressed && styles.presse]}>
            <Text maxFontSizeMultiplier={1.3} style={styles.boutonTexte}>
              {action.titre}
            </Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    cadre: { position: 'absolute', left: 12, right: 12, alignItems: 'center' },
    bandeau: {
      maxWidth: '100%',
      minHeight: 44,
      paddingVertical: 8,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.encre,
      borderRadius: Rayons.pilule,
      boxShadow: c.ombreForte,
    },
    avecAction: { paddingRight: 6, alignSelf: 'stretch' },
    point: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.orange },
    textes: { flexShrink: 1, flexGrow: 1 },
    titre: { ...Polices.texteDemi, fontSize: Tailles.petit, color: c.surEncre },
    texte: { ...Polices.texte, fontSize: Tailles.aide, color: c.surEncre, opacity: 0.8 },
    bouton: {
      minHeight: 40,
      paddingHorizontal: 16,
      borderRadius: Rayons.pilule,
      backgroundColor: c.rouge,
      alignItems: 'center',
      justifyContent: 'center',
    },
    presse: { transform: [{ scale: 0.96 }] },
    boutonTexte: { ...Polices.texteDemi, fontSize: Tailles.petit, color: c.surRouge },
  });
