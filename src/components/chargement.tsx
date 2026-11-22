import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Balle } from '@/components/balle';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Phrases qui défilent pendant qu'on attend : l'attente raconte quelque chose. */
export const PHRASES_SESSIONS = ['On cherche des joueurs…', 'On gonfle les ballons…', 'On trace les lignes…'];

/** Un rebond complet de la balle (montée + descente) */
const REBOND = 900;
const ECRASEMENT = 0.18;

/**
 * La balle orange qui rebondit sur place, avec son ombre : c'est elle qui attend avec toi.
 * Trajectoire en parabole (lente en haut, rapide en bas) et balle écrasée en touchant le sol.
 * Avec « Réduire les animations », elle reste posée.
 */
export function BalleRebond({ taille = 32, hauteur = 56 }: { taille?: number; hauteur?: number }) {
  const styles = useStyles(creerStyles);
  const reduit = useReducedMotion();
  const avancee = useSharedValue(0);

  useEffect(() => {
    if (reduit) return;
    avancee.set(withRepeat(withTiming(1, { duration: REBOND, easing: Easing.linear }), -1, false));
  }, [avancee, reduit]);

  const styleBalle = useAnimatedStyle(() => {
    const p = avancee.get();
    const altitude = 4 * p * (1 - p);
    // Près du sol (début et fin du rebond), la balle s'écrase un peu
    const sol = Math.max(0, 1 - Math.min(p, 1 - p) / 0.07);
    return {
      transform: [
        { translateY: -hauteur * altitude + (taille * ECRASEMENT * sol) / 2 },
        { scaleX: 1 + ECRASEMENT * sol },
        { scaleY: 1 - ECRASEMENT * sol },
      ],
    };
  });
  const styleOmbre = useAnimatedStyle(() => {
    const p = avancee.get();
    const altitude = 4 * p * (1 - p);
    return { opacity: 0.22 - 0.14 * altitude, transform: [{ scaleX: 1 - 0.5 * altitude }] };
  });

  return (
    <View style={{ height: hauteur + taille + 6, width: taille * 1.6, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Animated.View style={styleBalle}>
        <Balle taille={taille} />
      </Animated.View>
      <Animated.View style={[styles.ombre, { width: taille, height: Math.max(4, taille / 6) }, styleOmbre]} />
    </View>
  );
}

/** Une phrase à la fois, qui monte et laisse la place à la suivante. */
function PhrasesQuiDefilent({ phrases }: { phrases: string[] }) {
  const styles = useStyles(creerStyles);
  const reduit = useReducedMotion();
  const [rang, setRang] = useState(0);

  useEffect(() => {
    if (phrases.length < 2) return;
    const minuteur = setInterval(() => setRang((r) => r + 1), 1400);
    return () => clearInterval(minuteur);
  }, [phrases.length]);

  const phrase = phrases[rang % phrases.length];
  return (
    <View style={styles.zonePhrase}>
      <Animated.Text
        key={rang}
        maxFontSizeMultiplier={1.3}
        entering={reduit ? undefined : FadeInDown.duration(250)}
        exiting={reduit ? undefined : FadeOutUp.duration(200)}
        style={styles.phrase}>
        {phrase}
      </Animated.Text>
    </View>
  );
}

/**
 * Attente d'un écran : la balle qui rebondit et des phrases qui défilent.
 * `carte` : posée sur une petite carte blanche (par-dessus la carte des sessions).
 */
export function Chargement({ phrases = PHRASES_SESSIONS, carte = false }: { phrases?: string[]; carte?: boolean }) {
  const styles = useStyles(creerStyles);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={phrases[0]}
      style={[styles.chargement, carte && styles.surCarte]}>
      <BalleRebond />
      <PhrasesQuiDefilent phrases={phrases} />
    </View>
  );
}

/** Petit dessin de terrain à la place de l'image d'une carte qui n'est pas encore arrivée. */
function TerrainFantome({ couleur }: { couleur: string }) {
  return (
    <Svg width={56} height={56} viewBox="0 0 56 56" fill="none" stroke={couleur} strokeWidth={1.5}>
      <Rect x={6} y={10} width={44} height={36} rx={2} />
      <Path d="M28 10v36" />
      <Circle cx={28} cy={28} r={7} />
    </Svg>
  );
}

/**
 * Cartes « fantômes » pendant le premier chargement d'une liste : on voit la forme de ce qui arrive
 * (les lignes d'un terrain, la place du titre) au lieu d'un texte « Chargement… ».
 */
export function CartesFantomes({ nombre = 3, accessibilityLabel = 'Chargement' }: { nombre?: number; accessibilityLabel?: string }) {
  const styles = useStyles(creerStyles);
  const c = useCouleurs();
  const reduit = useReducedMotion();
  const souffle = useSharedValue(0);

  useEffect(() => {
    if (reduit) return;
    souffle.set(withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [souffle, reduit]);

  const styleSouffle = useAnimatedStyle(() => ({ opacity: 1 - 0.45 * souffle.get() }));

  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={accessibilityLabel} style={styles.fantomes}>
      {Array.from({ length: nombre }, (_, i) => (
        <Animated.View key={i} style={[styles.fantome, styleSouffle]}>
          <View style={styles.fantomeImage}>
            <TerrainFantome couleur={c.trait} />
          </View>
          <View style={styles.fantomeTextes}>
            <View style={[styles.barre, { width: i % 2 ? '50%' : '65%' }]} />
            <View style={[styles.barre, styles.barreFine, { width: i % 2 ? '35%' : '42%' }]} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    ombre: { borderRadius: Rayons.pilule, backgroundColor: c.encre },
    chargement: { alignItems: 'center', gap: 14, paddingVertical: 24 },
    surCarte: {
      paddingVertical: 18,
      paddingHorizontal: 28,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      boxShadow: c.ombreFlottante,
    },
    zonePhrase: { height: 26, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', minWidth: 220 },
    phrase: { fontFamily: Polices.titreDemi, fontSize: Tailles.accent, color: c.encre, textAlign: 'center' },
    fantomes: { gap: 12 },
    fantome: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      backgroundColor: c.carte,
      borderRadius: Rayons.carte,
      borderWidth: 1,
      borderColor: c.trait,
    },
    fantomeImage: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: c.beige,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fantomeTextes: { flex: 1, gap: 8 },
    barre: { height: 12, borderRadius: Rayons.pilule, backgroundColor: c.beige },
    barreFine: { height: 10 },
  });
