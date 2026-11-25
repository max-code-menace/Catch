import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarreNavigation, Durees, Polices, Rayons, RESERVE_BAS, Tailles } from '@/constants/theme';
import { useStyles, type Palette } from '@/lib/theme';

/** Hauteur de la ligne : « Près de moi » se pose au-dessus */
export const HAUTEUR_LIGNE_VIDE = 50;

type Props = {
  /** « Rien à 5 km » */
  texte: string;
  /** La suite, en orange, qui se touche : « Voir à 9 km › » (absente : la ligne ne se touche pas) */
  action?: string;
  onPress?: () => void;
};

/**
 * Carte vide (finition A, choisie par Maxime le 24 novembre) : une seule ligne fine au-dessus de « + Créer »,
 * « Rien à 5 km · Voir à 9 km › ». Plus de carte ni de miniature de session.
 */
export function LigneCarteVide({ texte, action, onPress }: Props) {
  const styles = useStyles(creerStyles);
  const { bottom } = useSafeAreaInsets();
  const bas = Math.max(bottom, BarreNavigation.margeBas) + RESERVE_BAS + 12;

  return (
    <Animated.View
      pointerEvents="box-none"
      entering={FadeIn.duration(Durees.standard)}
      exiting={FadeOut.duration(Durees.fast)}
      style={[styles.cadre, { bottom: bas }]}>
      <Pressable
        accessibilityRole={action ? 'button' : 'text'}
        accessibilityLabel={[texte, action].filter(Boolean).join(', ')}
        disabled={!action}
        onPress={onPress}
        style={({ pressed }) => [styles.ligne, pressed && { opacity: 0.8 }]}>
        <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.texte}>
          {texte}
          {action && (
            <Text style={styles.action}>
              {' · '}
              {action}
            </Text>
          )}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    cadre: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
    ligne: {
      minHeight: 40,
      maxWidth: '92%',
      paddingHorizontal: 16,
      justifyContent: 'center',
      backgroundColor: c.carte,
      borderRadius: Rayons.pilule,
      borderWidth: 1,
      borderColor: c.trait,
      boxShadow: c.ombrePetite,
    },
    texte: { fontFamily: Polices.texteMoyen, fontSize: Tailles.aide, color: c.encre },
    action: { fontFamily: Polices.texteDemi, color: c.orangeTexte },
  });
