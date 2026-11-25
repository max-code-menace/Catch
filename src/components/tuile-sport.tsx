import { useEffect, useRef, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { IconeCoche } from '@/components/icones';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import { ImagesSports } from '@/donnees/images-sports';
import type { Sport } from '@/donnees/pictos';
import { useCouleurs, useStyles, type Palette } from '@/lib/theme';

/** Ressort court de la tuile qui reprend sa taille après s'être tassée */
const RESSORT_TASSE = { duration: 320, dampingRatio: 0.55 };

/**
 * Tuile d'un sport à choisir (Créer, Profil > Mes sports) : la photo du sport, son nom dessous.
 * Choisie : contour foncé, coche rouge dans le coin, et la photo se tasse sous le doigt au moment du choix.
 */
export function TuileSport({
  sport,
  icone,
  nom,
  choisie,
  largeur,
  nombre,
  description,
  onPress,
}: {
  /** Le sport dont on montre la photo… */
  sport?: Sport;
  /** …ou une icône sur fond uni (« Tous » du menu de la carte) */
  icone?: ReactNode;
  nom: string;
  choisie: boolean;
  largeur: number | `${number}%`;
  /** Nombre de sessions, en pastille dans le coin (menu de la carte) */
  nombre?: number;
  /** Ce que lit VoiceOver, si ce n'est pas juste le nom */
  description?: string;
  onPress: () => void;
}) {
  const c = useCouleurs();
  const styles = useStyles(creerStyles);
  const reduit = useReducedMotion();
  const echelle = useSharedValue(1);
  const premier = useRef(true);

  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    if (!choisie || reduit) return;
    echelle.set(withSequence(withTiming(0.92, { duration: 90 }), withSpring(1, RESSORT_TASSE)));
  }, [choisie, reduit, echelle]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: echelle.get() }] }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={description ?? nom}
      accessibilityState={{ selected: choisie }}
      onPress={onPress}
      style={({ pressed }) => [{ width: largeur }, pressed && { opacity: 0.85 }]}>
      <Animated.View style={[styles.cadre, choisie && styles.cadreChoisi, style]}>
        {sport ? (
          <Image source={ImagesSports[sport]} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.uni}>{icone}</View>
        )}
        {!!nombre && !choisie && (
          <View style={styles.nombre}>
            <Text maxFontSizeMultiplier={1.2} style={styles.nombreTexte}>
              {nombre}
            </Text>
          </View>
        )}
        {choisie && (
          <View style={styles.coche}>
            <IconeCoche couleur={c.surRouge} taille={12} />
          </View>
        )}
      </Animated.View>
      <Text
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[styles.nom, choisie && styles.nomChoisi]}>
        {nom}
      </Text>
    </Pressable>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    cadre: {
      aspectRatio: 3 / 2,
      borderRadius: 14,
      overflow: 'hidden',
      borderWidth: 2.5,
      borderColor: 'transparent',
    },
    // Sur le fond orange des photos, le rouge ne se voit pas : contour couleur encre
    cadreChoisi: { borderWidth: 3, borderColor: c.encre },
    image: { width: '100%', height: '100%' },
    uni: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.beige },
    nombre: {
      position: 'absolute',
      top: 4,
      right: 4,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 5,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.encre,
    },
    nombreTexte: { fontFamily: Polices.texteDemi, fontSize: Tailles.minuscule, color: c.surEncre },
    coche: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 20,
      height: 20,
      borderRadius: Rayons.pilule,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.rouge,
      borderWidth: 1.5,
      borderColor: c.surRouge,
    },
    nom: {
      marginTop: 4,
      textAlign: 'center',
      fontFamily: Polices.texteMoyen,
      fontSize: Tailles.pastille,
      color: c.encre,
    },
    nomChoisi: { fontFamily: Polices.texteDemi, color: c.rougeTexte },
  });
