import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Mot, motsDe } from '@/components/marqueur';
import { Polices, Rayons, Tailles } from '@/constants/theme';
import type { Champ, Morceau } from '@/lib/phrase-creation';
import { useStyles, type Palette } from '@/lib/theme';

/** Un des trois points qui respirent dans un trou : il reste quelque chose à choisir ici */
function Point({ delai }: { delai: number }) {
  const styles = useStyles(creerStyles);
  const reduit = useReducedMotion();
  const echelle = useSharedValue(1);
  useEffect(() => {
    if (reduit) return;
    echelle.set(
      withDelay(delai, withRepeat(withSequence(withTiming(0.6, { duration: 450 }), withTiming(1.1, { duration: 450 })), -1, true)),
    );
  }, [reduit, delai, echelle]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: echelle.get() }] }));
  return <Animated.View style={[styles.point, style]} />;
}

type Props = {
  morceaux: Morceau[];
  /** Toucher un mot choisi ou un trou : on descend jusqu'au choix correspondant */
  onToucher: (champ: Champ) => void;
};

/**
 * La phrase de Créer : « Je lance du foot ce soir à 19h, à 10 joueurs. Rendez-vous Parc Josaphat. »
 * Chaque choix est surligné au marqueur (le trait se redessine quand il change) ; ce qui manque est un trou en pointillés.
 */
export function PhraseCreation({ morceaux, onToucher }: Props) {
  const styles = useStyles(creerStyles);
  return (
    <View style={styles.phrase}>
      {morceaux.map((morceau, i) => {
        if (morceau.type === 'trou') {
          return (
            <Pressable
              key={`trou-${morceau.champ}`}
              accessibilityRole="button"
              accessibilityLabel={`À choisir : ${morceau.texte}`}
              onPress={() => onToucher(morceau.champ)}
              hitSlop={4}
              style={({ pressed }) => [styles.trou, pressed && styles.presse]}>
              <Point delai={0} />
              <Point delai={150} />
              <Point delai={300} />
              <Text maxFontSizeMultiplier={1.3} style={styles.trouTexte}>
                {morceau.texte}
              </Text>
            </Pressable>
          );
        }
        const mots = motsDe(morceau.texte);
        if (morceau.type === 'texte') {
          return mots.map((mot, j) => (
            <Text key={`${i}-${j}`} maxFontSizeMultiplier={1.3} style={styles.texte}>
              {j === mots.length - 1 ? `${mot} ` : mot}
            </Text>
          ));
        }
        // Un choix : chaque mot peut passer à la ligne ; le premier porte ce que lit VoiceOver
        return mots.map((mot, j) => (
          <Pressable
            key={`${i}-${j}`}
            accessible={j === 0}
            accessibilityRole="button"
            accessibilityLabel={j === 0 ? `${morceau.texte}. Changer` : undefined}
            onPress={() => onToucher(morceau.champ)}
            style={({ pressed }) => [styles.mot, pressed && styles.presse]}>
            <Mot
              texte={mot}
              anime
              delai={j * 70}
              style={styles.choix}
            />
            {/* L'espace après le mot reste hors du trait, sauf entre deux mots du même choix */}
            {j === mots.length - 1 && (
              <Text maxFontSizeMultiplier={1.3} style={styles.texte}>{`${morceau.ponctuation ?? ''} `}</Text>
            )}
          </Pressable>
        ));
      })}
    </View>
  );
}

const creerStyles = (c: Palette) =>
  StyleSheet.create({
    phrase: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 4 },
    texte: { fontFamily: Polices.titreDemi, fontSize: Tailles.titreSession, lineHeight: 36, color: c.encre },
    choix: { fontFamily: Polices.titre, fontSize: Tailles.titreSession, lineHeight: 36, color: c.encre },
    mot: { flexDirection: 'row', alignItems: 'center' },
    presse: { opacity: 0.6 },
    trou: {
      height: 36,
      marginRight: 6,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: Rayons.pilule,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: c.orange,
      backgroundColor: c.orangeDoux,
    },
    point: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.orange },
    trouTexte: { marginLeft: 4, fontFamily: Polices.texteDemi, fontSize: Tailles.petit, color: c.orangeTexte },
  });
