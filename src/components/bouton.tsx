import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useEffect, useState } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Espaces, Polices, Rayons, Ressorts, Tailles } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

const PressableAnime = Animated.createAnimatedComponent(Pressable);

type Icone = (props: { couleur: string; taille?: number }) => React.ReactNode;

type Props = Omit<PressableProps, 'children' | 'style'> & {
  titre: string;
  /** « lien » : texte rouge sans fond, pour les actions discrètes comme « Annuler ma participation » */
  variante?: 'principal' | 'secondaire' | 'lien';
  Icone?: Icone;
  style?: StyleProp<ViewStyle>;
  /** Le serveur travaille : une balle roule d'un bout à l'autre du bouton (bouton rouge seulement) */
  attente?: boolean;
};

const TAILLE_BALLE = 20;
/** Un aller-retour de la balle dans le bouton */
const ALLER_RETOUR = 1100;

/** Balle blanche qui roule dans le bouton pendant qu'on attend le serveur. */
function BalleQuiRoule({ largeur }: { largeur: number }) {
  const styles = useStyles(creerStyles);
  const reduit = useReducedMotion();
  const avancee = useSharedValue(0);
  const course = Math.max(0, largeur - TAILLE_BALLE - 2 * 14);

  useEffect(() => {
    if (reduit) return;
    avancee.set(withRepeat(withTiming(1, { duration: ALLER_RETOUR / 2, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [avancee, reduit]);

  // Elle tourne sur elle-même en avançant, comme une balle qui roule vraiment
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: course * avancee.get() },
      { rotate: `${(course * avancee.get() * 360) / (Math.PI * TAILLE_BALLE)}deg` },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[styles.balleRoule, style]}>
      <View style={styles.coutureBalle} />
    </Animated.View>
  );
}

/** Hauteur de la tranche sous un bouton rouge */
export const TRANCHE = 4;

/**
 * Bouton de Catch. Le bouton rouge a une tranche foncée dessous et s'y enfonce sous le doigt,
 * comme une vraie touche ; les autres se réduisent à 0,96.
 */
export function Bouton({ titre, variante = 'principal', Icone, style, onPressIn, onPressOut, disabled, attente = false, ...props }: Props) {
  const styles = useStyles(creerStyles);
  const [largeur, setLargeur] = useState(0);
  const enfonce = useSharedValue(0);
  const principal = variante === 'principal';
  const styleAnime = useAnimatedStyle(() =>
    principal
      ? { transform: [{ translateY: enfonce.get() * (TRANCHE - 1) }] }
      : { transform: [{ scale: 1 - 0.04 * enfonce.get() }] },
  );
  const c = useCouleurs();
  const couleur = { principal: c.surRouge, secondaire: c.encre, lien: c.rougeTexte }[variante];

  const bouton = (
    <PressableAnime
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={(e) => {
        enfonce.set(withSpring(1, Ressorts.snappy));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        enfonce.set(withSpring(0, Ressorts.snappy));
        onPressOut?.(e);
      }}
      style={[styles.base, styles[variante], !principal && style, styleAnime]}
      onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
      accessibilityState={{ disabled: !!disabled, busy: attente }}
      {...props}>
      {attente && principal && largeur > 0 && <BalleQuiRoule largeur={largeur} />}
      {Icone && <Icone couleur={couleur} taille={18} />}
      <Text maxFontSizeMultiplier={1.3} style={[styles.texte, { color: couleur }]}>{titre}</Text>
    </PressableAnime>
  );
  if (!principal) return bouton;
  // La tranche reste en place, le bouton descend dessus
  return <View style={[styles.tranche, disabled && !attente && styles.inactif, style]}>{bouton}</View>;
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    base: {
      minHeight: 52,
      minWidth: Espaces.cibleTactile,
      paddingHorizontal: 24,
      borderRadius: Rayons.bouton,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Avec sa tranche, le bouton rouge a la même hauteur totale que les autres (alignés côte à côte)
    principal: { backgroundColor: c.rouge, minHeight: 52 - TRANCHE },
    tranche: { paddingBottom: TRANCHE, borderRadius: Rayons.bouton, backgroundColor: c.rougeTranche },
    inactif: { opacity: 0.6 },
    balleRoule: {
      position: 'absolute',
      left: 14,
      top: '50%',
      marginTop: -TAILLE_BALLE / 2,
      width: TAILLE_BALLE,
      height: TAILLE_BALLE,
      borderRadius: TAILLE_BALLE / 2,
      backgroundColor: c.surRouge,
      overflow: 'hidden',
      alignItems: 'center',
    },
    coutureBalle: { width: 2, height: TAILLE_BALLE, backgroundColor: c.rouge },
    secondaire: { backgroundColor: c.carte, borderWidth: 1, borderColor: c.trait },
    lien: { minHeight: Espaces.cibleTactile },
    texte: { ...Polices.texteDemi, fontSize: Tailles.texte },
  });
